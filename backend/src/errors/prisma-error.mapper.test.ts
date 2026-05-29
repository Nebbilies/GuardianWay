import {describe, it, expect} from "vitest";
import {Prisma} from "@prisma/client";
import {mapPrismaError} from "./prisma-error.mapper";
import {ConflictError, NotFoundError, ValidationError} from "./http-errors";

function knownError(code: string, meta?: Record<string, unknown>) {
    return new Prisma.PrismaClientKnownRequestError("boom", {
        code,
        clientVersion: "7.0.0",
        meta,
    });
}

describe("mapPrismaError", () => {
    it("passes AppError instances through unchanged", () => {
        const err = new NotFoundError("nope");
        expect(mapPrismaError(err)).toBe(err);
    });

    it("maps P2002 to ConflictError including the field name", () => {
        const result = mapPrismaError(knownError("P2002", {target: ["email"]}));
        expect(result).toBeInstanceOf(ConflictError);
        expect(result.message).toContain("email");
    });

    it("maps P2025 to NotFoundError", () => {
        expect(mapPrismaError(knownError("P2025"))).toBeInstanceOf(NotFoundError);
    });

    it("maps P2000 to ValidationError", () => {
        expect(mapPrismaError(knownError("P2000"))).toBeInstanceOf(ValidationError);
    });

    it("maps PrismaClientValidationError to ValidationError", () => {
        const err = new Prisma.PrismaClientValidationError("bad", {clientVersion: "7.0.0"});
        expect(mapPrismaError(err)).toBeInstanceOf(ValidationError);
    });

    it("returns unknown errors unchanged", () => {
        const err = new Error("mystery");
        expect(mapPrismaError(err)).toBe(err);
    });
});
