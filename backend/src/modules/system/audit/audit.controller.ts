import type { Request, Response } from "express";
import { authenticatedActor } from "../../../middlewares/auth.middleware";
import { auditQuery } from "./audit.contracts";
import { listAuditEntries } from "./audit.service";

export async function listAudit(req: Request, res: Response) {
    const actor = authenticatedActor(req);
    res.json(await listAuditEntries(actor, auditQuery.parse(req.query)));
}
