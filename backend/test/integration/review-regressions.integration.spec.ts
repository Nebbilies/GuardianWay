import { beforeAll, beforeEach, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import redisClient from "../../src/config/redis";
import { resetAndSeed, type Fixture } from "./fixtures";
import { loadApp, loginAs } from "./helpers/login";

let app: Express, fixture: Fixture, cookies: string[];
beforeAll(async () => { app = await loadApp(); });
beforeEach(async () => { fixture = await resetAndSeed(); await redisClient.flushDb(); cookies = await loginAs(app, fixture.adminA.email); });

it.each([
    { direction: "DROPOFF", from: "2026-09-03T06:00:00.000Z", to: null, schoolTime: "16:00", first: "16:00", last: "16:30" },
    { direction: "PICKUP", from: "2026-09-02T17:00:00.000Z", to: "2026-09-03T02:00:00.000Z", schoolTime: "08:00", first: "07:00", last: "07:30" },
])("uses actual $direction route times to validate policy applicability", async test => {
    const terminal = await request(app).post("/api/bus-stops").set("Cookie", cookies).send({ code: "SCHOOL", name: "School", address: "School address", latitude: 10.8, longitude: 106.7, kind: "SCHOOL", allowsPickup: true, allowsDropoff: true, status: "ACTIVE" });
    expect(terminal.status).toBe(201);
    const policy = await request(app).post("/api/school-policies").set("Cookie", cookies).send({ effectiveFrom: test.from, effectiveTo: test.to, ...(test.direction === "PICKUP" ? { pickupArrivalTime: test.schoolTime } : { dropoffDepartureTime: test.schoolTime }), approvalBasis: "Configured service hours" });
    expect(policy.status).toBe(201);
    const plan = await request(app).post("/api/route-plans").set("Cookie", cookies).send({ referenceDate: "2026-09-03", direction: test.direction, policyVersionId: policy.body.id, effectiveFrom: "2026-09-03", effectiveTo: "2026-09-30", routes: [{ routeCode: "R002", label: "Service route", vehicleId: fixture.busA.id, distanceMetres: 10000, durationSeconds: 3600, stops: [
        { stopId: test.direction === "PICKUP" ? fixture.stopA.id : terminal.body.id, plannedTime: test.first },
        { stopId: test.direction === "PICKUP" ? terminal.body.id : fixture.stopA.id, plannedTime: test.last },
    ] }] });
    expect(plan.status).toBe(201);
    expect((await request(app).post("/api/route-plans/" + plan.body.id + "/approve").set("Cookie", cookies).send({})).status).toBe(200);
});

it("rejects restoring a driver whose retained account has changed role", async () => {
    const path = "/api/drivers/" + fixture.resourcesA.driver.id;
    expect((await request(app).delete(path).set("Cookie", cookies)).status).toBe(200);
    expect((await request(app).patch("/api/users/" + fixture.driverA.id).set("Cookie", cookies).send({ role: "PARENT" })).status).toBe(200);
    expect((await request(app).post(path + "/restore").set("Cookie", cookies)).status).toBe(400);
    const deleted = await request(app).get("/api/drivers?deleted=only").set("Cookie", cookies);
    expect(deleted.body.data.some((row: { id: string }) => row.id === fixture.resourcesA.driver.id)).toBe(true);
});

it("rejects zero-length recurring validity before it reaches the SQL interval constraint", async () => {
    const response = await request(app).post("/api/recurring-schedules").set("Cookie", cookies).send({ routeId: fixture.routeA.id, effectiveFrom: "2026-09-01", effectiveTo: "2026-09-01", weekdays: [2], plannedStartTime: "06:45" });
    expect(response.status).toBe(400);
});
