import { Request, Response } from "express";
import { auditService } from "../services/audit.service";
import { GetAuditLogsParams } from "../repositories/audit.repository";

class AuditController {
    async getAll(req: Request, res: Response) {
        const { page, limit, action, actorId, targetType, targetId, schoolId, from, to } = req.query;
        const params: GetAuditLogsParams = {};
        if (typeof page === "string") params.page = parseInt(page, 10);
        if (typeof limit === "string") params.limit = parseInt(limit, 10);
        if (typeof action === "string") params.action = action;
        if (typeof actorId === "string") params.actorId = actorId;
        if (typeof targetType === "string") params.targetType = targetType;
        if (typeof targetId === "string") params.targetId = targetId;
        if (typeof schoolId === "string") params.schoolId = schoolId;
        if (typeof from === "string") params.from = from;
        if (typeof to === "string") params.to = to;

        res.json(await auditService.getAll(params));
    }
}

export const auditController = new AuditController();
