import { fixtureClient, trips, type Actor } from "./fixture";

type Scenario = { label: string; actor: Actor; trip?: keyof typeof trips };
export const scenarios: Scenario[] = [
    { label: "Đăng ký · quản trị trường", actor: "admin" },
    { label: "Đăng ký · phụ huynh có hai con", actor: "parent-1" },
    { label: "Đăng ký · phụ huynh chưa có đơn", actor: "parent-4" },
    { label: "Đăng ký · tài xế thiếu quyền", actor: "driver-1" },
    { label: "Chuyến đón · có hành khách", actor: "driver-1", trip: "planned" },
    { label: "Chuyến trả · danh sách trống", actor: "driver-2", trip: "empty" },
    {
        label: "Chuyến đã kết thúc · điểm danh",
        actor: "driver-1",
        trip: "completed",
    },
    { label: "Chuyến đã hủy · lý do", actor: "admin", trip: "cancelled" },
    { label: "Chuyến của tài xế khác", actor: "driver-2", trip: "completed" },
    {
        label: "Danh sách hành khách · phụ huynh thiếu quyền",
        actor: "parent-1",
        trip: "planned",
    },
];
export async function preview(scenario: Scenario): Promise<string[]> {
    const client = fixtureClient(scenario.actor);
    try {
        if (!scenario.trip) {
            const { data, metadata } = await client.registrations();
            return [
                `200 · ${metadata.totalCount} đăng ký`,
                ...data.map(
                    (r) =>
                        `${r.student.name} (${r.student.code}) · ${r.status} · ${r.days.map((d) => d.serviceDate + " " + d.direction).join(", ")}`,
                ),
            ];
        }
        const { trip, passengers } = await client.passengers(
            trips[scenario.trip],
        );
        return [
            `200 · ${trip.serviceDate} · ${trip.status} · ${passengers.length} hành khách`,
            ...(trip.cancellationReason ? [trip.cancellationReason] : []),
            ...passengers.map((p) =>
                [
                    p.student.name,
                    p.stop.name,
                    ...p.attendance.map((e) => e.kind + " " + e.occurredAt),
                ].join(" · "),
            ),
        ];
    } catch (error) {
        if (error instanceof Error && "status" in error && error.status === 403)
            return ["403 · Tài khoản này không có quyền xem."];
        throw error;
    }
}
