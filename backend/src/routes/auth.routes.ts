import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import {validate} from "../middlewares/validate.middleware";
import {
    issueInviteBodySchema,
    loginBodySchema,
    setupPasswordBodySchema,
} from "../validation/schemas/auth.schemas";
import {asyncHandler} from "../utils/asyncHandler";

const router = Router();

router.post("/login", validate({body: loginBodySchema}), asyncHandler(authController.login));
router.post("/refresh", asyncHandler(authController.refresh));
router.post("/logout", asyncHandler(authController.logout));
router.post(
    "/setup-password",
    validate({body: setupPasswordBodySchema}),
    asyncHandler(authController.setupPassword),
);
router.post(
    "/invites",
    authenticate,
    authorize(["ADMIN", "STAFF"]),
    validate({body: issueInviteBodySchema}),
    asyncHandler(authController.issueInvite),
);

export default router;
