import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Client } from "pg";
import type { GlobalSetupContext } from "vitest/node";

declare module "vitest" {
    export interface ProvidedContext {
        schemaDatabaseUrl: string;
    }
}

let container: StartedPostgreSqlContainer | undefined;

export async function setup({ provide }: GlobalSetupContext) {
    try {
        container = await new PostgreSqlContainer("timescale/timescaledb-ha:pg17")
            .withDatabase("guardianway_schema_test")
            .withStartupTimeout(180_000)
            .start();
        const url = container.getConnectionUri();
        const client = new Client({ connectionString: url });
        await client.connect();
        try {
            const version = await client.query("SELECT version() AS postgres");
            const qa = path.join(os.tmpdir(), "guardianway-database-foundation-qa");
            mkdirSync(qa, { recursive: true });
            writeFileSync(path.join(qa, "runtime.json"), JSON.stringify(version.rows, null, 2));
        } finally {
            await client.end();
        }
        // Before the baseline exists, the first contract test intentionally sees
        // an empty database. Once present, a migration error must fail setup.
        if (existsSync(path.resolve("prisma/migrations/20261116000000_schema_baseline/migration.sql"))) {
            execFileSync(process.execPath, [
                path.join(path.dirname(createRequire(import.meta.url).resolve("prisma/package.json")), "build/index.js"),
                "migrate", "deploy", "--config", "prisma.config.ts",
            ], {
                cwd: process.cwd(),
                env: { ...process.env, SCHEMA_DATABASE_URL: url, DATABASE_URL: url },
                stdio: "pipe",
            });
            const { seed } = await import("./fixtures/sql-seed.cjs");
            await seed(url);
            const info = new Client({ connectionString: url });
            await info.connect();
            try {
                const runtime = await info.query(`SELECT version() AS postgres,
                    (SELECT extversion FROM pg_extension WHERE extname='timescaledb') AS timescaledb,
                    (SELECT extversion FROM pg_extension WHERE extname='postgis') AS postgis`);
                const image = execFileSync("docker", ["inspect", "--format", "{{.Image}}", container.getId()], { encoding: "utf8" }).trim();
                writeFileSync(path.join(os.tmpdir(), "guardianway-database-foundation-qa", "runtime.json"),
                    JSON.stringify({ ...runtime.rows[0], image }, null, 2));
            } finally {
                await info.end();
            }
        }
        provide("schemaDatabaseUrl", url);
    } catch (error) {
        await container?.stop();
        throw error;
    }
}

export async function teardown() {
    await container?.stop();
}
