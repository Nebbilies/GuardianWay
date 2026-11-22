import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { pageResult } from "../http/contracts/pagination";
import { instant, localDate } from "../http/contracts/values";
import { direction } from "../http/normalization";

const reference = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
});
export const registration = z.object({
    id: z.uuid(),
    student: reference,
    status: z.enum(["APPROVED", "PENDING", "REJECTED"]),
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
});
export const manifest = z.object({
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
});
export function transportExamples() {
    const file = resolve(__dirname, "../../../fixtures/transport/demo.json");
    const data = z
        .object({
            registrations: z.array(registration),
            manifests: z.record(z.string(), z.object({ body: manifest })),
        })
        .parse(JSON.parse(readFileSync(file, "utf8")));
    const firstPage = { page: 1, limit: 10 };
    return {
        registrations: {
            school: {
                value: pageResult(
                    data.registrations.slice(0, firstPage.limit),
                    data.registrations.length,
                    firstPage,
                ),
            },
            empty: { value: pageResult([], 0, firstPage) },
        },
        manifests: Object.fromEntries(
            Object.entries(data.manifests).map(([key, { body }]) => [
                key,
                {
                    summary: body.trip.status + " · " + body.trip.serviceDate,
                    value: body,
                },
            ]),
        ),
    };
}
