import bcrypt from "bcrypt";
import {
    userRepository,
    GetAllUsersParams,
    CreateUserData,
    UpdateUserData,
} from "../repositories/user.repository";

const SALT_ROUNDS = 10;

class UserService {
    async getAll(params: GetAllUsersParams = {}) {
        return userRepository.getAll(params);
    }

    async getById(id: string) {
        if (!id) {
            throw new Error("Thiếu thông tin người dùng");
        }
        const user = await userRepository.getById(id);
        if (!user) {
            throw new Error("Không tìm thấy người dùng");
        }
        return user;
    }

    async getParents() {
        return userRepository.getParents();
    }

    async create(data: CreateUserData) {
        const { name, email, password, role } = data;

        if (!name || !email || !password || !role) {
            throw new Error("Thiếu thông tin người dùng");
        }

        // Check email uniqueness
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error("Email đã được sử dụng");
        }

        // Validate role-specific fields
        if (role === "STUDENT") {
            if (!data.studentId || !data.studentClass) {
                throw new Error("Thiếu thông tin hồ sơ học sinh");
            }
        }

        if (role === "DRIVER") {
            if (!data.licenseNumber) {
                throw new Error("Thiếu thông tin giấy phép lái xe");
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        return userRepository.create({
            ...data,
            password: hashedPassword,
        });
    }

    async update(id: string, data: UpdateUserData) {
        if (!id) {
            throw new Error("Thiếu thông tin người dùng");
        }

        // Check user exists
        const existingUser = await userRepository.getById(id);
        if (!existingUser) {
            throw new Error("Không tìm thấy người dùng");
        }

        // Check email uniqueness if email changed
        if (data.email && data.email !== existingUser.email) {
            const emailUser = await userRepository.findByEmail(data.email);
            if (emailUser) {
                throw new Error("Email đã được sử dụng");
            }
        }

        const role = data.role || existingUser.role;

        // Validate role-specific fields
        if (role === "STUDENT") {
            const studentId = data.studentId || existingUser.studentProfile?.studentId;
            const studentClass = data.studentClass || existingUser.studentProfile?.studentClass;
            if (!studentId || !studentClass) {
                throw new Error("Thiếu thông tin hồ sơ học sinh");
            }
            data.studentId = studentId;
            data.studentClass = studentClass;
        }

        if (role === "DRIVER") {
            const licenseNumber = data.licenseNumber || existingUser.driverProfile?.licenseNumber;
            if (!licenseNumber) {
                throw new Error("Thiếu thông tin giấy phép lái xe");
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
            throw new Error("Thiếu thông tin người dùng");
        }
        return userRepository.delete(id);
    }
}

export const userService = new UserService();
