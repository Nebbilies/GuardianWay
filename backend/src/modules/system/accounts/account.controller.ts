import { z } from "zod";
import type { Request, Response } from "express";
import { authenticatedActor } from "../../../middlewares/auth.middleware";
import { AuthorizationError } from "../../../errors/http-errors";
import { requestMetadata } from "../../../http/request";
import { idParams } from "../../../http/normalization";
import { accountQuery } from "./account.contracts";
import { accountService } from "./account.service";

function scope(req: Request) {
    const actor = authenticatedActor(req);
    const schoolId = actor.kind === "school" ? actor.schoolId : z.uuid().parse(req.params.schoolId);
    if (actor.kind === "school" && req.params.schoolId && req.params.schoolId !== schoolId) throw new AuthorizationError();
    return { actor, schoolId };
}
export async function listAccounts(req: Request, res: Response) {
    const { actor, schoolId } = scope(req);
    res.json(await accountService.list(actor, schoolId, accountQuery.parse(req.query), req.path === "/export"));
}
export async function getAccount(req: Request, res: Response) {
    const { actor, schoolId } = scope(req);
    res.json(await accountService.get(actor, schoolId, idParams.parse(req.params).id));
}
export async function createAccount(req: Request, res: Response) {
    const { actor, schoolId } = scope(req);
    res.status(201).json(await accountService.create(actor, schoolId, req.body, requestMetadata(req)));
}
export function changeAccount(operation: "update" | "delete" | "restore") {
    return async (req: Request, res: Response) => {
        const { actor, schoolId } = scope(req);
        res.json(await accountService.change(actor, schoolId, idParams.parse(req.params).id, req.body, operation, requestMetadata(req)));
    };
}
export async function resendInvite(req: Request, res: Response) {
    const { actor, schoolId } = scope(req);
    res.json(await accountService.resend(actor, schoolId, idParams.parse(req.params).id, requestMetadata(req)));
}
