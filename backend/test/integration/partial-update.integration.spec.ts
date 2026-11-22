import { beforeAll, beforeEach, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import redisClient from "../../src/config/redis";
import { resetAndSeed, TEST_PASSWORD, type Fixture } from "./fixtures";
import { loadApp, loginAs } from "./helpers/login";

let app: Express, fixture: Fixture;
beforeAll(async () => {
    app = await loadApp();
});
beforeEach(async () => {
    fixture = await resetAndSeed();
    await redisClient.flushDb();
});
it("preserves inactive and unavailable statuses when only descriptive fields are patched", async () => {
    const cookies = await loginAs(app, fixture.adminA.email);
    const cases = [
        {
            path: "/api/buses/" + fixture.busA.id,
            status: "UNAVAILABLE",
            patch: { description: "Edited description" },
        },
        {
            path: "/api/drivers/" + fixture.resourcesA.driver.id,
            status: "UNAVAILABLE",
            patch: { notes: "Edited notes" },
        },
        {
            path: "/api/students/" + fixture.studentA.id,
            status: "INACTIVE",
            patch: { classLabel: "5B" },
        },
        {
            path: "/api/bus-stops/" + fixture.stopA.id,
            status: "INACTIVE",
            patch: { accessNote: "Edited access note" },
        },
    ];
    for (const item of cases) {
        expect(
            (
                await request(app)
                    .patch(item.path)
                    .set("Cookie", cookies)
                    .send({ status: item.status })
            ).status,
        ).toBe(200);
        const edited = await request(app)
            .patch(item.path)
            .set("Cookie", cookies)
            .send(item.patch);
        expect(edited.status, item.path).toBe(200);
        expect(edited.body.status, item.path).toBe(item.status);
    }
    const platform = await loginAs(app, fixture.superAdmin.email),
        path = "/api/schools/" + fixture.schoolA.id;
    expect(
        (
            await request(app)
                .patch(path)
                .set("Cookie", platform)
                .send({ status: "INACTIVE" })
        ).status,
    ).toBe(200);
    const renamed = await request(app)
        .patch(path)
        .set("Cookie", platform)
        .send({ name: "Renamed school" });
    expect(renamed.status).toBe(200);
    expect(renamed.body.status).toBe("INACTIVE");
    expect(
        (
            await request(app)
                .post("/api/auth/token/login")
                .send({ email: fixture.adminA.email, password: TEST_PASSWORD })
        ).status,
    ).toBe(401);
});
