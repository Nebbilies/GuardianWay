import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { data, randomUUID } from "./fixtures";

describe("isolated Prisma client", () => {
    let prisma: PrismaClient;
    beforeAll(() => {
        prisma = new PrismaClient({
            adapter: new PrismaPg({
                connectionString: inject("schemaDatabaseUrl"),
            }),
        });
    });
    afterAll(async () => {
        await prisma?.$disconnect();
    });

    it("creates Stop without requiring a generated geography payload", async () => {
        const stamp = new Date("2026-11-16T00:00:00.123Z");
        const row = await prisma.stop.create({
            data: {
                schoolId: data("school").id,
                code: `ORM_${randomUUID()}`,
                name: "ORM point",
                address: "Fictional",
                latitude: 10.5,
                longitude: 106.5,
                kind: "SERVICE_POINT",
                allowsPickup: true,
                allowsDropoff: true,
                status: "ACTIVE",
                createdAt: stamp,
                updatedAt: stamp,
            },
        });
        expect(row.createdAt.toISOString()).toBe("2026-11-16T00:00:00.123Z");
        expect(row.updatedAt).toEqual(row.createdAt);
        const updated = await prisma.stop.update({
            where: { id: row.id },
            data: { name: "Updated point" },
        });
        expect(updated.updatedAt.getTime()).toBeGreaterThan(stamp.getTime());
        const point = await prisma.$queryRawUnsafe<
            Array<{ lon: number; lat: number }>
        >(
            "SELECT ST_X(location::geometry) AS lon, ST_Y(location::geometry) AS lat FROM stop WHERE id=$1::uuid",
            row.id,
        );
        expect(point[0]).toEqual({ lon: 106.5, lat: 10.5 });
        await prisma.$executeRawUnsafe(
            "UPDATE stop SET name='SQL update' WHERE id=$1::uuid",
            row.id,
        );
        expect(
            (await prisma.stop.findUniqueOrThrow({ where: { id: row.id } }))
                .updatedAt,
        ).toEqual(updated.updatedAt);
    });

    it("creates a GPS sample with the phone UUID and composite key", async () => {
        const id = randomUUID();
        const measuredAt = new Date("2026-11-16T00:10:00.456Z");
        await prisma.gpsPosition.create({
            data: {
                id,
                schoolId: data("school").id,
                trackingSessionId: data("trackingSession").id,
                measuredAt,
                receivedAt: new Date("2026-11-16T00:10:01.000Z"),
                latitude: 10.6,
                longitude: 106.6,
                sourceMessageKey: id,
                qualityStatus: "ACCEPTED",
            },
        });
        const row = await prisma.gpsPosition.findUniqueOrThrow({
            where: { measuredAt_id: { measuredAt, id } },
        });
        expect(row.id).toBe(id);
        expect(row.measuredAt.toISOString()).toBe("2026-11-16T00:10:00.456Z");
    });

    it("round-trips local date, local time and historical JSONB", async () => {
        const day = await prisma.registrationDay.findUniqueOrThrow({
            where: { id: data("registrationDay").id },
        });
        expect(day.serviceDate.toISOString().slice(0, 10)).toBe("2026-11-16");
        expect(day.approvalStopSnapshot).toMatchObject({
            name: "Demo service point",
            latitude: 10.78,
        });
        const stop = await prisma.plannedStop.findUniqueOrThrow({
            where: { id: data("plannedStop").id },
        });
        expect(stop.plannedTime.toISOString().slice(11, 19)).toBe("07:00:00");
        const policy = await prisma.schoolPolicyVersion.findUniqueOrThrow({
            where: { id: data("schoolPolicyVersion").id },
        });
        expect(policy.pickupWaitMinutes).toBe(2.5);
    });
});
