import client from "prom-client";

export const register = new client.Registry();

// Node process + GC + event-loop metrics.
client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"] as const,
    // Buckets chosen so P95>1s and P99>2s alert thresholds land on bucket edges.
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [register],
});
