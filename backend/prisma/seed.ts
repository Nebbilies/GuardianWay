// GuardianWay seed — a realistic, multi-tenant snapshot.
//
// Mirrors a small production dataset:
//   • 1 platform SUPER_ADMIN (no school)
//   • 2 schools (tenants), each fully populated: ADMIN + drivers + parents +
//     students, buses, stops, routes (+ ordered stops), and trips.
//   • One COMPLETED pickup trip per school with real tracking logs (inserted via
//     $executeRaw, since TrackingLog.location is geography/NOT NULL and outside the
//     Prisma Client — this is exactly the ingest path), trip events, and boarding records.
//
// Run:  npm run seed   (from backend/)
// Idempotent: find-or-create on natural keys, so re-running won't duplicate rows.
// All seeded accounts share the password below and can log in immediately.

import prisma from "../src/config/prisma";
import bcrypt from "bcrypt";
import {
    Role,
    BusStatus,
    BusTripStatus,
    TripType,
    TripEventType,
    BoardingAction,
} from "@prisma/client";

const DEV_PASSWORD = "Password123!";

// A datetime `offsetDays` from today at hh:mm (UTC), as a full timestamptz.
const dayAt = (offsetDays: number, hh: number, mm = 0) => {
    const d = new Date();
    d.setUTCHours(hh, mm, 0, 0);
    d.setUTCDate(d.getUTCDate() + offsetDays);
    return d;
};

// ─────────────────────────── find-or-create helpers ───────────────────────────

async function findOrCreateUser(data: {
    name: string;
    email: string;
    role: Role;
    schoolId: string | null;
    passwordHash: string;
    phoneNumber?: string;
    address?: string;
}) {
    const existing = await prisma.user.findFirst({ where: { email: data.email } });
    if (existing) return existing;
    return prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            role: data.role,
            schoolId: data.schoolId,
            password: data.passwordHash,
            passwordSetupRequired: false,
            phoneNumber: data.phoneNumber,
            address: data.address,
        },
    });
}

async function findOrCreateStop(schoolId: string, stop: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    isSchoolStop?: boolean;
}) {
    const existing = await prisma.busStop.findFirst({
        where: { schoolId, name: stop.name },
    });
    if (existing) return existing;
    // location is a generated column — only lat/lng are written here.
    return prisma.busStop.create({ data: { schoolId, ...stop } });
}

async function findOrCreateBus(schoolId: string, bus: {
    licensePlate: string;
    model: string;
    capacity: number;
    status?: BusStatus;
}) {
    const existing = await prisma.bus.findFirst({
        where: { schoolId, licensePlate: bus.licensePlate },
    });
    if (existing) return existing;
    return prisma.bus.create({ data: { schoolId, ...bus } });
}

async function findOrCreateRoute(schoolId: string, name: string, description: string, totalDistance: number) {
    const existing = await prisma.busRoute.findFirst({ where: { schoolId, name } });
    if (existing) return existing;
    return prisma.busRoute.create({ data: { schoolId, name, description, totalDistance } });
}

// TrackingLog is a Timescale hypertable with a NOT NULL geography column that the
// Prisma Client can't write — this is the raw ingest write path.
async function insertTrackingLog(row: {
    schoolId: string;
    busTripId: string;
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    recordedAt: Date;
}) {
    await prisma.$executeRaw`
        INSERT INTO "TrackingLog"
            ("id", "schoolId", "busTripId", "location", "speed", "heading", "accuracy", "recordedAt", "receivedAt")
        VALUES (
            gen_random_uuid(),
            ${row.schoolId}::uuid,
            ${row.busTripId}::uuid,
            ST_SetSRID(ST_MakePoint(${row.lng}, ${row.lat}), 4326)::geography,
            ${row.speed},
            ${row.heading},
            8.0,
            ${row.recordedAt},
            ${row.recordedAt}
        )`;
}

// ─────────────────────────── per-school builder ───────────────────────────

interface SchoolSeed {
    name: string;
    slug: string;
    address: string;
    domain: string; // email domain for this school's accounts
    schoolStop: { name: string; address: string; latitude: number; longitude: number };
    pickupStops: { name: string; address: string; latitude: number; longitude: number }[];
    buses: { licensePlate: string; model: string; capacity: number; status?: BusStatus }[];
    drivers: { name: string; license: string }[];
    parents: { name: string; phone: string }[];
    students: { fullName: string; studentId: string; studentClass: string; dob: string; parentIndex: number }[];
}

