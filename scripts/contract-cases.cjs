"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const requiredCases = ["auth.web.login", "auth.web.refresh", "auth.me", "auth.mobile.login", "auth.mobile.refresh", "auth.mobile.logout", "accounts.activate", "problem.credentials", "problem.trip.duplicate", "schools.create", "school.context", "accounts.create", "students.create", "students.detail", "guardians.create", "cards.assign", "drivers.onboard", "vehicles.create", "stops.create", "stops.terminal.create", "policies.create", "plans.create", "plans.approve", "schedules.create", "schedules.activate", "trips.create", "trips.update", "trips.cancel", "audit.list", "public.landing"];
function fingerprint() {
    const hash = crypto.createHash("sha256");
    function scan(directory) {
        for (const item of fs.readdirSync(directory, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
            const target = path.join(directory, item.name);
            if (item.isDirectory()) scan(target);
            else if (/\.(ts|prisma|sql|json)$/.test(item.name)) { hash.update(path.relative(root, target).split(path.sep).join("/")); hash.update(fs.readFileSync(target)); }
        }
    }
    scan(path.join(root, "backend", "src")); scan(path.join(root, "backend", "prisma", "migrations"));
    hash.update(fs.readFileSync(path.join(root, "backend", "prisma", "schema.prisma")));
    hash.update(fs.readFileSync(path.join(root, "backend", "test", "integration", "client-contracts.integration.test.ts")));
    return hash.digest("hex");
}
function loadCases() {
    if (!process.env.CONTRACT_CASES_DIR || !process.env.CONTRACT_RUN_ID) throw new Error("Run contract consumers through npm run test:contracts");
    const data = JSON.parse(fs.readFileSync(path.join(process.env.CONTRACT_CASES_DIR, "provider.json"), "utf8"));
    if (data.formatVersion !== 1 || data.runId !== process.env.CONTRACT_RUN_ID || data.providerFingerprint !== fingerprint() || !Array.isArray(data.cases)) throw new Error("Contract cases are stale or invalid");
    for (const id of requiredCases) if (!data.cases.some(item => item.id === id)) throw new Error("Missing provider case: " + id);
    return data;
}
function consumed(application, ids) {
    const data = loadCases();
    fs.writeFileSync(path.join(process.env.CONTRACT_CASES_DIR, application + ".json"), JSON.stringify({ runId: data.runId, providerFingerprint: data.providerFingerprint, ids }));
}
module.exports = { requiredCases, fingerprint, loadCases, consumed };
