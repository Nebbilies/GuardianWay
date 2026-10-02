import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import type { Prisma } from "@prisma/client";
import prisma from "../../src/config/prisma";
import redisClient from "../../src/config/redis";
import { resetAndSeed, TEST_PASSWORD, type Fixture } from "./fixtures";
import { loadApp } from "./helpers/login";

describe("mobile bearer-token authentication", () => {
    let app: Express;
    let fx: Fixture;

    beforeAll(async () => {
        app = await loadApp();
    });

    beforeEach(async () => {
        fx = await resetAndSeed();
        await redisClient.flushDb();
    });

    async function tokenLogin(email = fx.driverA.email) {
        return request(app)
            .post("/api/auth/token/login")
            .send({ email, password: TEST_PASSWORD });
    }

    it("returns a no-store JSON session without cookies for mobile login", async () => {
        const res = await tokenLogin();

        expect(res.status).toBe(200);
        expect(res.headers["set-cookie"]).toBeUndefined();
        expect(res.headers["cache-control"]).toContain("no-store");
        expect(res.headers.pragma).toBe("no-cache");
        expect(res.body.user).toEqual({
            id: fx.driverA.id,
            name: "Driver A",
            email: fx.driverA.email,
            role: "DRIVER",
            schoolId: fx.schoolA.id,
        });
        expect(res.body.session).toEqual({
            tokenType: "Bearer",
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            accessTokenExpiresIn: 900,
            refreshTokenExpiresIn: 604800,
        });
    });

    it("preserves the web cookie response and keeps token values out of its body", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: fx.adminA.email, password: TEST_PASSWORD });

        expect(res.status).toBe(200);
        expect(res.body.user).toEqual({
            id: fx.adminA.id,
            name: "Admin A",
            email: fx.adminA.email,
            role: "ADMIN",
        });
        expect(res.body.session).toBeUndefined();
        expect(res.body.accessToken).toBeUndefined();
        expect(res.body.refreshToken).toBeUndefined();
        expect(res.headers["set-cookie"]).toEqual(
            expect.arrayContaining([
                expect.stringContaining("gw_access_token="),
                expect.stringContaining("gw_refresh_token="),
            ]),
        );
    });

    it("preserves web refresh rotation through cookies", async () => {
        const login = await request(app)
            .post("/api/auth/login")
            .send({ email: fx.adminA.email, password: TEST_PASSWORD });

        const refresh = await request(app)
            .post("/api/auth/refresh")
            .set("Cookie", login.headers["set-cookie"]);

        expect(refresh.status).toBe(200);
        expect(refresh.body).toEqual({
            user: {
                id: fx.adminA.id,
                name: "Admin A",
                email: fx.adminA.email,
                role: "ADMIN",
            },
        });
        expect(refresh.headers["set-cookie"]).toEqual(
            expect.arrayContaining([
                expect.stringContaining("gw_access_token="),
                expect.stringContaining("gw_refresh_token="),
            ]),
        );
    });

    it("supports /me through bearer access tokens and reads current user data", async () => {
        const login = await tokenLogin();
        expect(login.status).toBe(200);

        await prisma.user.update({ where: { id: fx.driverA.id }, data: { name: "Updated Driver" } });

        const res = await request(app)
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${login.body.session.accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            user: {
                id: fx.driverA.id,
                name: "Updated Driver",
                email: fx.driverA.email,
                role: "DRIVER",
                schoolId: fx.schoolA.id,
            },
        });
    });

    it("supports /me through the existing web access cookie", async () => {
        const login = await request(app)
            .post("/api/auth/login")
            .send({ email: fx.adminA.email, password: TEST_PASSWORD });

        const res = await request(app)
            .get("/api/auth/me")
            .set("Cookie", login.headers["set-cookie"]);

        expect(res.status).toBe(200);
        expect(res.body.user).toMatchObject({ id: fx.adminA.id, role: "ADMIN", schoolId: fx.schoolA.id });
    });

    it("rotates a mobile refresh token and rejects replay of the old token", async () => {
        const login = await tokenLogin();
        const oldRefreshToken = login.body.session.refreshToken as string;

        const refresh = await request(app)
            .post("/api/auth/token/refresh")
            .send({ refreshToken: oldRefreshToken });

        expect(refresh.status).toBe(200);
        expect(refresh.headers["set-cookie"]).toBeUndefined();
        expect(refresh.headers["cache-control"]).toContain("no-store");
        expect(refresh.body.session.refreshToken).not.toBe(oldRefreshToken);

        const replay = await request(app)
            .post("/api/auth/token/refresh")
            .send({ refreshToken: oldRefreshToken });

        expect(replay.status).toBe(401);
    });

    it("allows only one concurrent refresh for a single token", async () => {
        const login = await tokenLogin();
        const refreshToken = login.body.session.refreshToken as string;

        const [first, second] = await Promise.all([
            request(app).post("/api/auth/token/refresh").send({ refreshToken }),
            request(app).post("/api/auth/token/refresh").send({ refreshToken }),
        ]);

        expect([first.status, second.status].sort()).toEqual([200, 401]);
    });

    it("revokes the mobile refresh token on logout and treats repeated logout as success", async () => {
        const login = await tokenLogin();
        const refreshToken = login.body.session.refreshToken as string;

        const logout = await request(app)
            .post("/api/auth/token/logout")
            .send({ refreshToken });
        const repeatedLogout = await request(app)
            .post("/api/auth/token/logout")
            .send({ refreshToken });
        const refresh = await request(app)
            .post("/api/auth/token/refresh")
            .send({ refreshToken });

        expect(logout.status).toBe(200);
        expect(repeatedLogout.status).toBe(200);
        expect(refresh.status).toBe(401);
    });

    it("treats mobile logout without a refresh token as success", async () => {
        const logout = await request(app).post("/api/auth/token/logout").send({});

        expect(logout.status).toBe(200);
        expect(logout.body).toEqual({ message: "Đăng xuất thành công" });
    });

    it.each([
        ["inactive", { isActive: false }],
        ["soft-deleted", { deletedAt: new Date() }],
        ["password setup required", { passwordSetupRequired: true }],
    ] as const)("rejects /me and revokes sessions for a %s account", async (_state, update) => {
        const login = await tokenLogin();
        const accessToken = login.body.session.accessToken as string;
        const refreshToken = login.body.session.refreshToken as string;

        await prisma.user.update({
            where: { id: fx.driverA.id },
            data: update as Prisma.UserUpdateInput,
        });

        const me = await request(app)
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${accessToken}`);
        const refresh = await request(app)
            .post("/api/auth/token/refresh")
            .send({ refreshToken });
        const sessions = await prisma.refreshToken.findMany({ where: { userId: fx.driverA.id } });

        expect(me.status).toBe(401);
        expect(refresh.status).toBe(401);
        expect(sessions.length).toBeGreaterThan(0);
        expect(sessions.every((session) => session.revokedAt !== null)).toBe(true);
    });

    it("shares login rate-limit budget between cookie and token endpoints", async () => {
        for (let attempt = 0; attempt < 5; attempt += 1) {
            const failedWebLogin = await request(app)
                .post("/api/auth/login")
                .send({ email: fx.driverA.email, password: "wrong-password" });
            expect(failedWebLogin.status).toBe(401);
        }

        const blockedTokenLogin = await tokenLogin();
        expect(blockedTokenLogin.status).toBe(429);
    });
});
