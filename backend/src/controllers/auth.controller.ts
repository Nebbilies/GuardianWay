import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {AuthenticationError, ValidationError} from "../errors/http-errors";

class AuthController {
    async login(req: Request, res: Response) {
        const {email, password} = req.body;
        const result = await authService.login(email, password, {
            userAgent: req.headers["user-agent"],
            ipAddress: req.ip,
        });

        res.cookie(
            authService.getAccessCookieName(),
            result.accessToken,
            authService.getCookieOptions(15 * 60 * 1000),
        );
        res.cookie(
            authService.getRefreshCookieName(),
            result.refreshToken,
            authService.getCookieOptions(7 * 24 * 60 * 60 * 1000),
        );

        res.status(200).json({
            user: result.user,
        });
    }

    async refresh(req: Request, res: Response) {
        const refreshToken = req.cookies?.[authService.getRefreshCookieName()] || req.body?.refreshToken;
        const result = await authService.refresh(refreshToken, {
            userAgent: req.headers["user-agent"],
            ipAddress: req.ip,
        });

        res.cookie(
            authService.getAccessCookieName(),
            result.accessToken,
            authService.getCookieOptions(15 * 60 * 1000),
        );
        res.cookie(
            authService.getRefreshCookieName(),
            result.refreshToken,
            authService.getCookieOptions(7 * 24 * 60 * 60 * 1000),
        );

        res.status(200).json({user: result.user});
    }

    async logout(req: Request, res: Response) {
        const refreshToken = req.cookies?.[authService.getRefreshCookieName()] || req.body?.refreshToken;
        await authService.logout(refreshToken);

        res.clearCookie(authService.getAccessCookieName(), authService.getCookieOptions(0));
        res.clearCookie(authService.getRefreshCookieName(), authService.getCookieOptions(0));

        res.status(200).json({message: "Đăng xuất thành công"});
    }

    async setupPassword(req: Request, res: Response) {
        const {token, password} = req.body;
        await authService.setupPassword(token, password);
        res.status(200).json({message: "Thiết lập mật khẩu thành công"});
    }

    // TODO: send email to user with invite link
    async issueInvite(req: AuthenticatedRequest, res: Response) {
        const {email} = req.body;
        if (!email) {
            throw new ValidationError("Thiếu email người dùng");
        }

        const createdBy = req.user?.userId;
        if (!createdBy) {
            throw new AuthenticationError("Chưa xác thực người dùng");
        }

        const invite = await authService.issueInviteByEmail(email, createdBy);
        res.status(200).json(invite);
    }
}

export const authController = new AuthController();