async function seedSchool(cfg: SchoolSeed, passwordHash: string) {
    // School (upsert by unique slug).
    const school = await prisma.school.upsert({
        where: { slug: cfg.slug },
        create: { name: cfg.name, slug: cfg.slug, address: cfg.address },
        update: { name: cfg.name, address: cfg.address },
    });

    // Admin.
    await findOrCreateUser({
        name: `Quản trị ${cfg.name}`,
        email: `admin@${cfg.domain}`,
        role: Role.ADMIN,
        schoolId: school.id,
        passwordHash,
    });

    // Drivers (User + DriverProfile).
    const drivers = [];
    for (const d of cfg.drivers) {
        const user = await findOrCreateUser({
            name: d.name,
            email: `${d.license.toLowerCase()}@${cfg.domain}`,
            role: Role.DRIVER,
            schoolId: school.id,
            passwordHash,
        });
        const profile = await prisma.driverProfile.upsert({
            where: { userId: user.id },
            create: { userId: user.id, licenseNumber: d.license },
            update: { licenseNumber: d.license },
        });
        drivers.push(profile);
    }

    // Parents.
    const parents = [];
    for (let i = 0; i < cfg.parents.length; i++) {
        const p = cfg.parents[i];
        parents.push(await findOrCreateUser({
            name: p.name,
            email: `parent${i + 1}@${cfg.domain}`,
            role: Role.PARENT,
            schoolId: school.id,
            passwordHash,
            phoneNumber: p.phone,
        }));
    }

    // Students (linked to parents). studentId is unique per school only among
    // active rows (partial index), so find-or-create rather than upsert.
    const students = [];
    for (const s of cfg.students) {
        const parent = parents[s.parentIndex];
        const existing = await prisma.studentProfile.findFirst({
            where: { studentId: s.studentId, schoolId: school.id, deletedAt: null },
        });
        const student = existing ?? await prisma.studentProfile.create({
            data: {
                schoolId: school.id,
                fullName: s.fullName,
                studentId: s.studentId,
                studentClass: s.studentClass,
                dateOfBirth: new Date(`${s.dob}T00:00:00Z`),
                parentId: parent?.id ?? null,
            },
        });
        students.push(student);
    }

    // Buses.
    const buses = [];
    for (const b of cfg.buses) buses.push(await findOrCreateBus(school.id, b));

    // Stops (school stop + pickup stops).
    const schoolStop = await findOrCreateStop(school.id, { ...cfg.schoolStop, isSchoolStop: true });
    const pickupStops = [];
    for (const s of cfg.pickupStops) pickupStops.push(await findOrCreateStop(school.id, s));

    // Route: pickup stops in order, ending at the school.
    const route = await findOrCreateRoute(
        school.id,
        `Tuyến sáng - ${cfg.name}`,
        `${cfg.pickupStops.map((s) => s.name).join(" → ")} → ${cfg.schoolStop.name}`,
        12.5,
    );
    const orderedStops = [...pickupStops, schoolStop];
    for (let i = 0; i < orderedStops.length; i++) {
        const isFinal = i === orderedStops.length - 1;
        await prisma.routeStop.upsert({
            where: { routeId_stopOrder: { routeId: route.id, stopOrder: i + 1 } },
            create: {
                routeId: route.id,
                stopId: orderedStops[i].id,
                stopOrder: i + 1,
                scheduledTime: new Date(Date.UTC(1970, 0, 1, 6, 30 + i * 8)),
                isFinalStop: isFinal,
            },
            update: { stopId: orderedStops[i].id, isFinalStop: isFinal },
        });
    }

    // Trips: a completed pickup (yesterday) + scheduled pickup/dropoff (today & tomorrow).
    const tripsExist = await prisma.busTrip.count({ where: { schoolId: school.id } });
    if (tripsExist === 0) {
        // COMPLETED pickup yesterday.
        const completed = await prisma.busTrip.create({
            data: {
                schoolId: school.id,
                routeId: route.id,
                busId: buses[0].id,
                driverId: drivers[0].id,
                tripType: TripType.PICKUP,
                scheduledStartTime: dayAt(-1, 6, 30),
                scheduledEndTime: dayAt(-1, 7, 20),
                actualStartTime: dayAt(-1, 6, 31),
                actualEndTime: dayAt(-1, 7, 18),
                status: BusTripStatus.COMPLETED,
            },
        });

        // Trip events: started, arrived/departed each pickup stop, completed.
        await prisma.tripEvent.create({
            data: { schoolId: school.id, busTripId: completed.id, eventType: TripEventType.STARTED, occurredAt: dayAt(-1, 6, 31) },
        });
        for (let i = 0; i < pickupStops.length; i++) {
            await prisma.tripEvent.create({
                data: { schoolId: school.id, busTripId: completed.id, stopId: pickupStops[i].id, eventType: TripEventType.ARRIVED_STOP, occurredAt: dayAt(-1, 6, 40 + i * 8) },
            });
            await prisma.tripEvent.create({
                data: { schoolId: school.id, busTripId: completed.id, stopId: pickupStops[i].id, eventType: TripEventType.DEPARTED_STOP, occurredAt: dayAt(-1, 6, 42 + i * 8) },
            });
        }
        await prisma.tripEvent.create({
            data: { schoolId: school.id, busTripId: completed.id, eventType: TripEventType.COMPLETED, occurredAt: dayAt(-1, 7, 18) },
        });

        // Tracking logs (raw ingest) — a handful of points from stops toward the school.
        const path = [...pickupStops, schoolStop];
        for (let i = 0; i < path.length; i++) {
            await insertTrackingLog({
                schoolId: school.id,
                busTripId: completed.id,
                lat: path[i].latitude,
                lng: path[i].longitude,
                speed: 18 + i * 3,
                heading: 90,
                recordedAt: dayAt(-1, 6, 40 + i * 8),
            });
        }

        // Boarding records: most students boarded at the first stop, one absent.
        // recordedBy is the driver's User account (DriverProfile.userId).
        for (let i = 0; i < students.length; i++) {
            const boarded = i < students.length - 1;
            await prisma.boardingRecord.create({
                data: {
                    actionType: boarded ? BoardingAction.BOARDED : BoardingAction.ABSENT,
                    recordedBy: drivers[0].userId,
                    studentId: students[i].id,
                    tripId: completed.id,
                    stopId: pickupStops[0].id,
                    occurredAt: dayAt(-1, 6, 41),
                },
            });
        }

        // SCHEDULED pickup (today) + dropoff (today).
        await prisma.busTrip.create({
            data: {
                schoolId: school.id, routeId: route.id, busId: buses[0].id, driverId: drivers[0].id,
                tripType: TripType.PICKUP, scheduledStartTime: dayAt(0, 6, 30), scheduledEndTime: dayAt(0, 7, 20),
                status: BusTripStatus.SCHEDULED,
            },
        });
        await prisma.busTrip.create({
            data: {
                schoolId: school.id, routeId: route.id, busId: buses[0].id,
                driverId: drivers[Math.min(1, drivers.length - 1)].id,
                tripType: TripType.DROPOFF, scheduledStartTime: dayAt(0, 16, 30), scheduledEndTime: dayAt(0, 17, 20),
                status: BusTripStatus.SCHEDULED,
            },
        });
        // SCHEDULED pickup tomorrow.
        await prisma.busTrip.create({
            data: {
                schoolId: school.id, routeId: route.id, busId: buses[Math.min(1, buses.length - 1)].id, driverId: drivers[0].id,
                tripType: TripType.PICKUP, scheduledStartTime: dayAt(1, 6, 30), scheduledEndTime: dayAt(1, 7, 20),
                status: BusTripStatus.SCHEDULED,
            },
        });
    }

    console.log(`✓ ${cfg.name}: ${cfg.drivers.length} drivers, ${cfg.parents.length} parents, ${cfg.students.length} students, ${cfg.buses.length} buses`);
    return school;
}

