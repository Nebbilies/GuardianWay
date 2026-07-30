import { Role } from "@prisma/client";
import { slugify } from "../utils/slugify";
import {
    schoolRepository,
    GetAllSchoolsParams,
} from "../repositories/school.repository";
import { userRepository } from "../repositories/user.repository";
import { authService } from "./auth.service";
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
        return schoolRepository.create({ name: data.name, address: data.address, slug });
    }

    async update(id: string, data: { name: string; address: string; slug: string; isActive: boolean }) {
        const slug = slugify(data.slug || data.name);
        if (!slug) {
            throw new ValidationError("Không thể tạo slug từ tên trường");
        }
        return schoolRepository.update(id, {
            name: data.name,
            address: data.address,
            slug,
            isActive: data.isActive,
        });
    }

    async delete(id: string) {
        return schoolRepository.softDelete(id);
    }

    async restore(id: string) {
        return schoolRepository.restore(id);
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

        return { user, inviteLink: invite.inviteLink };
    }
}

export const schoolService = new SchoolService();
