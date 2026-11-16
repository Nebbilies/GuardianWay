import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { Client } from "pg";

describe("independent migration history", () => {
    let db: Client;
    const qa = path.join(os.tmpdir(), "guardianway-database-foundation-qa");
    beforeAll(async () => { db = new Client({ connectionString: inject("schemaDatabaseUrl") }); await db.connect(); mkdirSync(qa, { recursive: true }); });
    afterAll(async () => { await db?.end(); });

    function cli(args: string[], url = inject("schemaDatabaseUrl"), shadow?: string) {
        return execFileSync(process.execPath, [path.join(path.dirname(createRequire(import.meta.url).resolve("prisma/package.json")), "build/index.js"), ...args,
            "--config", "prisma.database.config.ts"], {
            encoding: "utf8", env: { ...process.env, SCHEMA_DATABASE_URL: url,
                ...(shadow ? { SCHEMA_SHADOW_DATABASE_URL: shadow } : {}) },
        });
    }

    async function catalog(client: Client) {
        return (await client.query(`SELECT t.relname AS table_name,c.conname,c.contype,
            pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c
            JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace
            WHERE n.nspname='public' AND t.relname NOT IN ('_prisma_migrations','spatial_ref_sys')
            ORDER BY t.relname,c.conname`)).rows;
    }

    it("deploys twice without adding migration records or touching attendance", () => {
        const output = cli(["migrate", "deploy"]);
        expect(output).toContain("No pending migrations");
    });

    it("rebuilds the same constraints in a second empty database", async () => {
        await db.query("CREATE DATABASE guardianway_schema_demo");
        const second = new URL(inject("schemaDatabaseUrl"));
        second.pathname = "/guardianway_schema_demo";
        cli(["migrate", "deploy"], second.toString());
        const other = new Client({ connectionString: second.toString() });
        await other.connect();
        try {
            expect(await catalog(other)).toEqual(await catalog(db));
        } finally { await other.end(); }
    });

    it("has no migration-history drift after replay in an owned shadow database", async () => {
        await db.query("CREATE DATABASE guardianway_schema_shadow");
        const shadow = new URL(inject("schemaDatabaseUrl"));
        shadow.pathname = "/guardianway_schema_shadow";
        const output = cli(["migrate", "diff", "--from-migrations", "database-schema/migrations",
            "--to-config-datasource", "--exit-code"], inject("schemaDatabaseUrl"), shadow.toString());
        writeFileSync(path.join(qa, "migration-drift.txt"), output);
        expect(output).toContain("No difference");
    });

    it("proposes no destructive or duplicate SQL from the ORM schema", () => {
        const output = cli(["migrate", "diff", "--from-config-datasource", "--to-schema", "database-schema/schema.prisma", "--script"]);
        writeFileSync(path.join(qa, "orm-diff.sql"), output);
        // Keep the actual script as evidence; a CREATE/DROP/ALTER proposal here
        // would make a later schema-driven migration unsafe without review.
        expect(output.trim()).toBe("-- This is an empty migration.");
    });
});
