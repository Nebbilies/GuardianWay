import {describe, it, expect, vi} from "vitest";
import {EventEmitter} from "events";
import {metricsMiddleware} from "./metrics.middleware";
import {register} from "../utils/metrics";

describe("metricsMiddleware", () => {
    it("calls next and records the request histogram with a normalized route", async () => {
        const req: any = { method: "GET", baseUrl: "/api/buses", route: { path: "/:id" } };
        const res: any = new EventEmitter();
        res.statusCode = 200;
        const next = vi.fn();

        metricsMiddleware(req, res, next);
        expect(next).toHaveBeenCalledOnce();

        res.emit("finish");

        const metrics = await register.metrics();
        expect(metrics).toContain("http_request_duration_seconds");
        expect(metrics).toContain('route="/api/buses/:id"');
        expect(metrics).toContain('status_code="200"');
    });
});
