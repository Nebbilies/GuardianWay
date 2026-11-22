import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import redisClient from "../../src/config/redis";
import { resetAndSeed, type Fixture } from "./fixtures";
import { loadApp, loginAs } from "./helpers/login";

describe("student lifecycle", () => {
    let app: Express, fx: Fixture, cookies: string[];
    beforeAll(async () => { app = await loadApp(); });
    beforeEach(async () => { fx = await resetAndSeed(); await redisClient.flushDb(); cookies = await loginAs(app, fx.adminA.email); });
    it("closes guardian/card access on delete and restores only the student profile", async () => {
        const url = "/api/students/" + fx.studentA.id;
        const link = await request(app).post(url + "/guardians").set("Cookie", cookies)
            .send({ guardianAccountId: fx.parentA.id, canTrack: true, canRequest: true, relationshipLabel: "Mother" });
        expect(link.status).toBe(201);
        const filtered = await request(app).get("/api/students").query({ parentId: fx.parentA.id }).set("Cookie", cookies);
        expect(filtered.status).toBe(200);
        expect(filtered.body.data.map((row: { id: string }) => row.id)).toEqual([fx.studentA.id]);
        const otherSchool = await loginAs(app, fx.adminB.email);
        const crossSchool = await request(app).get("/api/students").query({ parentId: fx.parentA.id }).set("Cookie", otherSchool);
        expect(crossSchool.status).toBe(200);
        expect(crossSchool.body.data).toEqual([]);
        const card = await request(app).post(url + "/cards").set("Cookie", cookies).send({ cardUid: "000abc", technology: "NFC" });
        expect(card.status).toBe(201);
        expect((await request(app).delete(url).set("Cookie", cookies)).status).toBe(200);
        expect((await request(app).post(url + "/restore").set("Cookie", cookies)).status).toBe(200);
        const detail = await request(app).get(url).set("Cookie", cookies);
        expect(detail.status).toBe(200);
        expect(detail.body.guardians).toHaveLength(1);
        expect(detail.body.guardians[0].effectiveTo).not.toBeNull();
        const retired = await request(app).get("/api/students").query({ parentId: fx.parentA.id }).set("Cookie", cookies);
        expect(retired.status).toBe(200);
        expect(retired.body.data).toEqual([]);
        expect(detail.body.cards).toHaveLength(1);
        expect(detail.body.cards[0]).toMatchObject({ cardUid: "000abc", technology: "NFC", revokedById: fx.adminA.id });
        expect(detail.body.cards[0].effectiveTo).not.toBeNull();
        expect((await request(app).get("/api/students/" + fx.studentB.id).set("Cookie", cookies)).status).toBe(404);
        const platform = await loginAs(app, fx.superAdmin.email);
        expect((await request(app).get("/api/students").set("Cookie", platform)).status).toBe(403);
    });
});
