import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["test/integration/**/*.integration.test.ts"],
        globalSetup: ["test/integration/global-setup.ts"],
        setupFiles: ["test/integration/setup-env.ts"],
        // One shared database — parallel workers would race on TRUNCATE.
        pool: "threads",
        poolOptions: { threads: { singleThread: true } },
        testTimeout: 60_000,
        // Container pull + migrate on a cold cache is slow.
        hookTimeout: 300_000,
    },
});
