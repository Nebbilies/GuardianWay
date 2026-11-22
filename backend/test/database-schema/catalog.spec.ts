import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { Client } from "pg";

describe("approved schema-next database contract", () => {
    let db: Client;
    beforeAll(async () => {
        db = new Client({ connectionString: inject("schemaDatabaseUrl") });
        await db.connect();
    });
    afterAll(async () => { await db?.end(); });

    it("has exactly 41 public domain tables, independent of extension internals", async () => {
        const result = await db.query(`
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
              AND tablename NOT IN ('_prisma_migrations', 'spatial_ref_sys')
            ORDER BY tablename
        `);
        expect(result.rows).toHaveLength(41);
        expect(result.rows.map(row => row.tablename)).toContain("gps_position");
        expect(result.rows.map(row => row.tablename)).not.toContain("business_event");
    });

    it("has 530 domain columns and exactly 182 restrictive foreign keys", async () => {
        const columns = await db.query(`SELECT count(*)::int AS count FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name IN (
                SELECT tablename FROM pg_tables WHERE schemaname = 'public'
                AND tablename NOT IN ('_prisma_migrations','spatial_ref_sys'))`);
        expect(columns.rows[0].count).toBe(530);
        const fks = await db.query(`SELECT c.confdeltype, c.confupdtype FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE n.nspname = 'public' AND c.contype = 'f'`);
        expect(fks.rows).toHaveLength(182);
        expect(fks.rows.every(row => row.confdeltype === "r" && row.confupdtype === "r")).toBe(true);
    });

    it.each([
        ["fk_planned_passenger_planned_stop_id", "planned_passenger", "planned_stop", "school_id, planned_stop_id, route_id", "school_id, id, route_id"],
        ["fk_trip_closed_reconciliation_id", "trip", "trip_reconciliation", "school_id, closed_reconciliation_id, id", "school_id, id, trip_id"],
        ["fk_trip_stop_previous_stop_id", "trip_stop", "trip_stop", "school_id, previous_stop_id, trip_id, logical_stop_key", "school_id, id, trip_id, logical_stop_key"],
        ["fk_trip_passenger_trip_stop_id", "trip_passenger", "trip_stop", "school_id, trip_stop_id, trip_id", "school_id, id, trip_id"],
        ["fk_attendance_revision_previous_revision_id", "attendance_revision", "attendance_revision", "school_id, previous_revision_id, attendance_event_id", "school_id, id, attendance_event_id"],
        ["fk_reconciliation_evidence_attendance_revision_id", "reconciliation_evidence", "attendance_revision", "school_id, attendance_revision_id, attendance_event_id", "school_id, id, attendance_event_id"],
    ])("scopes %s to the matching operational context", async (name, table, referenced, keys, referencedKeys) => {
        const result = await db.query(
            "SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid = $1::regclass AND conname = $2",
            [table, name],
        );
        expect(result.rows).toEqual([{
            definition: `FOREIGN KEY (${keys}) REFERENCES ${referenced}(${referencedKeys}) ON UPDATE RESTRICT ON DELETE RESTRICT`,
        }]);
    });

    it("stores domain values as text and has only the approved timestamp columns", async () => {
        const result = await db.query(`SELECT column_name, data_type FROM information_schema.columns
            WHERE table_schema='public' AND column_name IN ('status','role','direction','created_at','updated_at','deleted_at')`);
        for (const [column, count] of [["created_at", 41], ["updated_at", 29], ["deleted_at", 6]]) {
            expect(result.rows.filter(row => row.column_name === column)).toHaveLength(count as number);
        }
        expect(result.rows.filter(row => ["status", "role", "direction"].includes(row.column_name))
            .every(row => row.data_type === "text")).toBe(true);
    });

    it("partitions GPS by measured_at without retention or compression policies", async () => {
        const tables = await db.query("SELECT hypertable_name FROM timescaledb_information.hypertables WHERE hypertable_schema='public'");
        expect(tables.rows).toEqual([{ hypertable_name: "gps_position" }]);
        const dimensions = await db.query(`SELECT column_name, time_interval FROM timescaledb_information.dimensions
            WHERE hypertable_name='gps_position'`);
        expect(dimensions.rows).toHaveLength(1);
        expect(dimensions.rows[0].column_name).toBe("measured_at");
        const jobs = await db.query(`SELECT proc_name FROM timescaledb_information.jobs
            WHERE hypertable_name='gps_position' AND proc_name IN ('policy_retention','policy_compression','policy_refresh_continuous_aggregate')`);
        expect(jobs.rows).toHaveLength(0);
    });
});
