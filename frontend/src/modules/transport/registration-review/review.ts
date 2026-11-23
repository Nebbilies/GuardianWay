import type { PaginatedResponse } from "@/lib/http/contracts";
import type { Stop } from "@/modules/planning/stops/contracts";
import type {
    Direction,
    Registration,
} from "../../../../../fixtures/transport/contract";

type StopReference = NonNullable<Registration["days"][number]["requestedStop"]>;
type ReviewDay = Registration["days"][number] & {
    requestedAddress: string | null;
};
export type ReviewMetadata = { reviewer: string; reviewedAt: string };
export type ReviewRegistration = Omit<Registration, "days"> & {
    submittedBy: string;
    review: ReviewMetadata | null;
    days: ReviewDay[];
};
export type Draft = Record<string, string | null>;
export type DayGroup = {
    key: string;
    direction: Direction;
    days: ReviewDay[];
    requestedStop: StopReference | null;
    assignedStop: Stop | null;
    approvedStop: StopReference | null;
};

const dayKey = (day: ReviewDay) => `${day.serviceDate}:${day.direction}`;

export function assignDays(
    draft: Draft,
    days: ReviewDay[],
    stopId: string | null,
): Draft {
    return {
        ...draft,
        ...Object.fromEntries(days.map((day) => [dayKey(day), stopId])),
    };
}

export function eligibleStop(stop: Stop, direction: Direction) {
    return (
        stop.kind === "SERVICE_POINT" &&
        stop.status === "ACTIVE" &&
        !stop.deletedAt &&
        (direction === "PICKUP" ? stop.allowsPickup : stop.allowsDropoff)
    );
}

export function assessReview(
    registration: ReviewRegistration,
    draft: Draft,
    catalogue: Stop[],
    registrations: ReviewRegistration[],
) {
    const byId = new Map(catalogue.map((stop) => [stop.id, stop]));
    const byCode = new Map(catalogue.map((stop) => [stop.code, stop]));
    const approved = new Set(
        registrations
            .filter(
                (other) =>
                    other.id !== registration.id &&
                    other.student.id === registration.student.id &&
                    other.status === "APPROVED",
            )
            .flatMap((other) => other.days.map(dayKey)),
    );
    const groups = new Map<string, DayGroup>();
    const assignments = new Map<string, Stop>();
    const missing: ReviewDay[] = [];
    const conflicts: ReviewDay[] = [];

    for (const day of [...registration.days].sort((a, b) =>
        a.serviceDate.localeCompare(b.serviceDate),
    )) {
        const key = dayKey(day);
        const preferred =
            day.requestedStop && byCode.get(day.requestedStop.code);
        const assigned = Object.hasOwn(draft, key)
            ? byId.get(draft[key] ?? "")
            : preferred;
        const valid =
            assigned && eligibleStop(assigned, day.direction) ? assigned : null;
        if (registration.status === "PENDING") {
            if (valid) assignments.set(key, valid);
            else missing.push(day);
            if (approved.has(key)) conflicts.push(day);
        }
        const groupKey = JSON.stringify([
            day.direction,
            day.requestedStop?.id ?? day.requestedAddress,
            day.approvedStop?.id,
            valid?.id,
        ]);
        let group = groups.get(groupKey);
        if (!group) {
            group = {
                key: groupKey,
                direction: day.direction,
                days: [],
                requestedStop: day.requestedStop,
                assignedStop: valid,
                approvedStop: day.approvedStop,
            };
            groups.set(groupKey, group);
        }
        group.days.push(day);
    }

    return { groups: [...groups.values()], assignments, missing, conflicts };
}

type ReviewDecision =
    | { kind: "reject"; reason: string }
    | {
          kind: "approve";
          draft: Draft;
          stops: Stop[];
          registrations: ReviewRegistration[];
      };

export class ReviewError extends Error {}

export function finishReview(
    registration: ReviewRegistration,
    decision: ReviewDecision,
    review: ReviewMetadata,
): ReviewRegistration {
    if (registration.status !== "PENDING")
        throw new ReviewError("Đăng ký đã được xử lý.");
    if (decision.kind === "reject") {
        const reason = decision.reason.trim();
        if (!reason) throw new ReviewError("Nhập lý do từ chối.");
        return {
            ...registration,
            status: "REJECTED",
            reviewNote: reason,
            review,
        };
    }

    const { assignments, conflicts, missing } = assessReview(
        registration,
        decision.draft,
        decision.stops,
        decision.registrations,
    );
    if (conflicts.length)
        throw new ReviewError("Có ngày trùng với lịch đã duyệt.");
    if (!registration.days.length || missing.length)
        throw new ReviewError("Cần gán điểm hợp lệ cho tất cả ngày đăng ký.");
    return {
        ...registration,
        status: "APPROVED",
        reviewNote: null,
        review,
        days: registration.days.map((day) => {
            const stop = assignments.get(dayKey(day))!;
            return {
                ...day,
                approvedStop: { id: stop.id, code: stop.code, name: stop.name },
            };
        }),
    };
}

export function searchText(text: string) {
    return text
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replaceAll("đ", "d");
}

export function paginate<Row>(
    rows: Row[],
    page: number,
    limit: number,
): PaginatedResponse<Row> {
    const totalCount = rows.length;
    const pageCount = Math.ceil(totalCount / limit);
    const currentPage = Math.min(page, Math.max(1, pageCount));
    return {
        data: rows.slice((currentPage - 1) * limit, currentPage * limit),
        metadata: {
            currentPage,
            totalCount,
            pageCount,
            isFirstPage: currentPage === 1,
            isLastPage: currentPage >= pageCount,
            previousPage: currentPage > 1 ? currentPage - 1 : null,
            nextPage: currentPage < pageCount ? currentPage + 1 : null,
        },
    };
}
