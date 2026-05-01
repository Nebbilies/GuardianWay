import {Request, Response} from "express";
import {GetAllUsersParams} from "../repositories/user.repository";
import {Role} from "@prisma/client";
import {userService} from "../services/user.service";
import {AuthenticatedRequest} from "../middlewares/auth.middleware";

class UserController {
    async getAll(req: Request, res: Response) {
        const {search, page, limit, sort, role, deleted} = req.query;
        const params: GetAllUsersParams = {};

        if (typeof search === "string") params.search = search;
        if (typeof page === "string") params.page = parseInt(page, 10);
        if (typeof limit === "string") params.limit = parseInt(limit, 10);
        if (typeof sort === "string") params.sort = sort;
        if (typeof role === "string") params.role = role as Role;
        if (typeof deleted === "string") params.deleted = deleted;

        const users = await userService.getAll(params);
        res.json(users);
    }

    async exportAll(req: Request, res: Response) {
        const {search, sort, role} = req.query;
        const params: GetAllUsersParams = {};

        if (typeof search === "string") params.search = search;
        if (typeof sort === "string") params.sort = sort;
        if (typeof role === "string") params.role = role as Role;

        const users = await userService.exportAll(params);
        res.json(users);
    }

    async getById(req: Request, res: Response) {
        const user = await userService.getById(String(req.params.id));
        res.json(user);
    }

    async getParents(req: Request, res: Response) {
        const parents = await userService.getParents();
        res.json(parents);
    }

    async create(req: AuthenticatedRequest, res: Response) {
        const createdBy = req.user?.userId;
        const user = await userService.create(req.body, createdBy);
        res.status(201).json(user);
    }

    async edit(req: Request, res: Response) {
        const user = await userService.update(String(req.params.id), req.body);
        res.status(200).json(user);
    }

    async delete(req: Request, res: Response) {
        await userService.delete(String(req.params.id));
        res.status(200).json({message: "Xóa người dùng thành công"});
    }

    async restore(req: Request, res: Response) {
        await userService.restore(String(req.params.id));
        res.status(200).json({message: "Khôi phục người dùng thành công"});
    }
}

export const userController = new UserController();
