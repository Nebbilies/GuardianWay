import {Router} from "express";
import {studentController} from "../controllers/student.controller";
import {asyncHandler} from "../utils/asyncHandler";
import {validate} from "../middlewares/validate.middleware";
import {
    assignCardBodySchema,
    createStudentBodySchema,
    getAllStudentsQuerySchema,
    studentIdParamSchema,
    updateStudentBodySchema,
} from "../validation/schemas/student.schemas";

const router = Router();

router.get("/", validate({query: getAllStudentsQuerySchema}), asyncHandler(studentController.getAll));
router.get("/:id", validate({params: studentIdParamSchema}), asyncHandler(studentController.getById));
router.post("/", validate({body: createStudentBodySchema}), asyncHandler(studentController.create));
router.put(
    "/:id",
    validate({params: studentIdParamSchema, body: updateStudentBodySchema}),
    asyncHandler(studentController.edit),
);
router.delete("/:id", validate({params: studentIdParamSchema}), asyncHandler(studentController.delete));
router.patch("/:id/restore", validate({params: studentIdParamSchema}), asyncHandler(studentController.restore));
router.put(
    "/:id/card",
    validate({params: studentIdParamSchema, body: assignCardBodySchema}),
    asyncHandler(studentController.assignCard),
);
router.delete("/:id/card", validate({params: studentIdParamSchema}), asyncHandler(studentController.removeCard));

export default router;
