import { NextFunction, Response } from "express";
import { Role } from "@prisma/client";
import { AuthenticatedRequest } from "./auth.middleware";

export function authorize(allowedRoles: Role[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: "Chưa xác thực người dùng" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Bạn không có quyền truy cập" });
        }

        return next();
    };
}
