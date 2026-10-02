import { NextFunction, Request, Response, Router } from "express";
import { authController } from "../controllers/auth.controller";
import { tokenAuthController } from "../controllers/token-auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import {validate} from "../middlewares/validate.middleware";
import {
    issueInviteBodySchema,
    loginBodySchema,
    refreshTokenBodySchema,
    setupPasswordBodySchema,
    tokenLogoutBodySchema,
} from "../validation/schemas/auth.schemas";
import {asyncHandler} from "../utils/asyncHandler";
import {loginRateLimiters, refreshRateLimiter, setupPasswordRateLimiter} from "../middlewares/rate-limit.middleware";

const router = Router();

const preventTokenCaching = (_req: Request, res: Response, next: NextFunction) => {
    res.set({ "Cache-Control": "no-store", Pragma: "no-cache" });
    next();
};

router.post("/login", validate({body: loginBodySchema}), ...loginRateLimiters, asyncHandler(authController.login));
router.post("/refresh", ...refreshRateLimiter, asyncHandler(authController.refresh));
router.post("/logout", asyncHandler(authController.logout));
router.post(
    "/token/login",
    preventTokenCaching,
    validate({ body: loginBodySchema }),
    ...loginRateLimiters,
    asyncHandler(tokenAuthController.login),
);
router.post(
    "/token/refresh",
    preventTokenCaching,
    validate({ body: refreshTokenBodySchema }),
    ...refreshRateLimiter,
    asyncHandler(tokenAuthController.refresh),
);
router.post(
    "/token/logout",
    preventTokenCaching,
    validate({ body: tokenLogoutBodySchema }),
    asyncHandler(tokenAuthController.logout),
);
router.get("/me", preventTokenCaching, authenticate, asyncHandler(tokenAuthController.me));
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
