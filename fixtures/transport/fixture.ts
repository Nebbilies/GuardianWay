import demo from "./demo.json";
import { transportClient } from "./contract";

export type Actor =
    "admin" | keyof typeof demo.guardians | "driver-1" | "driver-2";
export const trips = {
    planned: demo.manifests["trip-am-23"].body.trip.id,
    empty: demo.manifests["trip-pm-23"].body.trip.id,
    completed: demo.manifests["trip-am-16"].body.trip.id,
    cancelled: demo.manifests["trip-pm-16"].body.trip.id,
};
function problem(
    status: number,
    code: string,
    title: string,
    instance: string,
) {
    return {
        status,
        body: {
            type:
                "https://api.guardianway.local/problems/" + code.toLowerCase(),
            title,
            status,
            code,
            detail: title,
            instance,
            traceId: "demo-transport",
            timestamp: "2026-11-23T00:00:00Z",
        },
    };
}
// Actor selection is local to this synthetic transport. No identity override is sent to a backend.
export function fixtureResponse(actor: Actor, path: string) {
    const url = new URL(path, "https://fixture.invalid");
    const instance = "/api" + path;
    const forbidden = () =>
        problem(403, "AUTHORIZATION_ERROR", "Forbidden", instance);
    if (url.pathname === "/service-registrations") {
        let visible = demo.registrations;
        if (actor !== "admin") {
            if (actor === "driver-1" || actor === "driver-2")
                return forbidden();
            visible = visible.filter((row) =>
                demo.guardians[actor].includes(row.student.id),
            );
        }
        const page = Number(url.searchParams.get("page") ?? 1);
        const limit = Number(url.searchParams.get("limit") ?? 10);
        if (
            !Number.isInteger(page) ||
            page < 1 ||
            page > 100000 ||
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 100
        ) {
            return problem(
                400,
                "VALIDATION_ERROR",
                "Validation failed",
                instance,
            );
        }
        const pageCount = Math.ceil(visible.length / limit);
        return {
            status: 200,
            body: {
                data: visible.slice((page - 1) * limit, page * limit),
                metadata: {
                    currentPage: page,
                    totalCount: visible.length,
                    pageCount,
                    isFirstPage: page === 1,
                    isLastPage: page >= pageCount,
                    previousPage: page > 1 ? page - 1 : null,
                    nextPage: page < pageCount ? page + 1 : null,
                },
            },
        };
    }
    const tripId = /^\/bus-trips\/([^/]+)\/passengers$/.exec(url.pathname)?.[1];
    if (tripId) {
        if (actor !== "admin" && actor !== "driver-1" && actor !== "driver-2")
            return forbidden();
        const manifest = Object.values(demo.manifests).find(
            (row) => row.body.trip.id === tripId,
        );
        if (manifest) {
            if (actor !== "admin" && manifest.driver !== actor)
                return forbidden();
            return { status: 200, body: manifest.body };
        }
    }
    return problem(404, "NOT_FOUND", "Not found", instance);
}
export function fixtureClient(actor: Actor) {
    return transportClient(async <T>(path: string) => {
        const { body } = fixtureResponse(actor, path);
        if ("code" in body) throw Object.assign(new Error(body.detail), body);
        return body as T;
    });
}
