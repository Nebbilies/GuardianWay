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
        // singleThread only caps worker count to 1; it does not by itself guarantee
        // Vitest won't schedule multiple test files' hooks concurrently within that
        // worker. Every *.integration.test.ts file TRUNCATEs the shared database in
        // its own setup, so two files running concurrently would corrupt each
        // other's fixture state. fileParallelism: false forces strictly sequential
        // file execution.
        fileParallelism: false,
        testTimeout: 60_000,
        // Container pull + migrate on a cold cache is slow.
        hookTimeout: 300_000,
    },
});
