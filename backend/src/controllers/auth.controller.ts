import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

class AuthController {
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
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
        } catch (e) {
            const message = e instanceof Error ? e.message : "Đăng nhập thất bại";
            if (
                message === "Email hoặc mật khẩu không đúng" ||
                message === "Tài khoản chưa hoàn tất thiết lập mật khẩu"
            ) {
                return res.status(401).json({ message });
            }

            console.error("Có lỗi xảy ra khi đăng nhập:", e);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    async refresh(req: Request, res: Response) {
        try {
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

            res.status(200).json({ user: result.user });
        } catch (e) {
            const message = e instanceof Error ? e.message : "Không thể làm mới phiên";
            if (message === "Phiên đăng nhập không hợp lệ") {
                return res.status(401).json({ message });
            }

            console.error("Có lỗi xảy ra khi làm mới phiên:", e);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    async logout(req: Request, res: Response) {
        try {
            const refreshToken = req.cookies?.[authService.getRefreshCookieName()] || req.body?.refreshToken;
            await authService.logout(refreshToken);

            res.clearCookie(authService.getAccessCookieName(), authService.getCookieOptions(0));
            res.clearCookie(authService.getRefreshCookieName(), authService.getCookieOptions(0));

            res.status(200).json({ message: "Đăng xuất thành công" });
        } catch (e) {
            console.error("Có lỗi xảy ra khi đăng xuất:", e);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    async setupPassword(req: Request, res: Response) {
        try {
            const { token, password } = req.body;
            await authService.setupPassword(token, password);
            res.status(200).json({ message: "Thiết lập mật khẩu thành công" });
        } catch (e) {
            const message = e instanceof Error ? e.message : "Thiết lập mật khẩu thất bại";
            if (
                message === "Thiếu thông tin thiết lập mật khẩu" ||
                message === "Mật khẩu phải có ít nhất 8 ký tự" ||
                message === "Liên kết thiết lập mật khẩu không hợp lệ hoặc đã hết hạn"
            ) {
                return res.status(400).json({ message });
            }

            console.error("Có lỗi xảy ra khi thiết lập mật khẩu:", e);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    async issueInvite(req: AuthenticatedRequest, res: Response) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: "Thiếu email người dùng" });
            }

            const createdBy = req.user?.userId;
            if (!createdBy) {
                return res.status(401).json({ message: "Chưa xác thực người dùng" });
            }

            const invite = await authService.issueInviteByEmail(email, createdBy);
            res.status(200).json(invite);
        } catch (e) {
            const message = e instanceof Error ? e.message : "Không thể cấp lại lời mời";
            if (message === "Không tìm thấy người dùng") {
                return res.status(404).json({ message });
            }

            console.error("Có lỗi xảy ra khi cấp lời mời:", e);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}

export const authController = new AuthController();
