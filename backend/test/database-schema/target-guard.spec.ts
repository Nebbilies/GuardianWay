import { describe, expect, it } from "vitest";
import { targetUrl, shadowUrl } from "../../database-schema/target-guard.cjs";

describe("database URL guard", () => {
    it.each(["host=remote.example", "port=6543", "user=other", "password=other", "sslmode=disable"])(
        "rejects primary URL query parameters: %s", query => {
            expect(() => targetUrl(`postgresql://unused:unused@127.0.0.1/guardianway_schema_test?${query}`)).toThrow();
        });

    it.each([
        "postgresql://unused:unused@127.0.0.1:55432/guardianway_dev",
        "postgres://unused:unused@localhost/guardianway_schema_test",
        "postgresql://unused:unused@[::1]/guardianway_schema_demo",
    ])("preserves supported primary URLs without query strings: %s", value => {
        expect(targetUrl(value)).toBe(value);
    });
});

describe("shadow database URL guard", () => {
    const primary = "postgresql://unused:unused@127.0.0.1/guardianway_schema_test";

    it.each([
        "postgresql://unused:unused@127.0.0.1/guardianway",
        "postgresql://unused:unused@127.0.0.1/guardianway_dev",
        "postgresql://unused:unused@remote.example/guardianway_schema_shadow",
        "postgresql://unused:unused@127.0.0.1/guardianway_schema_shadow?host=remote.example",
        "postgresql://unused:unused@127.0.0.1/guardianway_schema_shadow?port=6543",
        "postgresql://unused:unused@127.0.0.1/guardianway_schema_shadow?user=other",
        "postgresql://unused:unused@127.0.0.1/guardianway_schema_shadow?password=other",
        "postgresql://unused:unused@127.0.0.1/guardianway_schema_shadow?sslmode=disable",
        "https://localhost/guardianway_schema_shadow",
    ])("rejects unsafe or nondisposable shadow targets: %s", value => {
        expect(() => shadowUrl(value, primary)).toThrow();
    });

    it.each([
        primary,
        "postgres://other:other@localhost:5432/guardianway_schema_test",
        "postgresql://other:other@[::1]:5432/guardianway_schema_test",
    ])("rejects the same database despite URL spelling or credentials: %s", value => {
        expect(() => shadowUrl(value, primary)).toThrow(/different from the primary/);
    });

    it.each(["127.0.0.1", "localhost", "[::1]"])("allows a dedicated shadow on %s", host => {
        const value = `postgresql://unused:unused@${host}:55432/guardianway_schema_shadow`;
        expect(shadowUrl(value, primary)).toBe(value);
    });
});
