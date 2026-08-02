// Regression test for AuthService.createRefreshToken's jwtid claim. Without it,
// two logins for the same user signed within the same wall-clock second produce
// byte-identical refresh token JWTs (same payload, same iat), which collide on
// RefreshToken.tokenHash's unique constraint and turn the second login into a 409.
// Date.now is frozen for the two login calls so the collision window is exercised
// deterministically, regardless of how fast bcrypt/Postgres happen to run on the
// machine executing this test.
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Express } from "express";
import prisma from "../../src/config/prisma";
import { resetAndSeed, TEST_PASSWORD, type Fixture } from "./fixtures";
import { loadApp } from "./helpers/login";

describe("auth refresh token uniqueness", () => {
    let app: Express;
    let fx: Fixture;

    beforeAll(async () => {
        app = await loadApp();
    });

    beforeEach(async () => {
        fx = await resetAndSeed();
    });

    it("issues two distinct refresh tokens for two logins signed in the same second", async () => {
        const frozenNow = Date.now();
        const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(frozenNow);

        let first: request.Response;
        let second: request.Response;
        try {
            first = await request(app)
                .post("/api/auth/login")
                .send({ email: fx.adminA.email, password: TEST_PASSWORD });
            second = await request(app)
                .post("/api/auth/login")
                .send({ email: fx.adminA.email, password: TEST_PASSWORD });
        } finally {
            dateNowSpy.mockRestore();
        }

        expect(first.status).toBe(200);
        expect(second.status).toBe(200);

        const tokens = await prisma.refreshToken.findMany({
            where: { userId: fx.adminA.id },
        });
        expect(tokens).toHaveLength(2);
        expect(tokens[0].tokenHash).not.toBe(tokens[1].tokenHash);
    });
});
