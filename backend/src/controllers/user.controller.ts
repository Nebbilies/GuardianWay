import { Request, Response } from "express";
import { GetAllUsersParams } from "../repositories/user.repository";
import { Role } from "@prisma/client";
import { userService } from "../services/user.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

class UserController {
    async getAll(req: Request, res: Response) {
        const {search, page, limit, sort, role, deleted} = req.query;
        try {
            const params: GetAllUsersParams = {};

            if (typeof search === "string") params.search = search;
            if (typeof page === "string") params.page = parseInt(page, 10);
            if (typeof limit === "string") params.limit = parseInt(limit, 10);
            if (typeof sort === "string") params.sort = sort;
            if (typeof role === "string") params.role = role as Role;
            if (typeof deleted === "string") params.deleted = deleted;

            const users = await userService.getAll(params);
            res.json(users);
        } catch (e) {
            console.error("Có lỗi xảy ra khi lấy danh sách người dùng:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            res.status(500).json({message: "Internal server error: " + errorMessage});
        }
    }

    async exportAll(req: Request, res: Response) {
        const {search, sort, role} = req.query;
        try {
            const params: GetAllUsersParams = {};

            if (typeof search === "string") params.search = search;
            if (typeof sort === "string") params.sort = sort;
            if (typeof role === "string") params.role = role as Role;

            const users = await userService.exportAll(params);
            res.json(users);
        } catch (e) {
            console.error("Có lỗi xảy ra khi xuất danh sách người dùng:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            res.status(500).json({ message: "Internal server error: " + errorMessage });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const user = await userService.getById(String(req.params.id));
            res.json(user);
        } catch (e) {
            if (e instanceof Error && e.message === "Không tìm thấy người dùng") {
                return res.status(404).json({ message: e.message });
            }
            console.error("Có lỗi xảy ra khi lấy thông tin người dùng:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            return res.status(500).json({ message: "Internal server error: " + errorMessage });
        }
    }

    async getParents(req: Request, res: Response) {
        try {
            const parents = await userService.getParents();
            res.json(parents);
        } catch (e) {
            console.error("Có lỗi xảy ra khi lấy danh sách phụ huynh:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            res.status(500).json({ message: "Internal server error: " + errorMessage });
        }
    }

    async create(req: AuthenticatedRequest, res: Response) {
        try {
            const createdBy = req.user?.userId;
            const user = await userService.create(req.body, createdBy);
            res.status(201).json(user);
        } catch (e) {
            if (
                e instanceof Error &&
                (e.message === "Thiếu thông tin người dùng" ||
                    e.message === "Email đã được sử dụng" ||
                    e.message === "Thiếu thông tin hồ sơ học sinh" ||
                    e.message === "Thiếu thông tin giấy phép lái xe" ||
                    e.message === "Không được thiết lập mật khẩu khi tạo người dùng" ||
                    e.message === "Thiếu thông tin người tạo")
            ) {
                return res.status(400).json({ message: e.message });
            }
            console.error("Có lỗi xảy ra khi tạo người dùng:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            return res.status(500).json({ message: "Internal server error: " + errorMessage });
        }
    }

    async edit(req: Request, res: Response) {
        try {
            const user = await userService.update(String(req.params.id), req.body);
            res.status(200).json(user);
        } catch (e) {
            if (
                e instanceof Error &&
                (e.message === "Thiếu thông tin người dùng" ||
                    e.message === "Không tìm thấy người dùng" ||
                    e.message === "Email đã được sử dụng" ||
                    e.message === "Thiếu thông tin hồ sơ học sinh" ||
                    e.message === "Thiếu thông tin giấy phép lái xe")
            ) {
                const status = e.message === "Không tìm thấy người dùng" ? 404 : 400;
                return res.status(status).json({ message: e.message });
            }
            console.error("Có lỗi xảy ra khi chỉnh sửa người dùng:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            return res.status(500).json({ message: "Internal server error: " + errorMessage });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            await userService.delete(String(req.params.id));
            res.status(200).json({ message: "Xóa người dùng thành công" });
        } catch (e) {
            if (e instanceof Error && e.message === "Thiếu thông tin người dùng") {
                return res.status(400).json({ message: e.message });
            }
            console.error("Có lỗi xảy ra khi xóa người dùng:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            return res.status(500).json({ message: "Internal server error: " + errorMessage });
        }
    }

    async restore(req: Request, res: Response) {
        try {
            await userService.restore(String(req.params.id));
            res.status(200).json({message: "Khôi phục người dùng thành công"});
        } catch (e) {
            if (e instanceof Error && e.message === "Thiếu thông tin người dùng") {
                return res.status(400).json({message: e.message});
            } else if (e instanceof Error && e.message === "Không tìm thấy người dùng") {
                return res.status(404).json({message: e.message});
            } else if (e instanceof Error && e.message === "Người dùng chưa bị xóa") {
                return res.status(400).json({message: e.message});
            } else {
                console.error("Có lỗi xảy ra khi khôi phục người dùng:", e);
                const errorMessage = e instanceof Error ? e.message : e;
                return res.status(500).json({message: "Internal server error: " + errorMessage});
            }
        }
    }
}

export const userController = new UserController();
