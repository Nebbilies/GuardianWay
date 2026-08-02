import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import prisma from "../../src/config/prisma";
import { resetAndSeed, type Fixture } from "./fixtures";
import { loadApp, loginAs } from "./helpers/login";

const LIST_ENDPOINTS = [
    "/api/buses",
    "/api/bus-routes",
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

        const survivor = await prisma.bus.findFirst({ where: { id: fx.busB.id } });
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
        // reaches the repository — the extension must win.
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

    it("a forged schoolId in a non-strict create body is ignored", async () => {
        const res = await request(app)
            .post("/api/buses")
            .set("Cookie", cookiesA)
            .send({
                licensePlate: "51A-99999",
                model: "Ford Transit",
                capacity: 16,
                status: "ACTIVE",
                schoolId: fx.schoolB.id,
            });

        expect(res.status).toBe(201);
        const created = await prisma.bus.findFirst({ where: { licensePlate: "51A-99999" } });
        expect(created?.schoolId).toBe(fx.schoolA.id);
    });

    it("a forged schoolId in a strict create body is rejected", async () => {
        const res = await request(app)
            .post("/api/students")
            .set("Cookie", cookiesA)
            .send({
                fullName: "Hoc sinh moi",
                studentId: "HS-A-002",
                studentClass: "5B",
                dateOfBirth: "2016-06-01",
                schoolId: fx.schoolB.id,
            });

        // createStudentBodySchema is .strict(), so the unknown key fails validation.
        expect(res.status).toBe(400);
    });

    it("super admin sees rows from both schools", async () => {
        const res = await request(app).get("/api/audit-logs").set("Cookie", cookiesSuper);
        expect(res.status).toBe(200);

        const schoolIds = new Set(rowsOf(res.body).map((r) => r.schoolId));
        expect(schoolIds.has(fx.schoolA.id)).toBe(true);
        expect(schoolIds.has(fx.schoolB.id)).toBe(true);
    });
});
