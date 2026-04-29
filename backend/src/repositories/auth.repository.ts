import prisma from "../config/prisma";
import { Role, User } from "@prisma/client";

export interface CreateInviteTokenInput {
    userId: string;
    tokenHash: string;
    createdBy: string;
    expiresAt: Date;
}

export interface CreateRefreshTokenInput {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
}

class AuthRepository {
    async findActiveUserByEmail(email: string) {
        return prisma.user.findFirst({
            where: {
                email,
                deletedAt: null,
                isActive: true,
            },
        });
    }

    async findUserById(id: string) {
        return prisma.user.findFirst({
            where: {
                id,
                deletedAt: null,
                isActive: true,
            },
        });
    }

    async createInviteToken(data: CreateInviteTokenInput) {
        return prisma.userInviteToken.create({
            data,
        });
    }

    async getActiveInviteTokenByHash(tokenHash: string) {
        return prisma.userInviteToken.findFirst({
            where: {
                tokenHash,
                consumedAt: null,
                expiresAt: { gt: new Date() },
            },
            include: {
                user: true,
            },
        });
    }

    async consumeInviteToken(id: string) {
        return prisma.userInviteToken.update({
            where: { id },
            data: {
                consumedAt: new Date(),
            },
        });
    }

    async invalidateActiveInviteTokensForUser(userId: string) {
        await prisma.userInviteToken.updateMany({
            where: {
                userId,
                consumedAt: null,
            },
            data: {
                consumedAt: new Date(),
            },
        });
    }

    async setPasswordAndActivate(userId: string, hashedPassword: string) {
        return prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                passwordSetupRequired: false,
            },
        });
    }

    async updateLastLogin(userId: string) {
        return prisma.user.update({
            where: { id: userId },
            data: {
                lastLoginAt: new Date(),
            },
        });
    }

    async createRefreshToken(data: CreateRefreshTokenInput) {
        return prisma.refreshToken.create({
            data,
        });
    }

    async getActiveRefreshTokenByHash(tokenHash: string) {
        return prisma.refreshToken.findFirst({
            where: {
                tokenHash,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
            include: {
                user: true,
            },
        });
    }

    async revokeRefreshToken(id: string) {
        return prisma.refreshToken.update({
            where: { id },
            data: {
                revokedAt: new Date(),
            },
        });
    }

    async revokeAllUserRefreshTokens(userId: string) {
        await prisma.refreshToken.updateMany({
            where: {
                userId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });
    }

    async getUserByIdForAuth(id: string) {
        return prisma.user.findFirst({
            where: {
                id,
                deletedAt: null,
                isActive: true,
            },
            select: {
                id: true,
                role: true,
                email: true,
                name: true,
                passwordSetupRequired: true,
            },
        });
    }

    async userHasRole(userId: string, roles: Role[]) {
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                role: { in: roles },
                deletedAt: null,
                isActive: true,
            },
            select: { id: true },
        });

        return Boolean(user);
    }
}

export const authRepository = new AuthRepository();
