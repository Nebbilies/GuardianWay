import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import { targetUrl, shadowUrl } from "./prisma/target-guard.cjs";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "node prisma/seed-demo.cjs",
    },
    datasource: {
        url: env("DATABASE_URL"),
        ...(process.env.SCHEMA_SHADOW_DATABASE_URL
            ? {
                  shadowDatabaseUrl: shadowUrl(
                      process.env.SCHEMA_SHADOW_DATABASE_URL,
                      targetUrl(env("DATABASE_URL")),
                  ),
              }
            : {}),
    },
});
