
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";
import { targetUrl } from "./database-schema/target-guard.cjs";

// Explicit new-schema target, independent of the legacy application URL.
loadEnv({ path: path.resolve(__dirname, "../database/.env"), quiet: true });
if (!process.env.SCHEMA_DATABASE_URL) {
    throw new Error("SCHEMA_DATABASE_URL is required; no fallback to the legacy application database.");
}

export default defineConfig({
    schema: "database-schema/schema.prisma",
    migrations: { path: "database-schema/migrations", seed: "node database-schema/seed.cjs" },
    datasource: {
        url: targetUrl(process.env.SCHEMA_DATABASE_URL),
        ...(process.env.SCHEMA_SHADOW_DATABASE_URL
            ? { shadowDatabaseUrl: process.env.SCHEMA_SHADOW_DATABASE_URL }
            : {}),
    },
});
