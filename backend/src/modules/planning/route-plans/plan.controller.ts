import type { Request, Response } from "express";
import { authenticatedActor } from "../../../middlewares/auth.middleware";
import { requestMetadata } from "../../../http/request";
import { idParams } from "../../../http/normalization";
import { planApprovalBody, planQuery } from "./plan.contracts";
import { planService } from "./plan.service";
export async function list(req: Request, res: Response) { res.json(await planService.list(authenticatedActor(req), planQuery.parse(req.query))); }
export async function get(req: Request, res: Response) { res.json(await planService.get(authenticatedActor(req), idParams.parse(req.params).id)); }
export async function create(req: Request, res: Response) { res.status(201).json(await planService.create(authenticatedActor(req), req.body, requestMetadata(req))); }
export async function revise(req: Request, res: Response) { res.status(201).json(await planService.create(authenticatedActor(req), req.body, requestMetadata(req), idParams.parse(req.params).id)); }
export async function update(req: Request, res: Response) { res.json(await planService.update(authenticatedActor(req), idParams.parse(req.params).id, req.body, requestMetadata(req))); }
export async function approve(req: Request, res: Response) { res.json(await planService.approve(authenticatedActor(req), idParams.parse(req.params).id, planApprovalBody.parse(req.body).approvalToken, requestMetadata(req))); }
