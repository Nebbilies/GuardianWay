import type { Prisma } from "@prisma/client";
import prisma from "../../../config/prisma";
import type { Database } from "../../../config/database";

export const authRepository = {
    byHash(tokenHash: string, database: Database = prisma) {
        return database.refreshToken.findUnique({ where: { tokenHash } });
    },
    create(database: Database, data: Prisma.RefreshTokenUncheckedCreateInput) {
        return database.refreshToken.create({ data });
    },
    rotate(database: Database, id: string, tokenHash: string, now: Date, data: Prisma.RefreshTokenUpdateManyMutationInput) {
        return database.refreshToken.updateMany({ where: { id, tokenHash, revokedAt: null, expiresAt: { gt: now } }, data });
    },
    revokeSession(id: string, accountId: string) {
        return prisma.refreshToken.updateMany({ where: { id, accountId, revokedAt: null }, data: { revokedAt: new Date() } });
    },
    revokeHash(tokenHash: string) {
        return prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
    },
};
