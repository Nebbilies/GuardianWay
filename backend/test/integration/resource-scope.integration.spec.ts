import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import redisClient from "../../src/config/redis";
import { resetAndSeed, type Fixture } from "./fixtures";
import { loadApp, loginAs } from "./helpers/login";

describe("resource identity and school scope", () => {
    let app: Express, fx: Fixture, cookies: string[];
    beforeAll(async () => {
        app = await loadApp();
    });
    beforeEach(async () => {
        fx = await resetAndSeed();
        await redisClient.flushDb();
        cookies = await loginAs(app, fx.adminA.email);
    });
    it("normalizes identity, reuses a deleted vehicle identity and rejects a conflicting restore", async () => {
        const body = {
            code: " bus-2 ",
            plateNumber: "51A-123.45",
            studentCapacity: 20,
            status: "AVAILABLE",
        };
        const created = await request(app)
            .post("/api/buses")
            .set("Cookie", cookies)
            .send(body);
        expect(created.status).toBe(201);
        expect(created.body).toMatchObject({
            code: "BUS-2",
            plateNumber: "51A12345",
            schoolId: fx.schoolA.id,
        });
        expect(
            (
                await request(app)
                    .post("/api/buses")
                    .set("Cookie", cookies)
                    .send(body)
            ).status,
        ).toBe(409);
        expect(
            (
                await request(app)
                    .delete("/api/buses/" + created.body.id)
                    .set("Cookie", cookies)
            ).status,
        ).toBe(200);
        expect(
            (
                await request(app)
                    .post("/api/buses")
                    .set("Cookie", cookies)
                    .send(body)
            ).status,
        ).toBe(201);
        expect(
            (
                await request(app)
                    .post("/api/buses/" + created.body.id + "/restore")
                    .set("Cookie", cookies)
            ).status,
        ).toBe(409);
        expect(
            (
                await request(app)
                    .patch("/api/buses/" + fx.busB.id)
                    .set("Cookie", cookies)
                    .send({ description: "Bad" })
            ).status,
        ).toBe(404);
        const list = await request(app)
            .get("/api/buses")
            .set("Cookie", cookies);
        expect(
            list.body.data.every(
                (row: { schoolId: string }) => row.schoolId === fx.schoolA.id,
            ),
        ).toBe(true);
    });
});
