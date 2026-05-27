import bcrypt from "bcrypt";
import {
    userRepository,
    GetAllUsersParams,
    CreateUserData,
    UpdateUserData,
} from "../repositories/user.repository";
import { authService } from "./auth.service";
import {NotFoundError, ValidationError} from "../errors/http-errors";

const SALT_ROUNDS = 10;

class UserService {
    async getAll(params: GetAllUsersParams = {}) {
        return userRepository.getAll(params);
    }

    async exportAll(params: GetAllUsersParams = {}) {
        return userRepository.getAllForExport(params);
    }

    async getById(id: string) {
        const user = await userRepository.getById(id);
        if (!user) {
            throw new NotFoundError("Không tìm thấy người dùng");
        }
        return user;
    }

    async getParents() {
        return userRepository.getParents();
    }

    async create(data: CreateUserData, createdBy?: string) {
        if (!createdBy) {
            throw new ValidationError("Thiếu thông tin người tạo");
        }

        const user = await userRepository.create({
            ...data,
            password: null,
            passwordSetupRequired: true,
        });

        const invite = await authService.issueInvite(user.id, createdBy);

        return {
            ...user,
            invite,
        };
    }

    async update(id: string, data: UpdateUserData) {
        const existingUser = await userRepository.getById(id);
        if (!existingUser) {
            throw new NotFoundError("Không tìm thấy người dùng");
        }

        const role = data.role || existingUser.role;

        if (role === "STUDENT") {
            const studentId = data.studentId || existingUser.studentProfile?.studentId;
            const studentClass = data.studentClass || existingUser.studentProfile?.studentClass;
            if (!studentId || !studentClass) {
                throw new ValidationError("Thiếu thông tin hồ sơ học sinh");
            }
            data.studentId = studentId;
            data.studentClass = studentClass;
        }

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

        return userRepository.update(id, data);
    }

    async delete(id: string) {
        return userRepository.delete(id);
    }

    async restore(id: string) {
        const existingUser = await userRepository.getById(id, true);
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
