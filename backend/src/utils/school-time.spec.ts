import { describe, expect, it } from "vitest";
import { schoolInstant, dateValue } from "./school-time";

describe("school-local service time", () => {
    it("interprets school time independently of the server timezone", () => {
        expect(schoolInstant("2026-09-01", "07:00", "Asia/Ho_Chi_Minh").toISOString()).toBe("2026-09-01T00:00:00.000Z");
        expect(schoolInstant("2026-09-01", "07:00:15", "Asia/Kolkata").toISOString()).toBe("2026-09-01T01:30:15.000Z");
    });
    it("rejects impossible dates and non-existent or repeated local times", () => {
        expect(() => dateValue("2026-02-30")).toThrow();
        expect(() => schoolInstant("2026-03-08", "02:30", "America/New_York")).toThrow();
        expect(() => schoolInstant("2026-11-01", "01:30", "America/New_York")).toThrow();
    });
});
