import type { Request, Response } from "express";
import { authenticatedActor } from "../../../middlewares/auth.middleware";
import { requestMetadata } from "../../../http/request";
import { idParams } from "../../../http/normalization";
import { tripQuery } from "./trip.contracts";
import { tripService } from "./trip.service";
export async function list(req: Request, res: Response) { res.json(await tripService.list(authenticatedActor(req), tripQuery.parse(req.query))); }
export async function get(req: Request, res: Response) { res.json(await tripService.get(authenticatedActor(req), idParams.parse(req.params).id)); }
export async function create(req: Request, res: Response) { res.status(201).json(await tripService.create(authenticatedActor(req), req.body, requestMetadata(req))); }
export async function update(req: Request, res: Response) { res.json(await tripService.update(authenticatedActor(req), idParams.parse(req.params).id, req.body, requestMetadata(req))); }
export async function cancel(req: Request, res: Response) { res.json(await tripService.cancel(authenticatedActor(req), idParams.parse(req.params).id, req.body, requestMetadata(req))); }
