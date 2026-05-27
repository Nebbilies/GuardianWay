import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {Role} from "@prisma/client";
import {authRepository} from "../repositories/auth.repository";
import {AuthTokenPayload} from "../types/auth";
import {AuthenticationError, InternalError, NotFoundError, ValidationError} from "../errors/http-errors";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const INVITE_TOKEN_TTL_SECONDS = 3 * 24 * 60 * 60;
const PASSWORD_SALT_ROUNDS = 10;

const ACCESS_COOKIE_NAME = "gw_access_token";
const REFRESH_COOKIE_NAME = "gw_refresh_token";

export interface LoginResult {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: Role;
    };
}

export interface IssueInviteResult {
    inviteToken: string;
    inviteLink: string;
    expiresAt: Date;
}

interface RequestContext {
    userAgent?: string;
    ipAddress?: string;
}

class AuthService {
    private getAccessSecret() {
        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret) {
            throw new InternalError("Missing JWT access secret");
        }
        return secret;
    }

    private getRefreshSecret() {
        const secret = process.env.JWT_REFRESH_SECRET;
        if (!secret) {
            throw new InternalError("Missing JWT refresh secret");
        }
        return secret;
    }

    private getWebBaseUrl() {
        const baseUrl = process.env.WEB_BASE_URL;
        if (!baseUrl) {
            throw new InternalError("Missing WEB_BASE_URL");
        }
        return baseUrl.replace(/\/$/, "");
    }

    private hashToken(token: string) {
        return crypto.createHash("sha256").update(token).digest("hex");
    }

    private createAccessToken(payload: AuthTokenPayload) {
        return jwt.sign(payload, this.getAccessSecret(), {
            expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        });
    }

    private createRefreshToken(payload: AuthTokenPayload) {
        return jwt.sign(payload, this.getRefreshSecret(), {
            expiresIn: REFRESH_TOKEN_TTL_SECONDS,
        });
    }

    // must verify because need to check expiration and signature
    verifyAccessToken(token: string) {
        return jwt.verify(token, this.getAccessSecret()) as AuthTokenPayload;
    }

    private verifyRefreshToken(token: string) {
        return jwt.verify(token, this.getRefreshSecret()) as AuthTokenPayload;
    }

    getCookieOptions(maxAgeMs: number) {
        const isProduction = process.env.NODE_ENV === "production";
        return {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax" as const,
            path: "/",
            maxAge: maxAgeMs,
        };
    }

    getAccessCookieName() {
        return ACCESS_COOKIE_NAME;
    }

    getRefreshCookieName() {
        return REFRESH_COOKIE_NAME;
    }

    async issueInvite(userId: string, createdBy: string): Promise<IssueInviteResult> {
        await authRepository.invalidateActiveInviteTokensForUser(userId);

        const inviteToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = this.hashToken(inviteToken);
        const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_SECONDS * 1000);

        await authRepository.createInviteToken({
            userId,
            createdBy,
            tokenHash,
            expiresAt,
        });

        const inviteLink = `${this.getWebBaseUrl()}/setup-password?token=${inviteToken}`;

        return {
            inviteToken,
            inviteLink,
            expiresAt,
        };
    }

    async setupPassword(token: string, newPassword: string) {
        const tokenHash = this.hashToken(token);
        const invite = await authRepository.getActiveInviteTokenByHash(tokenHash);

        if (!invite) {
            throw new ValidationError("Liên kết thiết lập mật khẩu không hợp lệ hoặc đã hết hạn");
        }

        const hashedPassword = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);

        await authRepository.setPasswordAndActivate(invite.userId, hashedPassword);
        await authRepository.consumeInviteToken(invite.id);

        return { success: true };
    }

    async login(email: string, password: string, context: RequestContext = {}): Promise<LoginResult> {
        const user = await authRepository.findActiveUserByEmail(email);
        if (!user || !user.password) {
            throw new AuthenticationError("Email hoặc mật khẩu không đúng");
        }

        if (user.passwordSetupRequired) {
            throw new AuthenticationError("Tài khoản chưa hoàn tất thiết lập mật khẩu");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AuthenticationError("Email hoặc mật khẩu không đúng");
        }

        const payload: AuthTokenPayload = {
            userId: user.id,
            role: user.role,
        };

        const accessToken = this.createAccessToken(payload);
        const refreshToken = this.createRefreshToken(payload);

        await authRepository.createRefreshToken({
            userId: user.id,
            tokenHash: this.hashToken(refreshToken),
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
            userAgent: context.userAgent,
            ipAddress: context.ipAddress,
        });

        await authRepository.updateLastLogin(user.id);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }

    // revoke old -> create new access + refresh -> save new refresh, return new tokens
    async refresh(refreshToken: string, context: RequestContext = {}): Promise<LoginResult> {
        if (!refreshToken) {
            throw new AuthenticationError("Phiên đăng nhập không hợp lệ");
        }

        let payload: AuthTokenPayload;
        try {
            payload = this.verifyRefreshToken(refreshToken);
        } catch {
            throw new AuthenticationError("Phiên đăng nhập không hợp lệ");
        }

        const tokenHash = this.hashToken(refreshToken);
        const tokenRecord = await authRepository.getActiveRefreshTokenByHash(tokenHash);

        if (!tokenRecord || tokenRecord.userId !== payload.userId || !tokenRecord.user) {
            throw new AuthenticationError("Phiên đăng nhập không hợp lệ");
        }

        await authRepository.revokeRefreshToken(tokenRecord.id);

        const user = tokenRecord.user;
        const newPayload: AuthTokenPayload = {
            userId: user.id,
            role: user.role,
        };

        const accessToken = this.createAccessToken(newPayload);
        const newRefreshToken = this.createRefreshToken(newPayload);

        await authRepository.createRefreshToken({
            userId: user.id,
            tokenHash: this.hashToken(newRefreshToken),
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
            userAgent: context.userAgent,
            ipAddress: context.ipAddress,
        });

        return {
            accessToken,
            refreshToken: newRefreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }

    async logout(refreshToken?: string) {
        if (!refreshToken) {
            return { success: true };
        }

        const tokenHash = this.hashToken(refreshToken);
        const tokenRecord = await authRepository.getActiveRefreshTokenByHash(tokenHash);
        if (tokenRecord) {
            await authRepository.revokeRefreshToken(tokenRecord.id);
        }

        return { success: true };
    }

    async issueInviteByEmail(email: string, createdBy: string) {
        const user = await authRepository.findActiveUserByEmail(email);
        if (!user) {
            throw new NotFoundError("Không tìm thấy người dùng");
        }

        return this.issueInvite(user.id, createdBy);
    }
}

export const authService = new AuthService();
