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
import {loginRateLimiters, refreshRateLimiter, setupPasswordRateLimiter} from "../middlewares/rate-limit.middleware";

const router = Router();

router.post("/login", validate({body: loginBodySchema}), ...loginRateLimiters, asyncHandler(authController.login));
router.post("/refresh", ...refreshRateLimiter, asyncHandler(authController.refresh));
router.post("/logout", asyncHandler(authController.logout));
router.post(
    "/setup-password",
    validate({body: setupPasswordBodySchema}),
    ...setupPasswordRateLimiter,
    asyncHandler(authController.setupPassword),
);
router.post(
    "/invites",
    authenticate,
    authorize(["SUPER_ADMIN", "ADMIN"]),
    validate({body: issueInviteBodySchema}),
    asyncHandler(authController.issueInvite),
);

export default router;
