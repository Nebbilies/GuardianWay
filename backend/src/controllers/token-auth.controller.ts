import { Request, Response } from "express";
import { AuthenticationError } from "../errors/http-errors";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { authService } from "../services/auth.service";

const requestContext = (req: Request) => ({
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
    traceId: req.traceId,
});

const sendSession = (res: Response, result: Awaited<ReturnType<typeof authService.login>>) => {
    res.set({ "Cache-Control": "no-store", Pragma: "no-cache" }).status(200).json({
        user: result.user,
        session: {
            tokenType: "Bearer",
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            accessTokenExpiresIn: result.accessTokenExpiresIn,
            refreshTokenExpiresIn: result.refreshTokenExpiresIn,
        },
    });
};

class TokenAuthController {
    async login(req: Request, res: Response) {
        const { email, password } = req.body;
        const result = await authService.login(email, password, requestContext(req));
        sendSession(res, result);
    }

    async refresh(req: Request, res: Response) {
        const result = await authService.refresh(req.body.refreshToken, requestContext(req));
        sendSession(res, result);
    }

    async logout(req: Request, res: Response) {
        await authService.logout(req.body?.refreshToken);
        res.status(200).json({ message: "Đăng xuất thành công" });
    }

    async me(req: AuthenticatedRequest, res: Response) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new AuthenticationError("Chưa xác thực người dùng");
        }

        const user = await authService.getCurrentUser(userId);
        res.set({ "Cache-Control": "no-store", Pragma: "no-cache" }).status(200).json({ user });
    }
}

export const tokenAuthController = new TokenAuthController();
