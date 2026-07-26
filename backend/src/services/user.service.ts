import bcrypt from "bcrypt";
import {Role} from "@prisma/client";
import {
    userRepository,
    GetAllUsersParams,
    CreateUserData,
    UpdateUserData,
} from "../repositories/user.repository";
import { authService } from "./auth.service";
import {AuthorizationError, NotFoundError, ValidationError} from "../errors/http-errors";

const SALT_ROUNDS = 10;

class UserService {
    async getAll(params: GetAllUsersParams = {}) {
        return userRepository.getAll(params);
    }

    async exportAll(params: GetAllUsersParams = {}) {
        return userRepository.getAllForExport(params);
    }

    async getById(id: string, schoolId?: string) {
        const user = await userRepository.getById(id, schoolId);
        if (!user) {
            throw new NotFoundError("Không tìm thấy người dùng");
        }
        return user;
    }

    async getParents(schoolId?: string) {
        return userRepository.getParents(schoolId);
    }

    // actorSchoolId = school of the acting user (null for SUPER_ADMIN).
    async create(data: CreateUserData, createdBy?: string, actorSchoolId?: string | null) {
        if (!createdBy) {
            throw new ValidationError("Thiếu thông tin người tạo");
        }

        // Only SUPER_ADMIN (no school) may create another SUPER_ADMIN or target a
        // different school; a school ADMIN can only create within their own school.
        if (data.role === Role.SUPER_ADMIN && actorSchoolId) {
            throw new AuthorizationError("Chỉ quản trị hệ thống mới có thể tạo tài khoản này");
        }

        // Actor's school wins; SUPER_ADMIN may specify the target school in the body.
        const targetSchoolId = actorSchoolId ?? data.schoolId ?? null;
        if (data.role !== Role.SUPER_ADMIN && !targetSchoolId) {
            throw new ValidationError("Người dùng phải thuộc một trường học");
        }

        const user = await userRepository.create({
            ...data,
            schoolId: targetSchoolId,
            password: null,
            passwordSetupRequired: true,
        });

        let invite;
        try {
            invite = await authService.issueInvite(user.id, createdBy);
        } catch (error) {
            // roll back if invite creation fails
            await userRepository.hardDelete(user.id);
            throw error;
        }

        await authService.sendInviteEmail(data.email, invite.inviteLink);

        return {
            ...user,
        };
    }

    async update(id: string, schoolId: string | undefined, data: UpdateUserData) {
        const existingUser = await userRepository.getById(id, schoolId);
        if (!existingUser) {
            throw new NotFoundError("Không tìm thấy người dùng");
        }

        const role = data.role || existingUser.role;

        if (role === "DRIVER") {
            const licenseNumber = data.licenseNumber || existingUser.driverProfile?.licenseNumber;
            if (!licenseNumber) {
                throw new ValidationError("Thiếu thông tin giấy phép lái xe");
            }
            data.licenseNumber = licenseNumber;
        }

        if (data.password && data.password.trim() !== "") {
            data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
        } else {
            delete data.password;
        }

        return userRepository.update(id, schoolId, data);
    }

    async delete(id: string, schoolId?: string) {
        return userRepository.delete(id, schoolId);
    }

    async restore(id: string, schoolId?: string) {
        const existingUser = await userRepository.getById(id, schoolId, true);
        if (!existingUser) {
            throw new NotFoundError("Không tìm thấy người dùng");
        }
        if (!existingUser.deletedAt) {
            throw new ValidationError("Người dùng chưa bị xóa");
        }
        return userRepository.restore(id);
    }
}

export const userService = new UserService();
