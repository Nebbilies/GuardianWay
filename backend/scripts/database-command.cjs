"use strict";
const path = require("node:path");
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
const dotenv = require("dotenv");
const { targetUrl } = require("../prisma/target-guard.cjs");
const backend = path.resolve(__dirname, "..");
function load(file) {
    if (!fs.existsSync(file)) {
        throw new Error("Environment file not found: " + file);
    }
    return dotenv.parse(fs.readFileSync(file));
}
try {
    const appFile =
        process.env.GUARDIANWAY_APP_ENV_FILE || path.join(backend, ".env");
    const schemaFile =
        process.env.GUARDIANWAY_SCHEMA_ENV_FILE ||
        path.join(backend, "..", "database", ".env");
    const environment = {
        ...load(appFile),
        ...load(schemaFile),
        ...process.env,
    };
    const url = targetUrl(environment.SCHEMA_DATABASE_URL);
    const script = process.argv[2];
    if (!["dev:app", "database:migrate", "database:seed"].includes(script)) {
        throw new Error("Unsupported database command");
    }
    if (!process.env.npm_execpath) {
        throw new Error("Run this command through npm");
    }
    const result = spawnSync(
        process.execPath,
        [process.env.npm_execpath, "run", script],
        {
            cwd: backend,
            env: {
                ...environment,
                GUARDIANWAY_ENV_LOADED: "1",
                DATABASE_URL: url,
                DIRECT_URL: url,
            },
            stdio: "inherit",
        },
    );
    if (result.error) {
        throw new Error("Unable to start database command");
    }
    process.exitCode = result.status ?? 1;
} catch (error) {
    // Guard failures must never echo a connection URL containing credentials.
    console.error(
        error instanceof Error && !error.message.includes("://")
            ? error.message
            : "Database command configuration is invalid",
    );
    process.exitCode = 1;
}
