import {Router} from "express";
import {userController} from "../controllers/user.controller";

const router = Router();

router.get("/parents", userController.getParents);
router.get("/export", userController.exportAll);
router.get("/", userController.getAll);
router.get("/:id", userController.getById);
router.post("/", userController.create);
router.put("/:id", userController.edit);
router.delete("/:id", userController.delete);

export default router;
