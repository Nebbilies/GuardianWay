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
