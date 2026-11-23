import { Badge } from "@/components/ui/badge";
import { dateValue } from "@/lib/school-time";
import type { ReviewRegistration } from "./review";

type Status = ReviewRegistration["status"];
type Direction = ReviewRegistration["days"][number]["direction"];

export const statusLabels: Record<Status, string> = {
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
};
export const directionLabels: Record<Direction, string> = {
    PICKUP: "Chiều đón",
    DROPOFF: "Chiều trả",
};

export function StatusBadge({ status }: { status: Status }) {
    return (
        <Badge
            variant="outline"
            data-tone={
                status === "APPROVED"
                    ? "positive"
                    : status === "REJECTED"
                      ? "negative"
                      : undefined
            }
            className={
                status === "PENDING"
                    ? "border-transparent bg-accent text-accent-foreground"
                    : "gw-status"
            }
        >
            {statusLabels[status]}
        </Badge>
    );
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
});

export const dateLabel = (date: string) => dateFormat.format(dateValue(date));

const weekdayFormat = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    timeZone: "UTC",
});

export function weekdayDateLabel(date: string) {
    return weekdayFormat.format(dateValue(date)) + ", " + dateLabel(date);
}

export function dateRange(first: string, last: string) {
    if (first === last) return dateLabel(first);
    if (first.slice(0, 7) === last.slice(0, 7))
        return first.slice(8) + "–" + dateLabel(last);
    return dateLabel(first) + " – " + dateLabel(last);
}

export function displayDays(days: { serviceDate: string }[]) {
    const dates = [...new Set(days.map((day) => day.serviceDate))].sort();
    const ranges: { start: string; end: string }[] = [];
    for (const date of dates) {
        const last = ranges.at(-1);
        if (
            last &&
            dateValue(date).getTime() - dateValue(last.end).getTime() ===
                86_400_000
        )
            last.end = date;
        else ranges.push({ start: date, end: date });
    }
    return ranges.map(({ start, end }) => dateRange(start, end)).join(", ");
}

export function period(days: ReviewRegistration["days"]) {
    const dates = days.map((day) => day.serviceDate).sort();
    return dates.length ? dateRange(dates[0], dates[dates.length - 1]) : "—";
}

export function instantLabel(value: string, timeZone: string) {
    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone,
    }).format(new Date(value));
}
