import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import redisClient from "../../src/config/redis";
import { resetAndSeed, type Fixture } from "./fixtures";
import { loadApp, loginAs } from "./helpers/login";

describe("manual planning and trip preparation", () => {
    let app: Express, fx: Fixture, cookies: string[];
    beforeAll(async () => { app = await loadApp(); });
    beforeEach(async () => { fx = await resetAndSeed(); await redisClient.flushDb(); cookies = await loginAs(app, fx.adminA.email); });
    it("approves a manual plan, prepares a trip with snapshots and keeps cancellation final", async () => {
        const terminal = await request(app).post("/api/bus-stops").set("Cookie", cookies).send({ code: "SCHOOL", name: "School", address: "School address", latitude: 10.8, longitude: 106.7, kind: "SCHOOL", allowsPickup: true, allowsDropoff: true, status: "ACTIVE" });
        expect(terminal.status).toBe(201);
        const schools = await request(app).get("/api/bus-stops?kind=SCHOOL").set("Cookie", cookies);
        expect(schools.status).toBe(200);
        expect(schools.body.data.map((row: { id: string }) => row.id)).toEqual([terminal.body.id]);
        const points = await request(app).get("/api/bus-stops?kind=SERVICE_POINT").set("Cookie", cookies);
        expect(points.status).toBe(200);
        expect(points.body.data.map((row: { id: string }) => row.id)).toEqual([fx.stopA.id]);
        const planBody = { referenceDate: "2026-09-01", direction: "PICKUP", policyVersionId: fx.resourcesA.policy.id, effectiveFrom: "2026-09-01", effectiveTo: "2026-12-31", routes: [{ routeCode: "MAN001", label: "Manual route", vehicleId: fx.busA.id, distanceMetres: 12000, durationSeconds: 3600, stops: [{ stopId: fx.stopA.id, plannedTime: "07:00" }, { stopId: terminal.body.id, plannedTime: "07:30" }] }] };
        const plan = await request(app).post("/api/route-plans").set("Cookie", cookies).send(planBody);
        expect(plan.status).toBe(201);
        expect(plan.body).toMatchObject({ status: "DRAFT", source: "MANUAL", passengerPlanningComplete: false });
        const path = "/api/route-plans/" + plan.body.id;
        const revision = await request(app).put(path).set("Cookie", cookies).send({
            ...planBody, routes: [{ ...planBody.routes[0]!, distanceMetres: 12500 }],
        });
        expect(revision.status).toBe(200);
        const staleApproval = await request(app).post(path + "/approve").set("Cookie", cookies).send({ approvalToken: plan.body.approvalToken });
        expect(staleApproval.status).toBe(409);
        expect(staleApproval.body.code).toBe("PLAN_DRAFT_CHANGED");
        const approved = await request(app).post(path + "/approve").set("Cookie", cookies).send({ approvalToken: revision.body.approvalToken });
        expect(approved.status).toBe(200);
        const schedule = await request(app).post("/api/recurring-schedules").set("Cookie", cookies).send({ routeId: approved.body.routes[0].id, effectiveFrom: "2026-09-01", effectiveTo: "2026-12-31", weekdays: [1,2,3,4,5], plannedStartTime: "06:45", defaultVehicleId: fx.busA.id, defaultDriverId: fx.resourcesA.driver.id });
        expect(schedule.status).toBe(201);
        expect((await request(app).post("/api/recurring-schedules/" + schedule.body.id + "/activate").set("Cookie", cookies).send({})).status).toBe(200);
        const tripBody = { scheduleId: schedule.body.id, serviceDate: "2026-09-01" };
        const trip = await request(app).post("/api/bus-trips").set("Cookie", cookies).send(tripBody);
        expect(trip.status).toBe(201);
        expect(trip.body).toMatchObject({ status: "PLANNED", dataVersion: 1, plannedStartAt: "2026-08-31T23:45:00.000Z" });
        expect(trip.body.stops[0].plannedAt).toBe("2026-09-01T00:00:00.000Z");
        const update = await request(app).patch("/api/bus-trips/" + trip.body.id).set("Cookie", cookies).send({ expectedDataVersion: 1, plannedStartTime: "06:50" });
        expect(update.status).toBe(200);
        expect(update.body.dataVersion).toBe(2);
        expect(update.body.stops[0]).toMatchObject({ plannedAt: "2026-09-01T00:05:00.000Z", versionNo: 2 });
        const stale = await request(app).patch("/api/bus-trips/" + trip.body.id).set("Cookie", cookies).send({ expectedDataVersion: 1, plannedStartTime: "06:55" });
        expect(stale.status).toBe(409);
        expect(stale.body.code).toBe("TRIP_VERSION_CONFLICT");
        expect((await request(app).post("/api/bus-trips/" + trip.body.id + "/cancel").set("Cookie", cookies).send({ expectedDataVersion: 2, reason: "School closed" })).status).toBe(200);
        expect((await request(app).post("/api/bus-trips").set("Cookie", cookies).send(tripBody)).status).toBe(409);
        expect((await request(app).post("/api/bus-trips/" + trip.body.id + "/restore").set("Cookie", cookies)).status).toBe(404);
        expect((await request(app).patch("/api/bus-trips/" + trip.body.id).set("Cookie", cookies).send({ expectedDataVersion: 3, status: "OPEN" })).status).toBe(400);
    });
});
