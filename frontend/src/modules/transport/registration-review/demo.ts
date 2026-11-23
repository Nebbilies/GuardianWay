import { z } from "zod";
import { instant, localDate } from "@/lib/http/contracts";
import { stopApi, type Stop } from "@/modules/planning/stops/contracts";
import demo from "../../../../../fixtures/transport/demo.json";
import type { ReviewRegistration } from "./review";

const point = z.object({ id: z.uuid(), code: z.string(), name: z.string() });
const registration = z.object({
    id: z.uuid(),
    student: point,
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    submittedBy: z.string(),
    submittedAt: instant,
    reviewNote: z.string().nullable(),
    review: z.object({ reviewer: z.string(), reviewedAt: instant }).nullable(),
    days: z.array(
        z.object({
            serviceDate: localDate,
            direction: z.enum(["PICKUP", "DROPOFF"]),
            requestedStop: point.nullable(),
            approvedStop: point.nullable(),
            requestedAddress: z.string().nullable(),
        }),
    ),
}) satisfies z.ZodType<ReviewRegistration>;

export const demoSchool = demo.registrationReview.school;
export const demoRegistrations = z
    .array(registration)
    .parse(demo.registrationReview.registrations);

const stateSchema = z.object({
    drafts: z.record(z.uuid(), z.record(z.string(), z.uuid().nullable())),
    results: z.record(z.uuid(), registration),
});
export type ReviewSession = z.infer<typeof stateSchema>;

export function reviewSessionKey(schoolId: string, accountId: string) {
    return `guardianway.registration-review.v1:${schoolId}:${accountId}`;
}

export function readReviewSession(key: string): ReviewSession {
    try {
        const value = window.sessionStorage.getItem(key);
        if (value) {
            const result = stateSchema.safeParse(JSON.parse(value));
            if (result.success) return result.data;
        }
    } catch {
        // An unavailable storage backend or stale session starts with the fixture.
    }
    return { drafts: {}, results: {} };
}

export function reviewQueue(state: ReviewSession) {
    return demoRegistrations.map(
        (registration) => state.results[registration.id] ?? registration,
    );
}

export async function loadCatalogue(schoolId: string): Promise<Stop[]> {
    const stops = new Map<string, Stop>();
    let page: number | null = 1;
    while (page !== null) {
        const result = await stopApi.list({
            page,
            limit: 100,
            sort: "code",
            kind: "SERVICE_POINT",
        });
        for (const stop of result.data) {
            if (stop.schoolId === schoolId) stops.set(stop.id, stop);
        }
        page = result.metadata.nextPage;
    }
    return [...stops.values()];
}
