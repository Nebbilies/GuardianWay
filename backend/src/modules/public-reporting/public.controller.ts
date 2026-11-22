import type { Request, Response } from "express";
import { publicService } from "./public.service";
export async function landingProof(_req: Request, res: Response) { res.json(await publicService.landingProof()); }
