import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import prisma from "../../src/config/prisma";
import { resetAndSeed, type Fixture } from "./fixtures";
import { loadApp, loginAs } from "./helpers/login";
import redisClient from "../../src/config/redis";

const LIST_ENDPOINTS = [
    "/api/buses",
    "/api/route-plans",
    "/api/bus-stops",
    "/api/bus-trips",
    "/api/students",
] as const;

function rowsOf(body: unknown): Array<Record<string, unknown>> {
    // List endpoints return { data: [...] } with pagination metadata alongside.
    const data = (body as { data?: unknown }).data;
    if (!Array.isArray(data)) throw new Error(`expected { data: [] }, got ${JSON.stringify(body)}`);
    return data as Array<Record<string, unknown>>;
}

describe("tenant isolation", () => {
    let app: Express;
    let fx: Fixture;
    let cookiesA: string[];
    let cookiesB: string[];
    let cookiesSuper: string[];

    beforeAll(async () => {
        app = await loadApp();
    });

    beforeEach(async () => {
        fx = await resetAndSeed();
        // Login rate-limit counters live in Redis and outlive a test; this file logs
        // in three accounts per case, so leaving them uncleared trips the per-IP
        // budget partway through. Clear them the same way the rate-limit suite does.
        await redisClient.flushDb();
        cookiesA = await loginAs(app, fx.adminA.email);
        cookiesB = await loginAs(app, fx.adminB.email);
        cookiesSuper = await loginAs(app, fx.superAdmin.email);
    });

    describe("list endpoints return only the caller's school", () => {
        for (const endpoint of LIST_ENDPOINTS) {
            it(`${endpoint} scopes to school A for admin A`, async () => {
                const res = await request(app).get(endpoint).set("Cookie", cookiesA);
                expect(res.status).toBe(200);
                const rows = rowsOf(res.body);
                expect(rows.length).toBeGreaterThan(0);
                for (const row of rows) {
                    expect(row.schoolId).toBe(fx.schoolA.id);
                }
            });

            it(`${endpoint} scopes to school B for admin B`, async () => {
                const res = await request(app).get(endpoint).set("Cookie", cookiesB);
                expect(res.status).toBe(200);
                const rows = rowsOf(res.body);
                expect(rows.length).toBeGreaterThan(0);
                for (const row of rows) {
                    expect(row.schoolId).toBe(fx.schoolB.id);
                }
            });
        }
    });

    it("audit logs are scoped to the caller's school", async () => {
        const res = await request(app).get("/api/audit-logs").set("Cookie", cookiesA);
        expect(res.status).toBe(200);
        const rows = rowsOf(res.body);
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) {
            expect(row.schoolId).toBe(fx.schoolA.id);
        }
    });

    it("deleting another school's bus returns 404 and leaves the row intact", async () => {
        const res = await request(app)
            .delete(`/api/buses/${fx.busB.id}`)
            .set("Cookie", cookiesA);

        expect(res.status).toBe(404);

        const survivor = await prisma.vehicle.findFirst({ where: { id: fx.busB.id } });
        expect(survivor).not.toBeNull();
        expect(survivor?.deletedAt).toBeNull();
    });

    it("reading another school's student by id returns 404, not 403", async () => {
        const res = await request(app)
            .get(`/api/students/${fx.studentB.id}`)
            .set("Cookie", cookiesA);

        // 403 would confirm the row exists. 404 leaks nothing.
        expect(res.status).toBe(404);
    });

    it("a forged schoolId query param on audit logs is overridden, not honoured", async () => {
        // The audit query schema declares schoolId, so it survives validation and
        // reaches the repository — the explicit authenticated school scope must win.
        const res = await request(app)
            .get(`/api/audit-logs?schoolId=${fx.schoolB.id}`)
            .set("Cookie", cookiesA);

        expect(res.status).toBe(200);
        const rows = rowsOf(res.body);
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) {
            expect(row.schoolId).toBe(fx.schoolA.id);
        }
    });

    it("a forged schoolId query param on buses is stripped at validation", async () => {
        const res = await request(app)
            .get(`/api/buses?schoolId=${fx.schoolB.id}`)
            .set("Cookie", cookiesA);

        expect(res.status).toBe(200);
        const rows = rowsOf(res.body);
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) {
            expect(row.schoolId).toBe(fx.schoolA.id);
        }
    });

    it("a forged schoolId in a vehicle create body is rejected", async () => {
        const res = await request(app).post("/api/buses").set("Cookie", cookiesA)
            .send({ code: "BUS2", plateNumber: "51A99999", studentCapacity: 16, status: "AVAILABLE", schoolId: fx.schoolB.id });
        expect(res.status).toBe(400);
    });

    it("a forged schoolId in a strict create body is rejected", async () => {
        const res = await request(app)
            .post("/api/students")
            .set("Cookie", cookiesA)
            .send({
                fullName: "Hoc sinh moi",
                studentCode: "HS-A-002",
                classLabel: "5B",
                schoolId: fx.schoolB.id,
            });

        // createStudentBodySchema is .strict(), so the unknown key fails validation.
        expect(res.status).toBe(400);
    });

    it("platform audit excludes school operational actions", async () => {
        const platformChange = await request(app).patch("/api/schools/" + fx.schoolA.id).set("Cookie", cookiesSuper).send({ name: "Updated school" });
        expect(platformChange.status).toBe(200);
        const schoolChange = await request(app).patch("/api/buses/" + fx.busA.id).set("Cookie", cookiesA).send({ description: "Changed" });
        expect(schoolChange.status).toBe(200);
        const res = await request(app).get("/api/audit-logs").set("Cookie", cookiesSuper);
        expect(rowsOf(res.body).some(row => row.action === "school.update")).toBe(true);
        expect(res.status).toBe(200);
        expect(rowsOf(res.body).every(row => (row.changeSummary as { scope: string }).scope === "PLATFORM")).toBe(true);
        expect(rowsOf(res.body).some(row => row.action === "vehicle.update")).toBe(false);
    });
});
