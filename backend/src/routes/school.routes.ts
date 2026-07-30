import { Router } from "express";
import { schoolController } from "../controllers/school.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate.middleware";
import {
    schoolIdParamSchema,
    getAllSchoolsQuerySchema,
    createSchoolBodySchema,
    updateSchoolBodySchema,
    onboardAdminBodySchema,
} from "../validation/schemas/school.schemas";

const router = Router();

router.get("/", validate({ query: getAllSchoolsQuerySchema }), asyncHandler(schoolController.getAll));
router.post("/", validate({ body: createSchoolBodySchema }), asyncHandler(schoolController.create));
router.put(
    "/:id",
    validate({ params: schoolIdParamSchema, body: updateSchoolBodySchema }),
    asyncHandler(schoolController.update),
);
router.delete("/:id", validate({ params: schoolIdParamSchema }), asyncHandler(schoolController.delete));
router.patch("/:id/restore", validate({ params: schoolIdParamSchema }), asyncHandler(schoolController.restore));
router.get("/:id/admins", validate({ params: schoolIdParamSchema }), asyncHandler(schoolController.getAdmins));
router.post(
    "/:id/admins",
    validate({ params: schoolIdParamSchema, body: onboardAdminBodySchema }),
    asyncHandler(schoolController.onboardAdmin),
);

export default router;
