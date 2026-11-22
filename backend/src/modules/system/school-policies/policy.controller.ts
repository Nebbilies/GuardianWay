import type { Request, Response } from "express";
import { authenticatedActor } from "../../../middlewares/auth.middleware";
import { requestMetadata } from "../../../http/request";
import { policyService } from "./policy.service";
export async function list(req: Request, res: Response) { res.json(await policyService.list(authenticatedActor(req))); }
export async function create(req: Request, res: Response) { res.status(201).json(await policyService.create(authenticatedActor(req), req.body, requestMetadata(req))); }
