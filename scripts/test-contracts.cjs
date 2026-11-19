"use strict";
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { randomUUID } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { requiredCases, fingerprint } = require("./contract-cases.cjs");
const root = path.resolve(__dirname, "..");
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "guardianway-contracts-"));
const runId = randomUUID();
const environment = { ...process.env, CONTRACT_CASES_DIR: directory, CONTRACT_RUN_ID: runId, LOG_LEVEL: "silent" };
function run(args, cwd = root) {
    if (!process.env.npm_execpath) throw new Error("Use npm run test:contracts");
    const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd, env: environment, stdio: "inherit" });
    if (result.error || result.status !== 0) throw new Error("Contract gate command failed");
}
try {
    run(["run", "test:integration", "--workspace=@gw/backend"]);
    run(["run", "test:contract-consumer", "--workspace=frontend"]);
    run(["run", "test:contract-consumer"], path.join(root, "mobile"));
    for (const application of ["frontend", "mobile"]) {
        const record = JSON.parse(fs.readFileSync(path.join(directory, application + ".json"), "utf8"));
        const expected = application === "frontend" ? requiredCases.filter(id => !id.startsWith("auth.mobile.")) : ["auth.mobile.login", "auth.mobile.refresh", "auth.mobile.logout", "auth.me", "problem.credentials"];
        if (record.runId !== runId || record.providerFingerprint !== fingerprint() || !Array.isArray(record.ids) || expected.some(id => !record.ids.includes(id))) throw new Error("Consumer coverage missing: " + application);
    }
    console.log("Provider and both client contracts verified from fresh HTTP cases");
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally {
    const resolved = path.resolve(directory);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith("guardianway-contracts-")) throw new Error("Refusing to clean an unexpected contract directory");
    fs.rmSync(resolved, { recursive: true, force: true });
}
