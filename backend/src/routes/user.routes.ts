import {Router} from "express";
import {userController} from "../controllers/user.controller";
import {asyncHandler} from "../utils/asyncHandler";
import {validate} from "../middlewares/validate.middleware";
import {
    createUserBodySchema,
    getAllUsersQuerySchema,
    updateUserBodySchema,
    userIdParamSchema,
} from "../validation/schemas/user.schemas";

const router = Router();

router.get("/parents", asyncHandler(userController.getParents));
router.get("/export", asyncHandler(userController.exportAll));
router.get("/", validate({query: getAllUsersQuerySchema}), asyncHandler(userController.getAll));
router.get("/:id", validate({params: userIdParamSchema}), asyncHandler(userController.getById));
router.post("/", validate({body: createUserBodySchema}), asyncHandler(userController.create));
router.put(
    "/:id",
    validate({params: userIdParamSchema, body: updateUserBodySchema}),
    asyncHandler(userController.edit),
);
router.delete("/:id", validate({params: userIdParamSchema}), asyncHandler(userController.delete));
router.patch("/:id/restore", validate({params: userIdParamSchema}), asyncHandler(userController.restore));

export default router;
