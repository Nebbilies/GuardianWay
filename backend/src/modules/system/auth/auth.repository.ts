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
    consume(database: Database, id: string, accountId: string, now: Date) {
        return database.refreshToken.updateMany({ where: { id, accountId, revokedAt: null, expiresAt: { gt: now } }, data: { revokedAt: now } });
    },
    revokeHash(tokenHash: string) {
        return prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
    },
    revokeAccount(accountId: string, database: Database = prisma) {
        return database.refreshToken.updateMany({ where: { accountId, revokedAt: null }, data: { revokedAt: new Date() } });
    },
};
