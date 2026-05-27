import bcrypt from "bcrypt";
import {
    userRepository,
    GetAllUsersParams,
    CreateUserData,
    UpdateUserData,
} from "../repositories/user.repository";
import { authService } from "./auth.service";
import {ConflictError, NotFoundError, ValidationError} from "../errors/http-errors";

const SALT_ROUNDS = 10;

class UserService {
    async getAll(params: GetAllUsersParams = {}) {
        return userRepository.getAll(params);
    }

    async exportAll(params: GetAllUsersParams = {}) {
        return userRepository.getAllForExport(params);
    }

    async getById(id: string) {
        if (!id) {
            throw new ValidationError("Thiếu thông tin người dùng");
        }
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
        const { name, email, role } = data;

        if (!name || !email || !role) {
            throw new ValidationError("Thiếu thông tin người dùng");
        }

        if (data.password) {
            throw new ValidationError("Không được thiết lập mật khẩu khi tạo người dùng");
        }

        if (!createdBy) {
            throw new ValidationError("Thiếu thông tin người tạo");
        }

        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            throw new ConflictError("Email đã được sử dụng");
        }

        if (role === "STUDENT") {
            if (!data.studentId || !data.studentClass) {
                throw new ValidationError("Thiếu thông tin hồ sơ học sinh");
            }
        }

        if (role === "DRIVER") {
            if (!data.licenseNumber) {
                throw new ValidationError("Thiếu thông tin giấy phép lái xe");
            }
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
        if (!id) {
            throw new ValidationError("Thiếu thông tin người dùng");
        }

        // Check user exists
        const existingUser = await userRepository.getById(id);
        if (!existingUser) {
            throw new NotFoundError("Không tìm thấy người dùng");
        }

        // Check email uniqueness if email changed
        if (data.email && data.email !== existingUser.email) {
            const emailUser = await userRepository.findByEmail(data.email);
            if (emailUser) {
                throw new ConflictError("Email đã được sử dụng");
            }
        }

        const role = data.role || existingUser.role;

        // Validate role-specific fields
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

        // Hash password if provided, otherwise remove from update
        if (data.password && data.password.trim() !== "") {
            data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
        } else {
            delete data.password;
        }

        return userRepository.update(id, data);
    }

    async delete(id: string) {
        if (!id) {
            throw new ValidationError("Thiếu thông tin người dùng");
        }
        return userRepository.delete(id);
    }

    async restore(id: string) {
        if (!id) {
            throw new ValidationError("Thiếu thông tin người dùng");
        }
        const existingUser = await userRepository.getById(id, true);
        if (!existingUser) {
            throw new NotFoundError("Không tìm thấy người dùng");
        } else {
            if (!existingUser.deletedAt) {
                throw new ValidationError("Người dùng chưa bị xóa");
            }
        }
        return userRepository.restore(id);
    }
}

export const userService = new UserService();
