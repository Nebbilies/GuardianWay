import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { Client } from "pg";
import { clone, data, randomUUID, schoolB } from "./fixtures";

describe("GPS storage contract", () => {
    let db: Client;
    beforeAll(async () => {
        db = new Client({ connectionString: inject("schemaDatabaseUrl") });
        await db.connect();
    });
    afterAll(async () => {
        await db?.end();
    });

    it("generates geography in longitude/latitude order", async () => {
        const result = await db.query(
            `SELECT ST_X(location::geometry) AS lon, ST_Y(location::geometry) AS lat
            FROM gps_position WHERE id=$1`,
            [data("gpsPosition").id],
        );
        expect(result.rows[0]).toEqual({ lon: 106.69, lat: 10.78 });
    });

    it.each([
        ["latitude", 91],
        ["latitude", -91],
        ["longitude", 181],
        ["longitude", -181],
        ["latitude", NaN],
        ["longitude", Infinity],
        ["accuracy_metres", -1],
        ["accuracy_metres", NaN],
        ["accuracy_metres", Infinity],
    ])("rejects invalid %s = %s", async (field, value) => {
        await expect(
            clone(db, "gps_position", data("gpsPosition").id, {
                [field]: value,
            }),
        ).rejects.toMatchObject({ code: "23514" });
    });

    it("accepts coordinate boundaries and nullable accuracy", async () => {
        await expect(
            clone(db, "gps_position", data("gpsPosition").id, {
                latitude: 90,
                longitude: -180,
                accuracy_metres: null,
            }),
        ).resolves.toMatchObject({ latitude: 90, longitude: -180 });
    });

    it("rejects a repeated sample key without overwriting existing coordinates", async () => {
        await expect(
            clone(db, "gps_position", data("gpsPosition").id, {
                id: data("gpsPosition").id,
                latitude: 11,
            }),
        ).rejects.toMatchObject({ code: "23505" });
        const result = await db.query(
            "SELECT latitude FROM gps_position WHERE id=$1",
            [data("gpsPosition").id],
        );
        expect(result.rows[0].latitude).toBe(10.78);
    });

    it("does not claim id alone is globally unique across measurement times", async () => {
        await expect(
            clone(db, "gps_position", data("gpsPosition").id, {
                id: data("gpsPosition").id,
                measured_at: "2026-11-16T00:06:00Z",
            }),
        ).resolves.toMatchObject({ id: data("gpsPosition").id });
    });

    it("rejects a source session from another school", async () => {
        await expect(
            clone(db, "gps_position", data("gpsPosition").id, {
                school_id: schoolB,
            }),
        ).rejects.toMatchObject({ code: "23503" });
    });

    it("orders by measurement time, even when receive order differs", async () => {
        const source = await clone(
            db,
            "tracking_session",
            data("trackingSession").id,
        );
        const first = await clone(db, "gps_position", data("gpsPosition").id, {
            tracking_session_id: source.id,
            measured_at: "2026-11-16T00:07:00Z",
            received_at: "2026-11-16T00:09:00Z",
            source_message_key: randomUUID(),
        });
        const second = await clone(db, "gps_position", data("gpsPosition").id, {
            tracking_session_id: source.id,
            measured_at: "2026-11-16T00:08:00Z",
            received_at: "2026-11-16T00:08:01Z",
            source_message_key: randomUUID(),
        });
        const result = await db.query(
            `SELECT id FROM gps_position WHERE school_id=$1 AND tracking_session_id=$2
            ORDER BY measured_at DESC,id DESC LIMIT 1`,
            [first.school_id, first.tracking_session_id],
        );
        expect(result.rows[0].id).toBe(second.id);
    });

    it("prevents writing generated geography directly", async () => {
        await expect(
            db.query(
                "UPDATE gps_position SET location=ST_SetSRID(ST_MakePoint(0,0),4326)::geography WHERE id=$1",
                [data("gpsPosition").id],
            ),
        ).rejects.toMatchObject({ code: "428C9" });
    });
});
