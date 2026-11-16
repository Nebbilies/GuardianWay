
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";
import { targetUrl, shadowUrl } from "./database-schema/target-guard.cjs";

// Explicit new-schema target, independent of the legacy application URL.
loadEnv({ path: path.resolve(__dirname, "../database/.env"), quiet: true });
if (!process.env.SCHEMA_DATABASE_URL) {
    throw new Error("SCHEMA_DATABASE_URL is required; no fallback to the legacy application database.");
}
const primaryUrl = targetUrl(process.env.SCHEMA_DATABASE_URL);

export default defineConfig({
    schema: "database-schema/schema.prisma",
    migrations: { path: "database-schema/migrations", seed: "node database-schema/seed.cjs" },
    datasource: {
        url: primaryUrl,
        ...(process.env.SCHEMA_SHADOW_DATABASE_URL
            ? { shadowDatabaseUrl: shadowUrl(process.env.SCHEMA_SHADOW_DATABASE_URL, primaryUrl) }
            : {}),
    },
});
