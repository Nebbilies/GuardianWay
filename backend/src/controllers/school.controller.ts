import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { schoolService } from "../services/school.service";
import { GetAllSchoolsParams } from "../repositories/school.repository";

class SchoolController {
    async getAll(req: Request, res: Response) {
        const { search, deleted, page, limit, sort } = req.query;
        const params: GetAllSchoolsParams = {};
        if (typeof search === "string") params.search = search;
        if (deleted === "exclude" || deleted === "only") params.deleted = deleted;
        if (typeof page === "string") params.page = parseInt(page, 10);
        if (typeof limit === "string") params.limit = parseInt(limit, 10);
        if (typeof sort === "string") params.sort = sort;

        res.json(await schoolService.getAll(params));
    }

    async create(req: Request, res: Response) {
        res.status(201).json(await schoolService.create(req.body));
    }

    async update(req: Request, res: Response) {
        res.status(200).json(await schoolService.update(String(req.params.id), req.body));
    }

    async delete(req: Request, res: Response) {
        res.status(200).json(await schoolService.delete(String(req.params.id)));
    }

    async restore(req: Request, res: Response) {
        res.status(200).json(await schoolService.restore(String(req.params.id)));
    }

    async getAdmins(req: Request, res: Response) {
        res.status(200).json(await schoolService.getAdmins(String(req.params.id)));
    }

    async onboardAdmin(req: Request, res: Response) {
        const authReq = req as AuthenticatedRequest;
        const { user, inviteLink } = await schoolService.onboardAdmin(
            String(req.params.id),
            req.body,
            authReq.user!.userId,
        );
        res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                schoolId: user.schoolId,
            },
            inviteLink,
        });
    }
}

export const schoolController = new SchoolController();
