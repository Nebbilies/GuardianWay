import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { Client } from "pg";
import { seed } from "./fixtures/sql-seed.cjs";
import { targetUrl } from "../../prisma/target-guard.cjs";

describe("fictional seed and target isolation", () => {
    let db: Client;
    beforeAll(async () => { db = new Client({ connectionString: inject("schemaDatabaseUrl") }); await db.connect(); });
    afterAll(async () => { await db?.end(); });

    it("rejects application targets and never falls back to DATABASE_URL", () => {
        for (const target of ["postgresql://x:x@127.0.0.1/guardianway", "postgresql://x:x@remote.example/guardianway_schema_test"]) {
            expect(() => targetUrl(target)).toThrow();
        }
    });

    it("can seed twice without changing immutable attendance history", async () => {
        const before = await db.query("SELECT * FROM attendance_event ORDER BY id");
        await seed(inject("schemaDatabaseUrl"));
        const after = await db.query("SELECT * FROM attendance_event ORDER BY id");
        expect(after.rows).toEqual(before.rows);
    });
});
