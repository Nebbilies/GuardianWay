import { describe, it, expect, vi, beforeEach } from "vitest";
import { runWithTenant } from "../config/tenant-db";

vi.mock("../repositories/audit.repository", () => ({
    auditRepository: {
        create: vi.fn().mockResolvedValue(undefined),
        findActorEmail: vi.fn().mockResolvedValue("actor@school.vn"),
        getAll: vi.fn().mockResolvedValue({ data: [], metadata: {} }),
    },
}));
vi.mock("../utils/logger", () => ({
    logger: { info: vi.fn(), error: vi.fn() },
}));

import { auditService } from "./audit.service";
import { auditRepository } from "../repositories/audit.repository";
import { logger } from "../utils/logger";

describe("auditService.record", () => {
    beforeEach(() => vi.clearAllMocks());

    it("fills actor/school/trace from AsyncLocalStorage", async () => {
        await runWithTenant(
            { schoolId: "school-1", userId: "user-1", role: "ADMIN", traceId: "trace-1", ip: "1.2.3.4" },
            async () => {
                await auditService.record({ action: "bus.created", targetType: "Bus", targetId: "bus-9" });
            },
        );

        expect(auditRepository.create).toHaveBeenCalledTimes(1);
        const arg = (auditRepository.create as unknown as { mock: { calls: any[][] } }).mock.calls[0][0];
        expect(arg).toMatchObject({
            action: "bus.created",
            actorId: "user-1",
            actorRole: "ADMIN",
            schoolId: "school-1",
            targetType: "Bus",
            targetId: "bus-9",
            traceId: "trace-1",
            ip: "1.2.3.4",
            actorEmail: "actor@school.vn",
        });
    });

    it("lets an explicit ctx override win over ALS (auth events)", async () => {
        await auditService.record(
            { action: "auth.login_failed", metadata: { email: "x@y.vn" } },
            { actorId: null, actorEmail: "x@y.vn", schoolId: null, ip: "9.9.9.9" },
        );

        const arg = (auditRepository.create as unknown as { mock: { calls: any[][] } }).mock.calls[0][0];
        expect(arg).toMatchObject({
            action: "auth.login_failed",
            actorId: null,
            actorEmail: "x@y.vn",
            schoolId: null,
            ip: "9.9.9.9",
        });
        // no actorId -> no email lookup
        expect(auditRepository.findActorEmail).not.toHaveBeenCalled();
    });

    it("never throws and logs when the repository fails", async () => {
        (auditRepository.create as unknown as { mockRejectedValueOnce: (e: Error) => void })
            .mockRejectedValueOnce(new Error("db down"));

        await expect(
            auditService.record({ action: "school.deleted", targetType: "School", targetId: "s1" }),
        ).resolves.toBeUndefined();
        expect(logger.error).toHaveBeenCalled();
    });
});
