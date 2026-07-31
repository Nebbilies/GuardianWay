import { Router } from "express";
import { auditController } from "../controllers/audit.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate.middleware";
import { getAuditLogsQuerySchema } from "../validation/schemas/audit.schemas";

const router = Router();

router.get("/", validate({ query: getAuditLogsQuerySchema }), asyncHandler(auditController.getAll));

export default router;
