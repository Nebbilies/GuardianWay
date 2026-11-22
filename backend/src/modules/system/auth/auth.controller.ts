import type { Request, Response } from "express";
import {
    authService,
    ACCESS_COOKIE_NAME,
    REFRESH_COOKIE_NAME,
} from "./auth.service";
import { authenticatedActor } from "../../../middlewares/auth.middleware";
import { requestMetadata } from "../../../http/request";
import { AuthenticationError } from "../../../errors/http-errors";
import { accountService, activationBody, invitationBody } from "../accounts";
import {
    loginBody,
    logoutBody,
    refreshBody,
    sessionResponseSchema,
    webResponseSchema,
} from "./auth.contracts";

function noStore(res: Response) {
    res.set({ "Cache-Control": "no-store", Pragma: "no-cache" });
}
function cookieOptions(maxAgeMs: number) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: maxAgeMs,
    };
}
export function sessionHandler(
    kind: "web" | "mobile",
    operation: "login" | "refresh",
) {
    return async (req: Request, res: Response) => {
        noStore(res);
        const metadata = requestMetadata(req);
        const result =
            operation === "login"
                ? await (async () => {
                      const data = loginBody.parse(req.body);
                      return authService.login(
                          data.email,
                          data.password,
                          metadata,
                      );
                  })()
                : await (async () => {
                      const token =
                          kind === "mobile"
                              ? refreshBody.parse(req.body).refreshToken
                              : (req.cookies?.[REFRESH_COOKIE_NAME] ??
                                req.body?.refreshToken);
                      if (typeof token !== "string" || !token) {
                          throw new AuthenticationError(
                              "Invalid authentication session",
                          );
                      }
                      return authService.refresh(token, metadata);
                  })();
        if (kind === "mobile") {
            return res.json(
                sessionResponseSchema.parse({
                    user: result.user,
                    session: {
                        tokenType: "Bearer",
                        accessToken: result.accessToken,
                        refreshToken: result.refreshToken,
                        accessTokenExpiresIn: result.accessTokenExpiresIn,
                        refreshTokenExpiresIn: result.refreshTokenExpiresIn,
                    },
                }),
            );
        }
        res.cookie(
            ACCESS_COOKIE_NAME,
            result.accessToken,
            cookieOptions(result.accessTokenExpiresIn * 1000),
        );
        res.cookie(
            REFRESH_COOKIE_NAME,
            result.refreshToken,
            cookieOptions(result.refreshTokenExpiresIn * 1000),
        );
        return res.json(webResponseSchema.parse({ user: result.user }));
    };
}
export function logoutHandler(kind: "web" | "mobile") {
    return async (req: Request, res: Response) => {
        noStore(res);
        const token =
            kind === "mobile"
                ? logoutBody.parse(req.body)?.refreshToken
                : (req.cookies?.[REFRESH_COOKIE_NAME] ??
                  req.body?.refreshToken);
        await authService.logout(typeof token === "string" ? token : undefined);
        if (kind === "web") {
            res.clearCookie(ACCESS_COOKIE_NAME, cookieOptions(0));
            res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions(0));
        }
        res.json({ message: "Đăng xuất thành công" });
    };
}
export async function currentUser(req: Request, res: Response) {
    noStore(res);
    res.json({
        user: await authService.getCurrentUser(authenticatedActor(req)),
    });
}
export async function setupPassword(req: Request, res: Response) {
    const { token, password } = activationBody.parse(req.body);
    await accountService.accept(token, password, requestMetadata(req));
    res.json({ message: "Thiết lập mật khẩu thành công" });
}
export async function resendInvitation(req: Request, res: Response) {
    const { email } = invitationBody.parse(req.body);
    res.json(
        await accountService.resendByEmail(
            authenticatedActor(req),
            email,
            requestMetadata(req),
        ),
    );
}
