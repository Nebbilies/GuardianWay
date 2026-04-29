import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";

const router = Router();

router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/setup-password", authController.setupPassword);
router.post("/invites", authenticate, authorize(["ADMIN", "STAFF"]), authController.issueInvite);

export default router;
