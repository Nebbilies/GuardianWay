import { Prisma } from "@prisma/client";
import prisma from "../../../config/prisma";
import type { Database } from "../../../config/database";
import { deletedFilter, listOptions, pageResult, type ListQuery } from "../../../http/contracts/pagination";
import { fromWireRole, type WireRole } from "../../../http/principal";

const select = {
    id: true, schoolId: true, displayName: true, email: true, phone: true, role: true, status: true,
    activatedAt: true, createdAt: true, updatedAt: true, deletedAt: true,
} satisfies Prisma.UserAccountSelect;

export const accountRepository = {
    credentials(email: string, database: Database = prisma) {
        return database.userAccount.findUnique({ where: { email }, omit: { passwordHash: false } });
    },
    async lockForAuthentication(database: Database, id: string) {
        await database.$queryRaw`SELECT id FROM user_account WHERE id = ${id}::uuid FOR SHARE`;
        return accountRepository.authById(id, database);
    },
    revokeAuthenticationSessions(accountId: string, database: Database = prisma) {
        return database.refreshToken.updateMany({ where: { accountId, revokedAt: null }, data: { revokedAt: new Date() } });
    },
    authById(id: string, database: Database = prisma) {
        return database.userAccount.findUnique({ where: { id }, omit: { passwordHash: false } });
    },
    find(schoolId: string, id: string, database: Database = prisma) {
        return database.userAccount.findFirst({ where: { id, schoolId }, select });
    },
    async lockAndFind(database: Database, schoolId: string, id: string) {
        await database.$queryRaw`SELECT id FROM user_account WHERE school_id = ${schoolId}::uuid AND id = ${id}::uuid FOR UPDATE`;
        return accountRepository.find(schoolId, id, database);
    },
    emailTarget(email: string, schoolId?: string) {
        return prisma.userAccount.findFirst({
            where: { email, deletedAt: null, schoolId: schoolId ?? { not: null }, ...(schoolId ? {} : { role: "SCHOOL_ADMIN" }) }, select,
        });
    },
    async list(schoolId: string, query: ListQuery & { role?: WireRole }, schoolAdminsOnly = false, exportAll = false) {
        const where: Prisma.UserAccountWhereInput = {
            schoolId, deletedAt: deletedFilter(query),
            ...(schoolAdminsOnly && query.role && query.role !== "ADMIN" ? { id: { in: [] } } : {}),
            role: schoolAdminsOnly ? "SCHOOL_ADMIN" : query.role ? fromWireRole(query.role) : undefined,
            ...(query.search ? { OR: [{ displayName: { contains: query.search, mode: "insensitive" } }, { email: { contains: query.search, mode: "insensitive" } }] } : {}),
        };
        const options = listOptions(query, ["createdAt", "displayName", "email", "role", "status"], "-createdAt");
        const [rows, count] = await Promise.all([
            prisma.userAccount.findMany({ where, select, ...options, ...(exportAll ? { skip: undefined, take: undefined } : {}) }),
            prisma.userAccount.count({ where }),
        ]);
        return exportAll ? pageResult(rows, rows.length, { page: 1, limit: Math.max(1, rows.length) }) : pageResult(rows, count, query);
    },
    create(database: Database, data: Prisma.UserAccountUncheckedCreateInput) {
        return database.userAccount.create({ data, select });
    },
    async update(database: Database, schoolId: string, id: string, data: Prisma.UserAccountUncheckedUpdateInput) {
        const result = await database.userAccount.updateMany({ where: { id, schoolId }, data });
        return result.count ? database.userAccount.findFirstOrThrow({ where: { id, schoolId }, select }) : null;
    },
    async hasRoleLinks(database: Database, schoolId: string, id: string, newRole: string) {
        const [drivers, guardians] = await Promise.all([
            newRole !== "DRIVER" ? database.driverProfile.count({ where: { schoolId, accountId: id, deletedAt: null } }) : 0,
            newRole !== "PARENT" ? database.guardianLink.count({ where: { schoolId, guardianAccountId: id, effectiveTo: null } }) : 0,
        ]);
        return drivers + guardians > 0;
    },
    revokeInvites(database: Database, accountId: string, now: Date) {
        return database.userInvite.updateMany({ where: { accountId, status: "ISSUED" }, data: { status: "REVOKED", revokedAt: now } });
    },
    createInvite(database: Database, data: Prisma.UserInviteUncheckedCreateInput) { return database.userInvite.create({ data }); },
    invite(tokenHash: string, database: Database = prisma) { return database.userInvite.findUnique({ where: { tokenHash } }); },
    consumeInvite(database: Database, id: string, now: Date) {
        return database.userInvite.updateMany({ where: { id, status: "ISSUED", acceptedAt: null, revokedAt: null, expiresAt: { gt: now } }, data: { status: "ACCEPTED", acceptedAt: now } });
    },
};
