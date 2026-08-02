import { describe, expect, it } from "vitest";
import { resolveTrustProxyHops } from "./trust-proxy";

describe("resolveTrustProxyHops", () => {
    it("defaults to 0 when unset", () => {
        expect(resolveTrustProxyHops(undefined)).toBe(0);
    });

    it("defaults to 0 for an empty string", () => {
        expect(resolveTrustProxyHops("")).toBe(0);
    });

    it("parses a valid hop count", () => {
        expect(resolveTrustProxyHops("1")).toBe(1);
        expect(resolveTrustProxyHops("2")).toBe(2);
    });

    it("falls back to 0 for non-numeric input", () => {
        expect(resolveTrustProxyHops("true")).toBe(0);
        expect(resolveTrustProxyHops("yes")).toBe(0);
    });

    it("falls back to 0 for a negative count", () => {
        expect(resolveTrustProxyHops("-1")).toBe(0);
    });

    it("falls back to 0 for a non-integer", () => {
        expect(resolveTrustProxyHops("1.5")).toBe(0);
    });
});
