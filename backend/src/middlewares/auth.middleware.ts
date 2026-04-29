import { NextFunction, Request, Response } from "express";
import { authService } from "../services/auth.service";
import { AuthenticatedRequestUser } from "../types/auth";

export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedRequestUser;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const bearerToken = req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.slice(7)
            : undefined;

        const cookieToken = req.cookies?.[authService.getAccessCookieName()];
        const token = bearerToken || cookieToken;

        if (!token) {
            return res.status(401).json({ message: "Chưa xác thực người dùng" });
        }

        const payload = authService.verifyAccessToken(token);
        req.user = {
            userId: payload.userId,
            role: payload.role,
        };

        return next();
    } catch {
        return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ" });
    }
}
