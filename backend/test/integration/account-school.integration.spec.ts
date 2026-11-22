import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../src/config/prisma";
import redisClient from "../../src/config/redis";
import { resetAndSeed, TEST_PASSWORD, type Fixture } from "./fixtures";
import { loadApp, loginAs } from "./helpers/login";

describe("account, school and stateless auth boundaries", () => {
    let app: Express, fx: Fixture;
    beforeAll(async () => {
        app = await loadApp();
    });
    beforeEach(async () => {
        fx = await resetAndSeed();
        await redisClient.flushDb();
    });
    it("activates an invitation once and reserves its email after soft deletion", async () => {
        const cookies = await loginAs(app, fx.adminA.email);
        const created = await request(app)
            .post("/api/users")
            .set("Cookie", cookies)
            .send({
                displayName: "New parent",
                email: " NEW-PARENT@gw.test ",
                role: "PARENT",
            });
        expect(created.status).toBe(201);
        expect(created.body.account).toMatchObject({
            email: "new-parent@gw.test",
            status: "INVITED",
        });
        expect(created.body.account).not.toHaveProperty("passwordHash");
        const token = new URL(created.body.inviteLink).searchParams.get(
            "token",
        );
        const results = await Promise.all(
            [1, 2].map(() =>
                request(app)
                    .post("/api/auth/setup-password")
                    .send({ token, password: TEST_PASSWORD }),
            ),
        );
        expect(results.filter((result) => result.status === 200)).toHaveLength(
            1,
        );
        const rejected = results.find((result) => result.status !== 200);
        expect([400, 409]).toContain(rejected?.status);
        expect(rejected?.body.code).toBe("INVITATION_INVALID");
        expect(
            (
                await request(app).post("/api/auth/token/login").send({
                    email: "new-parent@gw.test",
                    password: TEST_PASSWORD,
                })
            ).status,
        ).toBe(200);
        expect(
            (
                await request(app)
                    .delete("/api/users/" + created.body.account.id)
                    .set("Cookie", cookies)
            ).status,
        ).toBe(200);
        const duplicate = await request(app)
            .post("/api/users")
            .set("Cookie", cookies)
            .send({
                displayName: "Another parent",
                email: "new-parent@gw.test",
                role: "PARENT",
            });
        expect(duplicate.status).toBe(409);
        expect(duplicate.body.code).toBe("ACCOUNT_EMAIL_EXISTS");
    });
    it("revokes pending invitations when the recipient email changes", async () => {
        const cookies = await loginAs(app, fx.adminA.email);
        const created = await request(app)
            .post("/api/users")
            .set("Cookie", cookies)
            .send({
                displayName: "Parent",
                email: "previous@gw.test",
                role: "PARENT",
            });
        expect(created.status).toBe(201);
        const update = await request(app)
            .patch("/api/users/" + created.body.account.id)
            .set("Cookie", cookies)
            .send({ email: "current@gw.test" });
        expect(update.status).toBe(200);
        const token = new URL(created.body.inviteLink).searchParams.get(
            "token",
        );
        const rejected = await request(app)
            .post("/api/auth/setup-password")
            .send({ token, password: TEST_PASSWORD });
        expect(rejected.status).toBe(400);
        expect(rejected.body.code).toBe("INVITATION_INVALID");
    });
    it("ends previous refresh sessions when an account completes password replacement", async () => {
        const cookies = await loginAs(app, fx.adminA.email);
        const login = await request(app)
            .post("/api/auth/token/login")
            .send({ email: fx.driverA.email, password: TEST_PASSWORD });
        expect(login.status).toBe(200);
        const invite = await request(app)
            .post("/api/users/" + fx.driverA.id + "/invite")
            .set("Cookie", cookies);
        expect(invite.status).toBe(200);
        const token = new URL(invite.body.inviteLink).searchParams.get("token");
        const password = "ReplacementPassword123!";
        expect(
            (
                await request(app)
                    .post("/api/auth/setup-password")
                    .send({ token, password })
            ).status,
        ).toBe(200);
        const prior = await request(app)
            .post("/api/auth/token/refresh")
            .send({ refreshToken: login.body.session.refreshToken });
        expect(prior.status).toBe(401);
        expect(
            (
                await request(app)
                    .post("/api/auth/token/login")
                    .send({ email: fx.driverA.email, password })
            ).status,
        ).toBe(200);
    });
    it("revokes the rotated refresh session when logout uses its previous token", async () => {
        const login = await request(app)
            .post("/api/auth/token/login")
            .send({ email: fx.adminA.email, password: TEST_PASSWORD });
        const refreshToken = login.body.session.refreshToken;
        const rotated = await request(app)
            .post("/api/auth/token/refresh")
            .send({ refreshToken });
        expect(rotated.status).toBe(200);
        expect(
            (
                await request(app)
                    .post("/api/auth/token/logout")
                    .send({ refreshToken })
            ).status,
        ).toBe(200);
        expect(
            (
                await request(app)
                    .post("/api/auth/token/refresh")
                    .send({ refreshToken: rotated.body.session.refreshToken })
            ).status,
        ).toBe(401);
    });
    it("keeps access stateless while refresh uses the current account state", async () => {
        const login = await request(app)
            .post("/api/auth/token/login")
            .send({ email: fx.adminA.email, password: TEST_PASSWORD });
        await prisma.userAccount.update({
            where: { id: fx.adminA.id },
            data: { status: "LOCKED" },
        });
        expect(
            (
                await request(app)
                    .get("/api/students")
                    .set(
                        "Authorization",
                        "Bearer " + login.body.session.accessToken,
                    )
            ).status,
        ).toBe(200);
        expect(
            (
                await request(app)
                    .post("/api/auth/token/refresh")
                    .send({ refreshToken: login.body.session.refreshToken })
            ).status,
        ).toBe(401);
        const invalidScope = jwt.sign(
            {
                userId: fx.adminA.id,
                role: "SCHOOL_ADMIN",
                schoolId: null,
                contractVersion: 2,
                tokenUse: "access",
            },
            process.env.JWT_ACCESS_SECRET!,
            { expiresIn: 900 },
        );
        expect(
            (
                await request(app)
                    .get("/api/students")
                    .set("Authorization", "Bearer " + invalidScope)
            ).status,
        ).toBe(401);
        const oldContract = jwt.sign(
            { userId: fx.adminA.id, role: "ADMIN", schoolId: fx.schoolA.id },
            process.env.JWT_ACCESS_SECRET!,
            { expiresIn: 900 },
        );
        expect(
            (
                await request(app)
                    .get("/api/students")
                    .set("Authorization", "Bearer " + oldContract)
            ).status,
        ).toBe(401);
    });
    it("protects schools with running trips and restricts platform administration", async () => {
        const platform = await loginAs(app, fx.superAdmin.email);
        await prisma.trip.update({
            where: { id: fx.tripA.id },
            data: { status: "OPEN" },
        });
        const blocked = await request(app)
            .delete("/api/schools/" + fx.schoolA.id)
            .set("Cookie", platform);
        expect(blocked.status).toBe(409);
        expect(blocked.body.code).toBe("SCHOOL_HAS_OPEN_TRIPS");
        const forbidden = await request(app)
            .post("/api/schools/" + fx.schoolA.id + "/admins")
            .set("Cookie", platform)
            .send({
                displayName: "Parent",
                email: "parent-platform@gw.test",
                role: "PARENT",
            });
        expect(forbidden.status).toBe(403);
        expect(forbidden.body.code).toBe("AUTHORIZATION_ERROR");
        expect(
            (
                await request(app)
                    .patch("/api/schools/" + fx.schoolB.id)
                    .set("Cookie", platform)
                    .send({ status: "INACTIVE" })
            ).status,
        ).toBe(200);
        expect(
            (
                await request(app)
                    .post("/api/auth/token/login")
                    .send({ email: fx.adminB.email, password: TEST_PASSWORD })
            ).status,
        ).toBe(401);
    });
    it("rolls back a new driver account when its profile cannot be linked", async () => {
        const cookies = await loginAs(app, fx.adminA.email);
        const res = await request(app)
            .post("/api/drivers/onboarding")
            .set("Cookie", cookies)
            .send({
                account: {
                    displayName: "New driver",
                    email: "rolled-back@gw.test",
                },
                driverId: fx.resourcesA.driver.id,
            });
        expect(res.status).toBe(409);
        const search = await request(app)
            .get("/api/users?search=rolled-back%40gw.test")
            .set("Cookie", cookies);
        expect(search.status).toBe(200);
        expect(search.body.data).toEqual([]);
    });
});
