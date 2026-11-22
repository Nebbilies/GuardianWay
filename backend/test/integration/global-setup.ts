import { execFileSync } from "node:child_process";
import {
    PostgreSqlContainer,
    StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { GenericContainer, StartedTestContainer } from "testcontainers";
import type { GlobalSetupContext } from "vitest/node";

declare module "vitest" {
    export interface ProvidedContext {
        databaseUrl: string;
        redisUrl: string;
    }
}

let postgres: StartedPostgreSqlContainer;
let redis: StartedTestContainer;

export async function setup({ provide }: GlobalSetupContext) {
    // Must match docker-compose: migrations create PostGIS geography columns and a
    // TimescaleDB hypertable, neither of which exist in a stock postgres image.
    postgres = await new PostgreSqlContainer("timescale/timescaledb-ha:pg17")
        .withDatabase("guardianway_test")
        .withUsername("gw")
        .withPassword("gw_pw")
        .withStartupTimeout(180_000)
        .start();

    redis = await new GenericContainer("redis:7-alpine")
        .withExposedPorts(6379)
        .withStartupTimeout(60_000)
        .start();

    const databaseUrl = postgres.getConnectionUri();
    const redisUrl = `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`;

    execFileSync(
        process.execPath,
        [
            require.resolve("prisma/build/index.js"),
            "migrate",
            "deploy",
            "--config",
            "prisma.config.ts",
        ],
        {
            cwd: process.cwd(),
            env: {
                ...process.env,
                SCHEMA_SHADOW_DATABASE_URL: undefined,
                SCHEMA_DATABASE_URL: databaseUrl,
                DATABASE_URL: databaseUrl,
                DIRECT_URL: databaseUrl,
            },
            stdio: "inherit",
        },
    );

    provide("databaseUrl", databaseUrl);
    provide("redisUrl", redisUrl);
}

export async function teardown() {
    await postgres?.stop();
    await redis?.stop();
}
