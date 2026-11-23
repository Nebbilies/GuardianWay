import { describe, expect, it } from "vitest";
import type { Stop } from "@/modules/planning/stops/contracts";
import {
    assessReview,
    assignDays,
    finishReview,
    type ReviewRegistration,
} from "./review";

const preferred = { id: "fixture-ben", code: "BEN", name: "Bến An" };
const bench: Stop = {
    id: "live-ben",
    schoolId: "demo-school",
    code: "BEN",
    name: "Bến An",
    address: "Đường Bến An",
    kind: "SERVICE_POINT",
    status: "ACTIVE",
    allowsPickup: true,
    allowsDropoff: true,
    latitude: 0,
    longitude: 0,
    accessNote: null,
    deletedAt: null,
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
};
const park: Stop = {
    ...bench,
    id: "live-park",
    code: "CV",
    name: "Công viên",
    allowsPickup: false,
};
const registration: ReviewRegistration = {
    id: "pending",
    student: { id: "student", code: "HS01", name: "Hà Lê" },
    status: "PENDING",
    submittedAt: "2026-11-20T01:00:00Z",
    submittedBy: "Hoa Lê",
    reviewNote: null,
    review: null,
    days: [
        {
            serviceDate: "2026-11-27",
            direction: "DROPOFF",
            requestedStop: preferred,
            approvedStop: null,
            requestedAddress: null,
        },
        {
            serviceDate: "2026-11-28",
            direction: "DROPOFF",
            requestedStop: preferred,
            approvedStop: null,
            requestedAddress: null,
        },
    ],
};
const review = { reviewer: "Điều phối", reviewedAt: "2026-11-23T01:00:00Z" };

describe("registration review", () => {
    it("applies a group assignment and overrides only the selected Saturday", () => {
        const all = assessReview(registration, {}, [bench, park], []);
        expect(all.groups.map((group) => group.assignedStop?.id)).toEqual([
            "live-ben",
        ]);
        const changed = assignDays({}, all.groups[0].days, park.id);
        const draft = assignDays(changed, [registration.days[1]], bench.id);
        const result = finishReview(
            registration,
            { kind: "approve", draft, stops: [bench, park], registrations: [] },
            review,
        );
        expect(result).toMatchObject({
            status: "APPROVED",
            review,
            days: [
                { approvedStop: { id: "live-park" } },
                { approvedStop: { id: "live-ben" } },
            ],
        });
    });

    it("blocks unavailable, deleted, and wrong-direction points after assignment", () => {
        const draft = assignDays({}, registration.days, park.id);
        for (const stop of [
            { ...park, status: "INACTIVE" as const },
            { ...park, deletedAt: review.reviewedAt },
            { ...park, allowsDropoff: false },
        ]) {
            expect(
                assessReview(registration, draft, [bench, stop], []).missing,
            ).toHaveLength(2);
            expect(() =>
                finishReview(
                    registration,
                    {
                        kind: "approve",
                        draft,
                        stops: [bench, stop],
                        registrations: [],
                    },
                    review,
                ),
            ).toThrow("Cần gán điểm hợp lệ");
        }
    });

    it("blocks the exact approved date and direction while leaving the new request pending", () => {
        const approved: ReviewRegistration = {
            ...registration,
            id: "approved",
            status: "APPROVED",
            days: [registration.days[1]],
        };
        const opposite: ReviewRegistration = {
            ...approved,
            id: "opposite",
            days: [{ ...registration.days[0], direction: "PICKUP" }],
        };
        const registrations = [approved, opposite, registration];
        expect(
            assessReview(
                registration,
                {},
                [bench],
                registrations,
            ).conflicts.map((day) => day.serviceDate),
        ).toEqual(["2026-11-28"]);
        expect(() =>
            finishReview(
                registration,
                { kind: "approve", draft: {}, stops: [bench], registrations },
                review,
            ),
        ).toThrow("trùng");
        expect(registration.status).toBe("PENDING");
    });

    it("requires a non-blank rejection reason and records the trimmed reason once", () => {
        expect(() =>
            finishReview(
                registration,
                { kind: "reject", reason: " \n " },
                review,
            ),
        ).toThrow("Nhập lý do");
        const rejected = finishReview(
            registration,
            { kind: "reject", reason: "  Ngoài phạm vi  " },
            review,
        );
        expect(rejected).toMatchObject({
            status: "REJECTED",
            reviewNote: "Ngoài phạm vi",
            review,
        });
        expect(() =>
            finishReview(
                rejected,
                { kind: "reject", reason: "Lý do khác" },
                review,
            ),
        ).toThrow("đã được xử lý");
    });
});
