import { z } from "zod";
import type { Registration } from "../../../../../fixtures/transport/contract";

export const registrationListPath = "/admin/service-registrations";
export const registrationId = z.uuid();

export function registrationDetailPath(id: string) {
    return `${registrationListPath}/${encodeURIComponent(id)}`;
}

export function registrationsByStatusPath(status: Registration["status"]) {
    return status === "PENDING"
        ? registrationListPath
        : `${registrationListPath}?status=${status}`;
}

export function reviewStopCataloguePath(id: string) {
    return `/admin/stops?${new URLSearchParams({ registration: id })}`;
}