// ─────────────────────────── data ───────────────────────────

const SCHOOLS: SchoolSeed[] = [
    {
        name: "Trường Tiểu học Nguyễn Du",
        slug: "nguyen-du",
        address: "43 Nguyễn Du, Quận 1, TP. Hồ Chí Minh",
        domain: "nguyendu.edu.vn",
        schoolStop: { name: "Cổng trường Nguyễn Du", address: "43 Nguyễn Du, Quận 1", latitude: 10.7797, longitude: 106.6921 },
        pickupStops: [
            { name: "Chợ Bến Thành", address: "Lê Lợi, Quận 1", latitude: 10.7721, longitude: 106.698 },
            { name: "Landmark 81", address: "720A Điện Biên Phủ, Bình Thạnh", latitude: 10.7949, longitude: 106.7219 },
            { name: "Bến xe Miền Đông", address: "292 Đinh Bộ Lĩnh, Bình Thạnh", latitude: 10.8151, longitude: 106.711 },
        ],
        buses: [
            { licensePlate: "51B-12345", model: "Hyundai County", capacity: 29 },
            { licensePlate: "51B-67890", model: "Thaco TB85", capacity: 35 },
            { licensePlate: "51F-11111", model: "Ford Transit", capacity: 16, status: BusStatus.MAINTENANCE },
        ],
        drivers: [
            { name: "Trần Văn Hùng", license: "B2-100001" },
            { name: "Lê Minh Tuấn", license: "B2-100002" },
        ],
        parents: [
            { name: "Nguyễn Thị Lan", phone: "0901000001" },
            { name: "Phạm Văn Nam", phone: "0901000002" },
            { name: "Võ Thị Hoa", phone: "0901000003" },
        ],
        students: [
            { fullName: "Nguyễn Minh An", studentId: "ND2026001", studentClass: "3A", dob: "2017-03-12", parentIndex: 0 },
            { fullName: "Nguyễn Minh Khôi", studentId: "ND2026002", studentClass: "1B", dob: "2019-07-05", parentIndex: 0 },
            { fullName: "Phạm Gia Bảo", studentId: "ND2026003", studentClass: "4C", dob: "2016-11-20", parentIndex: 1 },
            { fullName: "Võ Hà My", studentId: "ND2026004", studentClass: "2A", dob: "2018-01-30", parentIndex: 2 },
        ],
    },
    {
        name: "Trường THCS Lê Quý Đôn",
        slug: "le-quy-don",
        address: "110 Nguyễn Thị Minh Khai, Quận 3, TP. Hồ Chí Minh",
        domain: "lequydon.edu.vn",
        schoolStop: { name: "Cổng trường Lê Quý Đôn", address: "110 NTMK, Quận 3", latitude: 10.7818, longitude: 106.6905 },
        pickupStops: [
            { name: "Phú Mỹ Hưng", address: "Nguyễn Văn Linh, Quận 7", latitude: 10.7295, longitude: 106.7215 },
            { name: "Bến xe Miền Tây", address: "395 Kinh Dương Vương, Bình Tân", latitude: 10.7405, longitude: 106.619 },
        ],
        buses: [
            { licensePlate: "50A-22222", model: "Samco Felix", capacity: 45 },
            { licensePlate: "50A-33333", model: "Hyundai Universe", capacity: 45 },
        ],
        drivers: [
            { name: "Đỗ Quốc Cường", license: "D-200001" },
            { name: "Bùi Thanh Sơn", license: "D-200002" },
        ],
        parents: [
            { name: "Trần Thị Kim", phone: "0902000001" },
            { name: "Hoàng Văn Đức", phone: "0902000002" },
        ],
        students: [
            { fullName: "Trần Anh Dũng", studentId: "LQD2026001", studentClass: "8A", dob: "2012-05-18", parentIndex: 0 },
            { fullName: "Hoàng Thu Trang", studentId: "LQD2026002", studentClass: "7B", dob: "2013-09-02", parentIndex: 1 },
            { fullName: "Hoàng Nhật Minh", studentId: "LQD2026003", studentClass: "9C", dob: "2011-12-25", parentIndex: 1 },
        ],
    },
];

async function main() {
    const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

    // Platform super admin (no school).
    await findOrCreateUser({
        name: "Quản trị hệ thống",
        email: "superadmin@guardianway.vn",
        role: Role.SUPER_ADMIN,
        schoolId: null,
        passwordHash,
    });
    console.log("✓ Platform SUPER_ADMIN (superadmin@guardianway.vn)");

    for (const cfg of SCHOOLS) await seedSchool(cfg, passwordHash);

    const counts = {
        schools: await prisma.school.count(),
        users: await prisma.user.count(),
        students: await prisma.studentProfile.count(),
        buses: await prisma.bus.count(),
        trips: await prisma.busTrip.count(),
        trackingLogs: await prisma.trackingLog.count(),
    };
    console.log("Seed complete:", counts);
    console.log(`All accounts password: ${DEV_PASSWORD}`);
}

main()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
