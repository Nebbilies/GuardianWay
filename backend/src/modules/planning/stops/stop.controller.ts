import type { Request, Response } from "express";
import { authenticatedActor } from "../../../middlewares/auth.middleware";
import { requestMetadata } from "../../../http/request";
import { idParams } from "../../../http/normalization";
import { stopQuery } from "./stop.contracts";
import { stopService } from "./stop.service";
export async function list(req: Request, res: Response) { res.json(await stopService.list(authenticatedActor(req), stopQuery.parse(req.query), req.path === "/export")); }
export async function get(req: Request, res: Response) { res.json(await stopService.get(authenticatedActor(req), idParams.parse(req.params).id)); }
export async function create(req: Request, res: Response) { res.status(201).json(await stopService.create(authenticatedActor(req), req.body, requestMetadata(req))); }
export function change(operation: "update" | "delete" | "restore") { return async (req: Request, res: Response) => { res.json(await stopService.change(authenticatedActor(req), idParams.parse(req.params).id, req.body, operation, requestMetadata(req))); }; }
