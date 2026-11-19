import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["test/database-schema/**/*.spec.ts"],
        globalSetup: ["test/database-schema/global-setup.ts"],
        fileParallelism: false,
        pool: "threads",
        poolOptions: { threads: { singleThread: true } },
        testTimeout: 60_000,
        hookTimeout: 300_000,
    },
});
