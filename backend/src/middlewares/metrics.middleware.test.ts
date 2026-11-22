import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "events";
import type { Request, Response } from "express";
import { metricsMiddleware } from "./metrics.middleware";
import { register } from "../utils/metrics";

describe("metricsMiddleware", () => {
    it("calls next and records the request histogram with a normalized route", async () => {
        const req = {
            method: "GET",
            baseUrl: "/api/buses",
            route: { path: "/:id" },
        } as Request;
        const res = Object.assign(new EventEmitter(), { statusCode: 200 });
        const next = vi.fn();

        metricsMiddleware(req, res as Response, next);
        expect(next).toHaveBeenCalledOnce();

        res.emit("finish");

        const metrics = await register.metrics();
        expect(metrics).toContain("http_request_duration_seconds");
        expect(metrics).toContain('route="/api/buses/:id"');
        expect(metrics).toContain('status_code="200"');
    });
});
