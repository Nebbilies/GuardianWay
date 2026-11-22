import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import prisma from "../../src/config/prisma";

export const TEST_PASSWORD = "Password123!";

export async function resetDatabase() {
    const url = new URL(process.env.DATABASE_URL ?? "");
    if (
        process.env.NODE_ENV !== "test" ||
        !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
        url.pathname !== "/guardianway_test"
    ) {
        throw new Error(
            "Integration reset requires the temporary guardianway_test database",
        );
    }
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        AND tablename NOT LIKE '\\_prisma%' AND tablename <> 'spatial_ref_sys'
    `;
    if (!tables.length) {
        return;
    }
    const list = tables
        .map((t) => '"public"."' + t.tablename.replaceAll('"', '""') + '"')
        .join(", ");
    await prisma.$executeRawUnsafe(
        "TRUNCATE TABLE " + list + " RESTART IDENTITY CASCADE",
    );
}

export async function resetAndSeed() {
    await resetDatabase();
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    const mkSchool = (code: string) =>
        prisma.school.create({
            data: {
                code,
                name: "Truong " + code,
                address: "1 Duong " + code,
                timezone: "Asia/Ho_Chi_Minh",
                status: "ACTIVE",
            },
        });
    const schoolA = await mkSchool("A");
    const schoolB = await mkSchool("B");
    const mkUser = (
        displayName: string,
        email: string,
        role: string,
        schoolId: string | null,
    ) =>
        prisma.userAccount.create({
            data: {
                displayName,
                email,
                role,
                schoolId,
                passwordHash,
                status: "ACTIVE",
                activatedAt: new Date(),
            },
        });
    const superAdmin = await mkUser(
        "Super Admin",
        "super@gw.test",
        "PLATFORM_ADMIN",
        null,
    );
    const adminA = await mkUser(
        "Admin A",
        "admin-a@gw.test",
        "SCHOOL_ADMIN",
        schoolA.id,
    );
    const adminB = await mkUser(
        "Admin B",
        "admin-b@gw.test",
        "SCHOOL_ADMIN",
        schoolB.id,
    );
    const parentA = await mkUser(
        "Parent A",
        "parent-a@gw.test",
        "PARENT",
        schoolA.id,
    );
    const driverA = await mkUser(
        "Driver A",
        "driver-a@gw.test",
        "DRIVER",
        schoolA.id,
    );
    const driverB = await mkUser(
        "Driver B",
        "driver-b@gw.test",
        "DRIVER",
        schoolB.id,
    );
    const mkResources = async (
        schoolId: string,
        adminId: string,
        accountId: string,
    ) => {
        const vehicle = await prisma.vehicle.create({
            data: {
                schoolId,
                code: "BUS001",
                plateNumber: schoolId.slice(0, 8).toUpperCase(),
                studentCapacity: 29,
                status: "AVAILABLE",
            },
        });
        const driver = await prisma.driverProfile.create({
            data: {
                schoolId,
                accountId,
                code: "DRV001",
                fullName: "Driver",
                phone: "0900000000",
                status: "AVAILABLE",
            },
        });
        const stop = await prisma.stop.create({
            data: {
                schoolId,
                code: "STOP001",
                name: "Diem don",
                address: "1 Duong",
                latitude: 10.77,
                longitude: 106.69,
                kind: "SERVICE_POINT",
                allowsPickup: true,
                allowsDropoff: true,
                status: "ACTIVE",
            },
        });
        const policy = await prisma.schoolPolicyVersion.create({
            data: {
                schoolId,
                versionNo: 1,
                effectiveFrom: new Date("2026-01-01Z"),
                status: "APPROVED",
                approvedById: adminId,
                approvedAt: new Date(),
                approvalBasis: "Test",
                pickupArrivalTime: new Date("1970-01-01T08:00Z"),
            },
        });
        const plan = await prisma.planVersion.create({
            data: {
                schoolId,
                planKey: randomUUID(),
                versionNo: 1,
                referenceDate: new Date("2026-09-01Z"),
                direction: "PICKUP",
                policyVersionId: policy.id,
                inputSnapshot: { source: "MANUAL" },
                pickupArrivalDeadline: new Date("1970-01-01T08:00Z"),
                status: "APPROVED",
                createdById: adminId,
                approvedById: adminId,
                approvedAt: new Date(),
                effectiveFrom: new Date("2026-09-01Z"),
            },
        });
        const route = await prisma.plannedRoute.create({
            data: {
                schoolId,
                planVersionId: plan.id,
                routeCode: "R001",
                label: "Tuyen 1",
                vehicleId: vehicle.id,
                capacitySnapshot: 29,
                distanceMetres: 12000,
                durationSeconds: 1800,
            },
        });
        const plannedStop = await prisma.plannedStop.create({
            data: {
                schoolId,
                routeId: route.id,
                stopId: stop.id,
                sequenceNo: 1,
                plannedTime: new Date("1970-01-01T07:00Z"),
                stopSnapshot: {
                    code: stop.code,
                    name: stop.name,
                    address: stop.address,
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                    kind: stop.kind,
                    accessNote: stop.accessNote,
                },
            },
        });
        const schedule = await prisma.recurringSchedule.create({
            data: {
                schoolId,
                scheduleKey: randomUUID(),
                versionNo: 1,
                routeId: route.id,
                effectiveFrom: new Date("2026-09-01Z"),
                direction: "PICKUP",
                plannedStartTime: new Date("1970-01-01T06:30Z"),
                defaultVehicleId: vehicle.id,
                defaultDriverId: driver.id,
                status: "ACTIVE",
                createdById: adminId,
            },
        });
        await prisma.scheduleWeekday.create({
            data: { schoolId, scheduleId: schedule.id, isoWeekday: 2 },
        });
        const trip = await prisma.trip.create({
            data: {
                schoolId,
                scheduleId: schedule.id,
                scheduleKey: schedule.scheduleKey,
                serviceDate: new Date("2026-09-01Z"),
                direction: "PICKUP",
                plannedStartAt: new Date("2026-08-31T23:30Z"),
                initialVehicleId: vehicle.id,
                initialDriverId: driver.id,
                operatingPolicyId: policy.id,
                status: "PLANNED",
                dataVersion: 1,
            },
        });
        await prisma.tripStop.create({
            data: {
                schoolId,
                tripId: trip.id,
                logicalStopKey: randomUUID(),
                versionNo: 1,
                plannedStopId: plannedStop.id,
                stopId: stop.id,
                sequenceNo: 1,
                plannedAt: new Date("2026-09-01T00:00Z"),
                stopSnapshot: plannedStop.stopSnapshot!,
                effectiveFrom: new Date(),
                changedById: adminId,
            },
        });
        const student = await prisma.student.create({
            data: {
                schoolId,
                studentCode: "HS001",
                fullName: "Hoc sinh",
                classLabel: "5A",
                status: "ACTIVE",
            },
        });
        return {
            vehicle,
            driver,
            stop,
            policy,
            plan,
            route,
            schedule,
            trip,
            student,
        };
    };
    const a = await mkResources(schoolA.id, adminA.id, driverA.id);
    const b = await mkResources(schoolB.id, adminB.id, driverB.id);
    return {
        schoolA,
        schoolB,
        superAdmin,
        adminA,
        adminB,
        parentA,
        driverA,
        busA: a.vehicle,
        busB: b.vehicle,
        stopA: a.stop,
        stopB: b.stop,
        routeA: a.route,
        routeB: b.route,
        tripA: a.trip,
        tripB: b.trip,
        studentA: a.student,
        studentB: b.student,
        resourcesA: a,
        resourcesB: b,
    };
}
export type Fixture = Awaited<ReturnType<typeof resetAndSeed>>;
