import { describe, expect, it } from "vitest";
import { z } from "zod";
import { instant, localDate, pageSchema } from "@/lib/http/contracts";
import type {
    Manifest,
    Registration,
} from "../../../../fixtures/transport/contract";
import { fixtureClient, trips } from "../../../../fixtures/transport/fixture";
describe("registration and passenger read contracts", () => {
    it("validates the JSON payloads for all four seed trips and every registration", async () => {
        const reference = z.object({
            id: z.uuid(),
            code: z.string(),
            name: z.string(),
        });
        const direction = z.enum(["PICKUP", "DROPOFF"]);
        const registration = z.object({
            id: z.uuid(),
            student: reference,
            status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
            submittedAt: instant,
            reviewNote: z.string().nullable(),
            days: z.array(
                z.object({
                    serviceDate: localDate,
                    direction,
                    requestedStop: reference.nullable(),
                    approvedStop: reference.nullable(),
                }),
            ),
        }) satisfies z.ZodType<Registration>;
        const manifest = z.object({
            trip: z.object({
                id: z.uuid(),
                serviceDate: localDate,
                direction,
                status: z.enum(["PLANNED", "OPEN", "COMPLETED", "CANCELLED"]),
                completedAt: instant.nullable(),
                cancellationReason: z.string().nullable(),
            }),
            passengers: z.array(
                z.object({
                    id: z.uuid(),
                    student: reference,
                    stop: reference,
                    attendance: z.array(
                        z.object({
                            kind: z.enum(["BOARD", "ALIGHT"]),
                            occurredAt: instant,
                        }),
                    ),
                }),
            ),
        }) satisfies z.ZodType<Manifest>;
        const admin = fixtureClient("admin");
        expect(
            pageSchema(registration).parse(await admin.registrations()).data,
        ).toHaveLength(6);
        for (const id of Object.values(trips)) {
            expect(manifest.parse(await admin.passengers(id)).trip.id).toBe(id);
        }
    });
    it("paginates six registrations for the school and two for the first parent", async () => {
        const all = await fixtureClient("admin").registrations(1, 2);
        expect(all.data).toHaveLength(2);
        expect(all.metadata).toMatchObject({
            totalCount: 6,
            pageCount: 3,
            nextPage: 2,
        });
        const parent = await fixtureClient("parent-1").registrations();
        expect(parent.data.map((r) => r.student.code)).toEqual([
            "HS01",
            "HS02",
        ]);
        expect(parent.data[0].days).toHaveLength(2);
        expect(
            (await fixtureClient("parent-4").registrations()).metadata
                .totalCount,
        ).toBe(0);
        await expect(
            fixtureClient("driver-1").registrations(),
        ).rejects.toMatchObject({ status: 403 });
    });
    it("returns attendance only for the selected trip and enforces the driver assignment", async () => {
        const manifest = await fixtureClient("driver-1").passengers(
            trips.completed,
        );
        expect(manifest.trip.status).toBe("COMPLETED");
        expect(manifest.passengers).toHaveLength(2);
        expect(manifest.passengers[0].attendance.map((e) => e.kind)).toEqual([
            "BOARD",
            "ALIGHT",
        ]);
        expect(
            (await fixtureClient("driver-2").passengers(trips.empty))
                .passengers,
        ).toEqual([]);
        expect(
            (await fixtureClient("admin").passengers(trips.planned)).passengers,
        ).toHaveLength(4);
        expect(
            (await fixtureClient("admin").passengers(trips.cancelled)).trip
                .cancellationReason,
        ).toBeTruthy();
        for (const role of ["driver-2", "parent-1"] as const) {
            await expect(
                fixtureClient(role).passengers(trips.completed),
            ).rejects.toMatchObject({ status: 403 });
        }
    });
});
