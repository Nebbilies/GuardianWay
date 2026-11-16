"use strict";

const { PrismaClient } = require("../generated/database-client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { targetUrl } = require("./target-guard.cjs");
const records = require("./seed-data.json");

async function seed(connectionString) {
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: targetUrl(connectionString) }) });
    try {
        await prisma.$transaction(async tx => {
            const newTrips = new Set();
            for (const record of records) {
                const data = { ...record.data };
                for (const key of record.dates) data[key] = new Date(data[key]);
                // Seed owns these fixed UUIDs. Never upsert updates over history.
                if (!await tx[record.model].findUnique({ where: record.where })) {
                    await tx[record.model].create({ data });
                    if (record.model === "trip") newTrips.add(data.id);
                }
            }
            for (const record of records.filter(row => row.model === "tripReconciliation")) {
                if (newTrips.has(record.data.tripId)) {
                    await tx.trip.update({
                        where: { id: record.data.tripId },
                        data: {
                            status: "COMPLETED",
                            completedAt: new Date(record.data.evaluatedAt),
                            closedReconciliationId: record.data.id,
                        },
                    });
                }
            }
        }, { timeout: 30_000 });
    } finally {
        await prisma.$disconnect();
    }
}

module.exports = { seed };
if (require.main === module) {
    seed().then(() => console.log("Schema fictional seed ready; existing rows were preserved."))
        .catch(error => {
            console.error(error.code || error.name, "Schema seed failed. No application database fallback.");
            process.exitCode = 1;
        });
}
