import express from "express";
import request from "supertest";
import { expect, it, vi } from "vitest";
import { loadApp } from "./helpers/login";

it("publishes mounted operations and groups transport fixtures by module", async () => {
    const spy = vi.spyOn(express.application, "use");
    const app = await loadApp();
    const mounts = spy.mock.calls.slice();
    spy.mockRestore();
    const result = await request(app).get("/api/openapi.json").expect(200);
    const spec = result.body;
    expect(spec.openapi).toBe("3.1.0");
    const mounted = [];
    for (const args of mounts) {
        const prefix = args[0];
        if (typeof prefix !== "string" || !prefix.startsWith("/api/")) {
            continue;
        }
        const router = args.at(-1) as unknown as {
            stack?: {
                route?: { path: string; methods: Record<string, boolean> };
            }[];
        };
        for (const layer of router.stack ?? []) {
            if (!layer.route) {
                continue;
            }
            const path = (prefix + layer.route.path)
                .replace(/\/$/, "")
                .replace(/:(\w+)/g, "{$1}");
            for (const method of Object.keys(layer.route.methods)) {
                mounted.push(method + " " + path);
            }
        }
    }
    expect(mounted).toContain("post /api/auth/token/login");
    const fixturePaths = new Set([
        "/api/service-registrations",
        "/api/bus-trips/{tripId}/passengers",
    ]);
    for (const path of fixturePaths) {
        const operation = spec.paths[path].get;
        expect(operation["x-fixture-only"]).toBe(true);
        expect(operation.tags).toEqual([
            path.includes("bus-trips") ? "Trips" : "Service registrations",
        ]);
        expect(
            Object.keys(
                operation.responses["200"].content["application/json"].examples,
            ).length,
        ).toBeGreaterThan(1);
    }
    const documented = [];
    for (const [path, item] of Object.entries(spec.paths)) {
        if (!path.startsWith("/api/")) {
            continue;
        }
        for (const method of Object.keys(item as Record<string, unknown>)) {
            if (method === "get" && fixturePaths.has(path)) {
                continue;
            }
            documented.push(method + " " + path);
        }
    }
    expect(documented.sort()).toEqual(mounted.sort());
    await request(app)
        .get("/api/docs/")
        .expect(200)
        .expect(/\/api\/docs\/init\.js/);
    await request(app)
        .get("/api/docs/init.js")
        .expect(200)
        .expect(/SwaggerUIBundle/);
    await request(app).get("/api/docs/swagger-ui-bundle.js").expect(200);
    await request(app).get("/healthz").expect(200, { status: "ok" });
});
