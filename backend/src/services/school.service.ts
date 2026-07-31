import { Role } from "@prisma/client";
import { slugify } from "../utils/slugify";
import {
    schoolRepository,
    GetAllSchoolsParams,
} from "../repositories/school.repository";
import { userRepository } from "../repositories/user.repository";
import { authService } from "./auth.service";
import { auditService } from "./audit.service";
import { NotFoundError, ValidationError } from "../errors/http-errors";

class SchoolService {
    async getAll(params: GetAllSchoolsParams = {}) {
        return schoolRepository.getAll(params);
    }

    async create(data: { name: string; address: string; slug?: string }) {
        const slug = slugify(data.slug || data.name);
        if (!slug) {
            throw new ValidationError("Không thể tạo slug từ tên trường");
        }
        const created = await schoolRepository.create({ name: data.name, address: data.address, slug });
        await auditService.record(
            { action: "school.created", targetType: "School", targetId: created.id, metadata: { name: created.name, slug: created.slug } },
            { schoolId: created.id },
        );
        return created;
    }

    async update(id: string, data: { name: string; address: string; slug: string; isActive: boolean }) {
        const slug = slugify(data.slug || data.name);
        if (!slug) {
            throw new ValidationError("Không thể tạo slug từ tên trường");
        }
        const updated = await schoolRepository.update(id, {
            name: data.name,
            address: data.address,
            slug,
            isActive: data.isActive,
        });
        await auditService.record(
            { action: "school.updated", targetType: "School", targetId: id, metadata: { name: data.name, isActive: data.isActive } },
            { schoolId: id },
        );
        return updated;
    }

    async delete(id: string) {
        const result = await schoolRepository.softDelete(id);
        await auditService.record(
            { action: "school.deleted", targetType: "School", targetId: id, metadata: { name: result.name } },
            { schoolId: id },
        );
        return result;
    }

    async restore(id: string) {
        const result = await schoolRepository.restore(id);
        await auditService.record(
            { action: "school.restored", targetType: "School", targetId: id },
            { schoolId: id },
        );
        return result;
    }

    async getAdmins(id: string) {
        const school = await schoolRepository.getActiveById(id);
        if (!school) {
            throw new NotFoundError("Không tìm thấy trường học");
        }
        return schoolRepository.listAdmins(id);
    }

    async onboardAdmin(schoolId: string, data: { name: string; email: string }, createdBy: string) {
        const school = await schoolRepository.getActiveById(schoolId);
        if (!school) {
            throw new NotFoundError("Không tìm thấy trường học");
        }

        const user = await userRepository.create({
            name: data.name,
            email: data.email,
            role: Role.ADMIN,
            schoolId,
            password: null,
            passwordSetupRequired: true,
        });

        let invite;
        try {
            invite = await authService.issueInvite(user.id, createdBy);
        } catch (error) {
            // roll back so the (unique) email isn't consumed by an inviteless user
            await userRepository.hardDelete(user.id);
            throw error;
        }

        try {
            await authService.sendInviteEmail(data.email, invite.inviteLink);
        } catch (emailError) {
            // Best-effort: the super-admin still gets the invite link to share manually.
            console.error("Không thể gửi email mời quản trị viên:", emailError);
        }

        await auditService.record(
            { action: "admin.onboarded", targetType: "User", targetId: user.id, metadata: { email: data.email, name: data.name } },
            { schoolId },
        );

        return { user, inviteLink: invite.inviteLink };
    }
}

export const schoolService = new SchoolService();
