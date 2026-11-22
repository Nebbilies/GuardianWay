import { Router } from "express";
import { validate } from "../../../middlewares/validate.middleware";
import { authenticate } from "../../../middlewares/auth.middleware";
import {
    loginRateLimiters,
    refreshRateLimiter,
    setupPasswordRateLimiter,
} from "../../../middlewares/rate-limit.middleware";
import { loginBody } from "./auth.contracts";
import {
    sessionHandler,
    logoutHandler,
    currentUser,
    setupPassword,
    resendInvitation,
} from "./auth.controller";

export const authRouter = Router();
for (const kind of ["web", "mobile"] as const) {
    const prefix = kind === "mobile" ? "/token" : "";
    authRouter.post(
        prefix + "/login",
        validate({ body: loginBody }),
        ...loginRateLimiters,
        sessionHandler(kind, "login"),
    );
    authRouter.post(
        prefix + "/refresh",
        ...refreshRateLimiter,
        sessionHandler(kind, "refresh"),
    );
    authRouter.post(prefix + "/logout", logoutHandler(kind));
}
authRouter.get("/me", authenticate, currentUser);
authRouter.post("/setup-password", ...setupPasswordRateLimiter, setupPassword);
authRouter.post("/invites", authenticate, resendInvitation);
