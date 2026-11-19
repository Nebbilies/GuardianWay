import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { listAudit } from "./audit.controller";
export const auditRouter = Router().get("/", asyncHandler(listAudit));
