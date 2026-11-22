import { z } from "zod";
import { ValidationError } from "../errors/http-errors";

export const localDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
        const date = new Date(value + "T00:00:00Z");
        return (
            value >= "1900-01-01" &&
            Number.isFinite(date.getTime()) &&
            date.toISOString().slice(0, 10) === value
        );
    }, "Invalid calendar date");
export const localTimeSchema = z
    .string()
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/);
export function dateValue(value: string) {
    return new Date(localDateSchema.parse(value) + "T00:00:00Z");
}
export function dateText(value: Date) {
    return value.toISOString().slice(0, 10);
}
export function timeValue(value: string) {
    return new Date(
        "1970-01-01T" + localTimeSchema.parse(value).padEnd(8, ":00") + "Z",
    );
}
export function timeText(value: Date) {
    return value.toISOString().slice(11, 19);
}

function formatter(timeZone: string) {
    try {
        return new Intl.DateTimeFormat("en-GB", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23",
        });
    } catch {
        throw new ValidationError("Invalid school timezone");
    }
}
function parts(date: Date, format: Intl.DateTimeFormat) {
    const fields = Object.fromEntries(
        format
            .formatToParts(date)
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, part.value]),
    );
    return (
        fields.year +
        "-" +
        fields.month +
        "-" +
        fields.day +
        "T" +
        fields.hour +
        ":" +
        fields.minute +
        ":" +
        fields.second
    );
}
export function schoolDateAt(instant: Date, timezone: string) {
    return parts(instant, formatter(timezone)).slice(0, 10);
}

/** Resolve a school-local date/time; reject DST gaps and repeated local times. */
export function schoolInstant(
    date: string,
    time: string,
    timezone: string,
): Date {
    const local = dateText(dateValue(date)) + "T" + timeText(timeValue(time));
    const nominal = new Date(local + "Z").getTime(),
        format = formatter(timezone);
    const offsets = new Set<number>();
    // Sample both sides of timezone transitions, including date-line changes.
    for (let hours = -36; hours <= 36; hours += 6) {
        const sample = new Date(nominal + hours * 3600000);
        offsets.add(
            new Date(parts(sample, format) + "Z").getTime() - sample.getTime(),
        );
    }
    const candidates = [...offsets]
        .map((offset) => new Date(nominal - offset))
        .filter((candidate) => parts(candidate, format) === local);
    if (candidates.length !== 1) {
        throw new ValidationError(
            "Local time does not exist or is ambiguous in the school timezone",
        );
    }
    return candidates[0]!;
}
