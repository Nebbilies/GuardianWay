import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../repositories/school.repository", () => ({
    schoolRepository: {
        getActiveById: vi.fn(),
        create: vi.fn(),
    },
}));
vi.mock("../repositories/user.repository", () => ({
    userRepository: { create: vi.fn(), hardDelete: vi.fn() },
}));
vi.mock("./auth.service", () => ({
    authService: { issueInvite: vi.fn(), sendInviteEmail: vi.fn() },
}));

import { schoolService } from "./school.service";
import { schoolRepository } from "../repositories/school.repository";
import { userRepository } from "../repositories/user.repository";
import { authService } from "./auth.service";
import { NotFoundError } from "../errors/http-errors";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("schoolService.create", () => {
    it("derives the slug from the name when slug is omitted", async () => {
        (schoolRepository.create as any).mockResolvedValue({ id: "s1" });
        await schoolService.create({ name: "Trường Nguyễn Du", address: "1 Nguyễn Du" });
        expect(schoolRepository.create).toHaveBeenCalledWith({
            name: "Trường Nguyễn Du",
            address: "1 Nguyễn Du",
            slug: "truong-nguyen-du",
        });
    });
});

describe("schoolService.onboardAdmin", () => {
    it("creates an ADMIN for the school and returns the invite link", async () => {
        (schoolRepository.getActiveById as any).mockResolvedValue({ id: "s1" });
        (userRepository.create as any).mockResolvedValue({ id: "u1", email: "a@x.vn" });
        (authService.issueInvite as any).mockResolvedValue({ inviteLink: "http://x/setup?token=abc" });

        const result = await schoolService.onboardAdmin("s1", { name: "Admin", email: "a@x.vn" }, "creator1");

        expect(userRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({ role: "ADMIN", schoolId: "s1", email: "a@x.vn", passwordSetupRequired: true }),
        );
        expect(authService.sendInviteEmail).toHaveBeenCalledWith("a@x.vn", "http://x/setup?token=abc");
        expect(result).toEqual({ user: { id: "u1", email: "a@x.vn" }, inviteLink: "http://x/setup?token=abc" });
    });

    it("rolls back the created user and rethrows when invite issuance fails", async () => {
        (schoolRepository.getActiveById as any).mockResolvedValue({ id: "s1" });
        (userRepository.create as any).mockResolvedValue({ id: "u1", email: "a@x.vn" });
        (authService.issueInvite as any).mockRejectedValue(new Error("smtp down"));

        await expect(
            schoolService.onboardAdmin("s1", { name: "Admin", email: "a@x.vn" }, "creator1"),
        ).rejects.toThrow("smtp down");

        expect(userRepository.hardDelete).toHaveBeenCalledWith("u1");
        expect(authService.sendInviteEmail).not.toHaveBeenCalled();
    });

    it("still resolves with the invite link when sending the invite email fails", async () => {
        (schoolRepository.getActiveById as any).mockResolvedValue({ id: "s1" });
        (userRepository.create as any).mockResolvedValue({ id: "u1", email: "a@x.vn" });
        (authService.issueInvite as any).mockResolvedValue({ inviteLink: "http://x/setup?token=abc" });
        (authService.sendInviteEmail as any).mockRejectedValue(new Error("smtp down"));

        const result = await schoolService.onboardAdmin("s1", { name: "Admin", email: "a@x.vn" }, "creator1");

        expect(result).toEqual({ user: { id: "u1", email: "a@x.vn" }, inviteLink: "http://x/setup?token=abc" });
        expect(userRepository.hardDelete).not.toHaveBeenCalled();
    });

    it("throws NotFoundError and creates no user when the school is missing", async () => {
        (schoolRepository.getActiveById as any).mockResolvedValue(null);

        await expect(
            schoolService.onboardAdmin("missing", { name: "Admin", email: "a@x.vn" }, "creator1"),
        ).rejects.toBeInstanceOf(NotFoundError);

        expect(userRepository.create).not.toHaveBeenCalled();
    });
});
