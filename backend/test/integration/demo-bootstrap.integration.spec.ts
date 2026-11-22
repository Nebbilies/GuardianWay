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
it("bootstraps usable demo logins and preserves existing passwords on repeat", async () => {
    const environment = {
        BOOTSTRAP_PLATFORM_EMAIL: "bootstrap-platform@gw.test",
        BOOTSTRAP_PLATFORM_PASSWORD: TEST_PASSWORD,
        DEMO_ADMIN_EMAIL: "bootstrap-admin@gw.test",
        DEMO_ADMIN_PASSWORD: TEST_PASSWORD,
        DEMO_SCHOOL_CODE: "BOOTSTRAP",
    };
    await seedDemo(prisma, environment);
    const first = await request(app)
        .post("/api/auth/token/login")
        .send({ email: environment.DEMO_ADMIN_EMAIL, password: TEST_PASSWORD });
    expect(first.status).toBe(200);
    expect(first.body.user.role).toBe("ADMIN");
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
