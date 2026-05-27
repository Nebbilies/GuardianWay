import {Router} from "express";
import {userController} from "../controllers/user.controller";
import {asyncHandler} from "../utils/asyncHandler";

const router = Router();

router.get("/parents", asyncHandler(userController.getParents));
router.get("/export", asyncHandler(userController.exportAll));
router.get("/", asyncHandler(userController.getAll));
router.get("/:id", asyncHandler(userController.getById));
router.post("/", asyncHandler(userController.create));
router.put("/:id", asyncHandler(userController.edit));
router.delete("/:id", asyncHandler(userController.delete));
router.patch("/:id/restore", asyncHandler(userController.restore));

export default router;
