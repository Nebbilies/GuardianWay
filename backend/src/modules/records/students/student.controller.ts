import { z } from "zod";
import type { Request, Response } from "express";
import { authenticatedActor } from "../../../middlewares/auth.middleware";
import { requestMetadata } from "../../../http/request";
import { idParams, reasonBody } from "../../../http/normalization";
import { studentQuery } from "./student.contracts";
import { studentService } from "./student.service";
import { guardianService } from "./guardian-links";
import { cardService } from "./cards";
export async function listStudents(req: Request, res: Response) { res.json(await studentService.list(authenticatedActor(req), studentQuery.parse(req.query), req.path === "/export")); }
export async function getStudent(req: Request, res: Response) { res.json(await studentService.get(authenticatedActor(req), idParams.parse(req.params).id)); }
export async function createStudent(req: Request, res: Response) { res.status(201).json(await studentService.create(authenticatedActor(req), req.body, requestMetadata(req))); }
export function changeStudent(operation: "update" | "delete" | "restore") { return async (req: Request, res: Response) => { res.json(await studentService.change(authenticatedActor(req), idParams.parse(req.params).id, req.body, operation, requestMetadata(req))); }; }
export async function createGuardian(req: Request, res: Response) { res.status(201).json(await guardianService.create(authenticatedActor(req), idParams.parse(req.params).id, req.body, requestMetadata(req))); }
export async function closeGuardian(req: Request, res: Response) { res.json(await guardianService.close(authenticatedActor(req), idParams.parse(req.params).id, z.uuid().parse(req.params.linkId), reasonBody.parse(req.body).reason, requestMetadata(req))); }
export async function assignCard(req: Request, res: Response) { res.status(201).json(await cardService.assign(authenticatedActor(req), idParams.parse(req.params).id, req.body, requestMetadata(req))); }
export async function revokeCard(req: Request, res: Response) { res.json(await cardService.revoke(authenticatedActor(req), idParams.parse(req.params).id, z.uuid().parse(req.params.cardId), reasonBody.parse(req.body).reason, requestMetadata(req))); }
