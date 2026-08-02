import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { resetAndSeed, type Fixture } from "./fixtures";
import { loadApp, loginAs } from "./helpers/login";

type Actor = "anonymous" | "parent" | "driver" | "admin" | "superAdmin";

interface RouteCase {
    method: "get" | "post";
    path: string;
    // Roles that must be allowed through the guard chain. Everyone else must be
    // rejected: 401 when unauthenticated, 403 when authenticated but wrong role.
    allowed: Actor[];
}

const ROUTES: RouteCase[] = [
    { method: "get", path: "/api/users", allowed: ["admin", "superAdmin"] },
    { method: "get", path: "/api/buses", allowed: ["admin", "superAdmin"] },
    { method: "get", path: "/api/bus-routes", allowed: ["admin", "superAdmin"] },
    { method: "get", path: "/api/bus-stops", allowed: ["admin", "superAdmin"] },
    { method: "get", path: "/api/bus-trips", allowed: ["admin", "superAdmin"] },
    { method: "get", path: "/api/students", allowed: ["admin", "superAdmin"] },
    { method: "get", path: "/api/audit-logs", allowed: ["admin", "superAdmin"] },
    { method: "get", path: "/api/schools", allowed: ["superAdmin"] },
];

describe("RBAC matrix", () => {
    let app: Express;
    let fx: Fixture;
    const cookies: Record<Exclude<Actor, "anonymous">, string[]> = {
        parent: [], driver: [], admin: [], superAdmin: [],
    };

    beforeAll(async () => {
        app = await loadApp();
    });

    beforeEach(async () => {
        fx = await resetAndSeed();
        cookies.parent = await loginAs(app, fx.parentA.email);
        cookies.driver = await loginAs(app, fx.driverA.email);
        cookies.admin = await loginAs(app, fx.adminA.email);
        cookies.superAdmin = await loginAs(app, fx.superAdmin.email);
    });

    for (const route of ROUTES) {
        const label = `${route.method.toUpperCase()} ${route.path}`;

        it(`${label} rejects anonymous callers with 401`, async () => {
            const res = await request(app)[route.method](route.path);
            expect(res.status).toBe(401);
        });

        for (const actor of ["parent", "driver", "admin", "superAdmin"] as const) {
            const shouldAllow = route.allowed.includes(actor);

            it(`${label} ${shouldAllow ? "allows" : "forbids"} ${actor}`, async () => {
                const res = await request(app)[route.method](route.path).set("Cookie", cookies[actor]);

                if (shouldAllow) {
                    expect(res.status).toBeLessThan(400);
                } else {
                    expect(res.status).toBe(403);
                }
            });
        }
    }
});

// POST /api/auth/invites is the sole route whose authorization lives on the
// route itself rather than on the app.ts mount — the /api/auth mount is
// deliberately unguarded so login/refresh/logout/setup-password stay public.
// That makes it structurally able to lose its guard silently the way
// /api/schools could, so it gets its own coverage instead of living in the
// generic ROUTES table.
//
// It can't reuse the table's "allowed => <400" shape: the handler requires a
// body and, for a real user, would trigger a live invite email send. Using a
// syntactically valid but non-existent email makes authService.issueInviteByEmail
// throw NotFoundError (404) after the user lookup fails, before any invite is
// created or mail is sent — so 404 for admin/superAdmin still proves they got
// past the guard, without a network side effect.
describe("RBAC matrix: POST /api/auth/invites (route-level guard)", () => {
    let app: Express;
    let fx: Fixture;
    const cookies: Record<Exclude<Actor, "anonymous">, string[]> = {
        parent: [], driver: [], admin: [], superAdmin: [],
    };
    const body = { email: "nobody-xyz@gw.test" };

    beforeAll(async () => {
        app = await loadApp();
    });

    beforeEach(async () => {
        fx = await resetAndSeed();
        cookies.parent = await loginAs(app, fx.parentA.email);
        cookies.driver = await loginAs(app, fx.driverA.email);
        cookies.admin = await loginAs(app, fx.adminA.email);
        cookies.superAdmin = await loginAs(app, fx.superAdmin.email);
    });

    it("rejects anonymous callers with 401", async () => {
        const res = await request(app).post("/api/auth/invites").send(body);
        expect(res.status).toBe(401);
    });

    it("forbids parent with 403", async () => {
        const res = await request(app).post("/api/auth/invites").set("Cookie", cookies.parent).send(body);
        expect(res.status).toBe(403);
    });

    it("forbids driver with 403", async () => {
        const res = await request(app).post("/api/auth/invites").set("Cookie", cookies.driver).send(body);
        expect(res.status).toBe(403);
    });

    it("admin passes the guard, gets 404 for the unknown email", async () => {
        const res = await request(app).post("/api/auth/invites").set("Cookie", cookies.admin).send(body);
        expect(res.status).toBe(404);
    });

    it("superAdmin passes the guard, gets 404 for the unknown email", async () => {
        const res = await request(app).post("/api/auth/invites").set("Cookie", cookies.superAdmin).send(body);
        expect(res.status).toBe(404);
    });
});
