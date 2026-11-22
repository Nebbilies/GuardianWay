import { beforeAll, beforeEach, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import prisma from "../../src/config/prisma";
import redisClient from "../../src/config/redis";
import { resetAndSeed, TEST_PASSWORD } from "./fixtures";
import { loadApp } from "./helpers/login";
const { seedDemo } = require("../../prisma/seed-demo.cjs");
let app: Express;
beforeAll(async () => {
    app = await loadApp();
});
beforeEach(async () => {
    await resetAndSeed();
    await redisClient.flushDb();
});
const environment = {
    BOOTSTRAP_PLATFORM_EMAIL: "bootstrap-platform@gw.test",
    BOOTSTRAP_PLATFORM_PASSWORD: TEST_PASSWORD,
    DEMO_ADMIN_EMAIL: "bootstrap-admin@gw.test",
    DEMO_ADMIN_PASSWORD: TEST_PASSWORD,
    DEMO_USER_PASSWORD: "LocalRolePassword123!",
    DEMO_SCHOOL_CODE: "BOOTSTRAP",
};

it("seeds registration, access and trip scenarios and preserves edits on repeat", async () => {
    await seedDemo(prisma, environment);
    const school = await prisma.school.findUniqueOrThrow({
        where: { code: environment.DEMO_SCHOOL_CODE },
    });
    const where = { schoolId: school.id };
    expect(await prisma.student.count({ where })).toBe(8);
    expect(
        await prisma.userAccount.count({ where: { ...where, role: "PARENT" } }),
    ).toBe(4);
    expect(await prisma.driverProfile.count({ where })).toBe(2);
    expect(await prisma.vehicle.count({ where })).toBe(2);
    expect(await prisma.plannedRoute.count({ where })).toBe(2);
    const registrations = await prisma.serviceRegistration.findMany({
        where,
        distinct: ["status"],
        select: { status: true },
    });
    expect(registrations.map((row) => row.status).sort()).toEqual([
        "APPROVED",
        "PENDING",
        "REJECTED",
    ]);
    const trackingOnly = await prisma.guardianLink.findMany({
        where: { ...where, canTrack: true, canRequest: false },
        select: { studentId: true, guardianAccountId: true },
    });
    expect(trackingOnly).toHaveLength(2);
    expect(
        new Set(trackingOnly.map((link) => link.guardianAccountId)).size,
    ).toBe(1);
    expect(
        await prisma.serviceRegistration.count({
            where: {
                ...where,
                studentId: { in: trackingOnly.map((link) => link.studentId) },
            },
        }),
    ).toBe(0);
    const trips = () =>
        prisma.trip.findMany({
            where,
            orderBy: { id: "asc" },
            include: { TripPassengerByTripId: { orderBy: { id: "asc" } } },
        });
    const before = await trips();
    expect(before.map((t) => t.status).sort()).toEqual([
        "CANCELLED",
        "COMPLETED",
        "PLANNED",
        "PLANNED",
    ]);
    const planned = before.filter((t) => t.status === "PLANNED");
    expect(planned.some((t) => t.TripPassengerByTripId.length === 0)).toBe(
        true,
    );
    expect(planned.some((t) => t.TripPassengerByTripId.length > 0)).toBe(true);
    const closed = before.find((t) => t.status === "COMPLETED")!;
    expect(closed.TripPassengerByTripId).toHaveLength(2);
    expect(closed.closedReconciliationId).toBeTruthy();
    for (const passenger of closed.TripPassengerByTripId) {
        const events = await prisma.attendanceEvent.findMany({
            where: { tripPassengerId: passenger.id },
            orderBy: { occurredAt: "asc" },
        });
        expect(events.map((e) => e.eventKind)).toEqual(["BOARD", "ALIGHT"]);
    }
    const student = await prisma.student.findFirstOrThrow({ where });
    await prisma.student.update({
        where: { id: student.id },
        data: { fullName: "Edited demo student" },
    });
    await seedDemo(prisma, environment);
    expect(await trips()).toEqual(before);
    expect(await prisma.student.count({ where })).toBe(8);
    expect(
        await prisma.student.findUnique({ where: { id: student.id } }),
    ).toMatchObject({ fullName: "Edited demo student" });
});

it("bootstraps usable demo logins and preserves existing passwords on repeat", async () => {
    await seedDemo(prisma, environment);
    const first = await request(app)
        .post("/api/auth/token/login")
        .send({ email: environment.DEMO_ADMIN_EMAIL, password: TEST_PASSWORD });
    expect(first.status).toBe(200);
    expect(first.body.user.role).toBe("ADMIN");
    const driver = await prisma.userAccount.findFirstOrThrow({
        where: { schoolId: first.body.user.schoolId, role: "DRIVER" },
    });
    const login = await request(app).post("/api/auth/token/login").send({
        email: driver.email,
        password: environment.DEMO_USER_PASSWORD,
    });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe("DRIVER");
    await seedDemo(prisma, {
        ...environment,
        DEMO_ADMIN_PASSWORD: "DifferentPassword123!",
    });
    const same = await request(app)
        .post("/api/auth/token/login")
        .send({ email: environment.DEMO_ADMIN_EMAIL, password: TEST_PASSWORD });
    expect(same.status).toBe(200);
    expect(same.body.user.id).toBe(first.body.user.id);
    expect(
        (
            await request(app).post("/api/auth/token/login").send({
                email: environment.DEMO_ADMIN_EMAIL,
                password: "DifferentPassword123!",
            })
        ).status,
    ).toBe(401);
});

it("refuses a second platform identity during Compose provisioning", async () => {
    await expect(
        seedDemo(
            prisma,
            {
                BOOTSTRAP_PLATFORM_EMAIL: "second@gw.test",
                BOOTSTRAP_PLATFORM_PASSWORD: TEST_PASSWORD,
            },
            { firstPlatformOnly: true },
        ),
    ).rejects.toThrow("A platform administrator already exists");
    expect(
        await prisma.userAccount.count({ where: { email: "second@gw.test" } }),
    ).toBe(0);
});

it("does not add a demo administrator to a pre-existing school with the same code", async () => {
    const environment = {
        BOOTSTRAP_PLATFORM_EMAIL: "bootstrap-platform@gw.test",
        BOOTSTRAP_PLATFORM_PASSWORD: TEST_PASSWORD,
        DEMO_ADMIN_EMAIL: "unexpected-admin@gw.test",
        DEMO_ADMIN_PASSWORD: TEST_PASSWORD,
        DEMO_SCHOOL_CODE: "A",
    };
    await expect(seedDemo(prisma, environment)).rejects.toThrow(
        "Demo school code belongs to a different school",
    );
    expect(
        await prisma.userAccount.count({
            where: { email: environment.DEMO_ADMIN_EMAIL },
        }),
    ).toBe(0);
});
