import type { Request, Response } from "express";
import { authenticatedActor } from "../../../middlewares/auth.middleware";
import { requestMetadata } from "../../../http/request";
import { idParams } from "../../../http/normalization";
import { vehicleQuery } from "./vehicle.contracts";
import { vehicleService } from "./vehicle.service";
export async function list(req: Request, res: Response) { res.json(await vehicleService.list(authenticatedActor(req), vehicleQuery.parse(req.query), req.route.path === "/export")); }
export async function get(req: Request, res: Response) { res.json(await vehicleService.get(authenticatedActor(req), idParams.parse(req.params).id)); }
export async function create(req: Request, res: Response) { res.status(201).json(await vehicleService.create(authenticatedActor(req), req.body, requestMetadata(req))); }
export function change(operation: "update" | "delete" | "restore") { return async (req: Request, res: Response) => { res.json(await vehicleService.change(authenticatedActor(req), idParams.parse(req.params).id, req.body, operation, requestMetadata(req))); }; }
