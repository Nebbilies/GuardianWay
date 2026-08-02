import bcrypt from "bcrypt";
import { BusStatus, BusTripStatus, Role, TripType } from "@prisma/client";
import prisma from "../../src/config/prisma";

export const TEST_PASSWORD = "Password123!";

export interface Fixture {
    schoolA: { id: string; slug: string };
    schoolB: { id: string; slug: string };
    superAdmin: { id: string; email: string };
    adminA: { id: string; email: string };
    adminB: { id: string; email: string };
    parentA: { id: string; email: string };
    driverA: { id: string; email: string };
    busA: { id: string };
    busB: { id: string };
    stopA: { id: string };
    stopB: { id: string };
    routeA: { id: string };
    routeB: { id: string };
    tripA: { id: string };
    tripB: { id: string };
    studentA: { id: string };
    studentB: { id: string };
}

export async function resetDatabase() {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND tablename NOT LIKE '\\_prisma%'
    `;
    if (tables.length === 0) return;
    const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

export async function resetAndSeed(): Promise<Fixture> {
    await resetDatabase();
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

    const schoolA = await prisma.school.create({
        data: { name: "Truong A", address: "1 Duong A", slug: "truong-a" },
    });
    const schoolB = await prisma.school.create({
        data: { name: "Truong B", address: "2 Duong B", slug: "truong-b" },
    });

    const mkUser = (name: string, email: string, role: Role, schoolId: string | null) =>
        prisma.user.create({
            data: {
                name, email, role, schoolId,
                password: passwordHash,
                passwordSetupRequired: false,
            },
        });

    const superAdmin = await mkUser("Super Admin", "super@gw.test", Role.SUPER_ADMIN, null);
    const adminA = await mkUser("Admin A", "admin-a@gw.test", Role.ADMIN, schoolA.id);
    const adminB = await mkUser("Admin B", "admin-b@gw.test", Role.ADMIN, schoolB.id);
    const parentA = await mkUser("Parent A", "parent-a@gw.test", Role.PARENT, schoolA.id);
    const driverAUser = await mkUser("Driver A", "driver-a@gw.test", Role.DRIVER, schoolA.id);
    const driverBUser = await mkUser("Driver B", "driver-b@gw.test", Role.DRIVER, schoolB.id);

    const driverProfileA = await prisma.driverProfile.create({
        data: { userId: driverAUser.id, licenseNumber: "A-0001" },
    });
    const driverProfileB = await prisma.driverProfile.create({
        data: { userId: driverBUser.id, licenseNumber: "B-0001" },
    });

    const mkBus = (schoolId: string, plate: string) =>
        prisma.bus.create({
            data: { schoolId, licensePlate: plate, model: "Hyundai County", capacity: 29, status: BusStatus.ACTIVE },
        });
    const busA = await mkBus(schoolA.id, "51A-00001");
    const busB = await mkBus(schoolB.id, "51B-00002");

    // BusStop.location is a PostGIS geography column outside the Prisma Client, but it
    // is nullable — plain creates are fine here. Only TrackingLog requires raw SQL.
    const mkStop = (schoolId: string, name: string, lat: number, lng: number) =>
        prisma.busStop.create({
            data: { schoolId, name, address: `${name} address`, latitude: lat, longitude: lng },
        });
    const stopA = await mkStop(schoolA.id, "Diem A1", 10.77, 106.69);
    const stopA2 = await mkStop(schoolA.id, "Diem A2", 10.78, 106.70);
    const stopB = await mkStop(schoolB.id, "Diem B1", 21.02, 105.83);
    const stopB2 = await mkStop(schoolB.id, "Diem B2", 21.03, 105.84);

    const mkRoute = async (schoolId: string, name: string, s1: string, s2: string) => {
        const route = await prisma.busRoute.create({ data: { schoolId, name } });
        await prisma.routeStop.createMany({
            data: [
                { routeId: route.id, stopId: s1, stopOrder: 1 },
                { routeId: route.id, stopId: s2, stopOrder: 2, isFinalStop: true },
            ],
        });
        return route;
    };
    const routeA = await mkRoute(schoolA.id, "Tuyen A", stopA.id, stopA2.id);
    const routeB = await mkRoute(schoolB.id, "Tuyen B", stopB.id, stopB2.id);

    const mkTrip = (schoolId: string, routeId: string, busId: string, driverId: string) =>
        prisma.busTrip.create({
            data: {
                schoolId, routeId, busId, driverId,
                tripType: TripType.PICKUP,
                status: BusTripStatus.SCHEDULED,
                scheduledStartTime: new Date("2026-09-01T00:00:00.000Z"),
                scheduledEndTime: new Date("2026-09-01T01:00:00.000Z"),
            },
        });
    const tripA = await mkTrip(schoolA.id, routeA.id, busA.id, driverProfileA.id);
    const tripB = await mkTrip(schoolB.id, routeB.id, busB.id, driverProfileB.id);

    const mkStudent = (schoolId: string, fullName: string, studentId: string) =>
        prisma.studentProfile.create({
            data: {
                schoolId, fullName, studentId,
                studentClass: "5A",
                dateOfBirth: new Date("2016-05-01T00:00:00.000Z"),
            },
        });
    const studentA = await mkStudent(schoolA.id, "Hoc sinh A", "HS-A-001");
    const studentB = await mkStudent(schoolB.id, "Hoc sinh B", "HS-B-001");

    return {
        schoolA: { id: schoolA.id, slug: schoolA.slug },
        schoolB: { id: schoolB.id, slug: schoolB.slug },
        superAdmin: { id: superAdmin.id, email: superAdmin.email },
        adminA: { id: adminA.id, email: adminA.email },
        adminB: { id: adminB.id, email: adminB.email },
        parentA: { id: parentA.id, email: parentA.email },
        driverA: { id: driverAUser.id, email: driverAUser.email },
        busA: { id: busA.id }, busB: { id: busB.id },
        stopA: { id: stopA.id }, stopB: { id: stopB.id },
        routeA: { id: routeA.id }, routeB: { id: routeB.id },
        tripA: { id: tripA.id }, tripB: { id: tripB.id },
        studentA: { id: studentA.id }, studentB: { id: studentB.id },
    };
}
