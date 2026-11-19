// Provision the first administrator of the dedicated full-stack Compose database.
"use strict";
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { seedDemo } = require("./seed-demo.cjs");

async function main() {
    const url = new URL(process.env.DATABASE_URL);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || url.hostname !== "postgres" ||
        (url.port && url.port !== "5432") || url.pathname !== "/guardianway" || url.search || url.hash) {
        throw new Error("Unexpected Compose database");
    }
    const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.href }) });
    try {
        await seedDemo(client, {
            BOOTSTRAP_PLATFORM_EMAIL: process.env.BOOTSTRAP_PLATFORM_EMAIL,
            BOOTSTRAP_PLATFORM_PASSWORD: process.env.BOOTSTRAP_PLATFORM_PASSWORD,
        }, { firstPlatformOnly: true });
    } finally { await client.$disconnect(); }
}
main().then(() => console.log("Compose administrator provisioned")).catch(() => {
    console.error("Bootstrap failed. Verify the Compose target, credentials, and existing administrator.");
    process.exitCode = 1;
});
