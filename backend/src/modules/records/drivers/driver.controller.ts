import type { Request, Response } from "express";
import { authenticatedActor } from "../../../middlewares/auth.middleware";
import { requestMetadata } from "../../../http/request";
import { idParams } from "../../../http/normalization";
import { driverQuery } from "./driver.contracts";
import { driverService } from "./driver.service";
export async function list(req: Request, res: Response) { res.json(await driverService.list(authenticatedActor(req), driverQuery.parse(req.query), req.route.path === "/export")); }
export async function get(req: Request, res: Response) { res.json(await driverService.get(authenticatedActor(req), idParams.parse(req.params).id)); }
export async function create(req: Request, res: Response) { res.status(201).json(await driverService.create(authenticatedActor(req), req.body, requestMetadata(req))); }
export async function onboard(req: Request, res: Response) { res.status(201).json(await driverService.onboard(authenticatedActor(req), req.body, requestMetadata(req))); }
export function change(operation: "update" | "delete" | "restore") { return async (req: Request, res: Response) => { res.json(await driverService.change(authenticatedActor(req), idParams.parse(req.params).id, req.body, operation, requestMetadata(req))); }; }
