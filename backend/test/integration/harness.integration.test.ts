import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { resetAndSeed, type Fixture } from "./fixtures";
import { loadApp, loginAs } from "./helpers/login";

describe("integration harness", () => {
    let app: Express;
    let fx: Fixture;

    beforeAll(async () => {
        app = await loadApp();
        fx = await resetAndSeed();
    });

    it("connects to a migrated database and seeds two schools", () => {
        expect(fx.schoolA.id).toBeTruthy();
        expect(fx.schoolB.id).toBeTruthy();
        expect(fx.schoolA.id).not.toBe(fx.schoolB.id);
    });

    it("authenticates a seeded admin through the real login endpoint", async () => {
        const cookies = await loginAs(app, fx.adminA.email);
        expect(cookies.some((c) => c.startsWith("gw_access_token="))).toBe(true);
    });

    it("serves an authenticated request with the returned cookies", async () => {
        const cookies = await loginAs(app, fx.adminA.email);
        const res = await request(app).get("/api/buses").set("Cookie", cookies);
        expect(res.status).toBe(200);
    });

    it("rejects the same request without cookies", async () => {
        const res = await request(app).get("/api/buses");
        expect(res.status).toBe(401);
    });

    describe("security headers", () => {
        it("sets nosniff and denies framing on API responses", async () => {
            const res = await request(app).get("/");
            expect(res.headers["x-content-type-options"]).toBe("nosniff");
            expect(res.headers["x-frame-options"]).toBe("DENY");
        });

        it("does not assert HSTS, because there is no TLS in this topology", async () => {
            const res = await request(app).get("/");
            expect(res.headers["strict-transport-security"]).toBeUndefined();
        });

        it("removes the x-powered-by banner", async () => {
            const res = await request(app).get("/");
            expect(res.headers["x-powered-by"]).toBeUndefined();
        });
    });
});
