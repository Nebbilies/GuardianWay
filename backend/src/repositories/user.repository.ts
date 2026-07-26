import { Role } from "@prisma/client";
import prisma from "../config/prisma";
import { NotFoundError } from "../errors/http-errors";

export interface GetAllUsersParams {
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    role?: Role;
    deleted?: string;
    // undefined => SUPER_ADMIN, no tenant filter.
    schoolId?: string;
}

export interface CreateUserData {
    name: string;
    email: string;
    role: Role;
    phoneNumber?: string;
    address?: string;
    // resolved by the service from the acting user's school.
    schoolId?: string | null;

    licenseNumber?: string;

    password?: string | null;
    passwordSetupRequired?: boolean;
}

export interface UpdateUserData {
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
    phoneNumber?: string;
    address?: string;

    licenseNumber?: string;
}

class UserRepository {
    async getAll(params: GetAllUsersParams = {}) {
        const searchTerm = params.search?.trim();
        const sortParam = params?.sort || "createdAt";
        const isDesc = sortParam.startsWith("-");
        const sortBy = isDesc ? sortParam.substring(1) : sortParam;
        const sortOrder = isDesc ? "desc" : "asc";
        const deleted = params.deleted || "exclude";

        const whereClause: any = {
            schoolId: params.schoolId,
        };

        if (deleted === "exclude") {
            whereClause.deletedAt = null;
        } else if (deleted === "only") {
            whereClause.deletedAt = {not: null};
        }

        if (params.role) {
            whereClause.role = params.role;
        }

        if (searchTerm) {
            whereClause.OR = [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { email: { contains: searchTerm, mode: "insensitive" } },
            ];
        }

        const [data, metadata] = await prisma.user
            .paginate({
                where: whereClause,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    driverProfile: true,
                },
            })
            .withPages({
                page: params?.page || 1,
                limit: params?.limit || 10,
                includePageCount: true,
            });

        return { data, metadata };
    }

    async getAllForExport(params: GetAllUsersParams = {}) {
        const searchTerm = params.search?.trim();
        const sortParam = params?.sort || "createdAt";
        const isDesc = sortParam.startsWith("-");
        const sortBy = isDesc ? sortParam.substring(1) : sortParam;
        const sortOrder = isDesc ? "desc" : "asc";

        const whereClause: any = {
            deletedAt: null,
            schoolId: params.schoolId,
        };

        if (params.role) {
            whereClause.role = params.role;
        }

        if (searchTerm) {
            whereClause.OR = [
                {name: {contains: searchTerm, mode: "insensitive"}},
                {email: {contains: searchTerm, mode: "insensitive"}},
            ];
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            orderBy: {[sortBy]: sortOrder},
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phoneNumber: true,
                address: true,
                createdAt: true,
                updatedAt: true,
                driverProfile: {
                    select: {
                        licenseNumber: true,
                    },
                },
            },
        });

        return {
            data: users.map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                address: user.address,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                licenseNumber: user.driverProfile?.licenseNumber ?? null,
            })),
            metadata: {
                total: users.length,
                exportedAt: new Date().toISOString(),
            },
        };
    }

    async getById(id: string, schoolId?: string, includeDeleted = false) {
        return prisma.user.findFirst({
            where: {id, schoolId, deletedAt: includeDeleted ? undefined : null},
            include: {
                driverProfile: true,
            },
        });
    }

    async getParents(schoolId?: string) {
        return prisma.user.findMany({
            where: {
                role: "PARENT",
                deletedAt: null,
                schoolId,
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: { name: "asc" },
        });
    }

    async findByEmail(email: string) {
        // email is unique only among non-deleted rows (partial index), so this is
        // findFirst, not findUnique. deletedAt: null keeps it to the active account.
        return prisma.user.findFirst({
            where: { email, deletedAt: null },
        });
    }

    async create(data: CreateUserData) {
        const {licenseNumber, ...userData} = data;

        if (data.role === "DRIVER" && licenseNumber) {
            return prisma.$transaction(async (tx: any) => {
                const user = await tx.user.create({ data: userData });
                await tx.driverProfile.create({
                    data: {
                        userId: user.id,
                        licenseNumber,
                    },
                });
                return tx.user.findUnique({
                    where: { id: user.id },
                    include: {driverProfile: true},
                });
            });
        }

        return prisma.user.create({
            data: userData,
            include: {driverProfile: true},
        });
    }

    async update(id: string, schoolId: string | undefined, data: UpdateUserData) {
        const {licenseNumber, ...userData} = data;

        return prisma.$transaction(async (tx: any) => {
            const owned = await tx.user.findFirst({
                where: {id, schoolId, deletedAt: null},
                select: {id: true},
            });
            if (!owned) {
                throw new NotFoundError("Không tìm thấy người dùng");
            }

            const user = await tx.user.update({
                where: { id },
                data: userData,
            });

            if (user.role === "DRIVER" && licenseNumber) {
                await tx.driverProfile.upsert({
                    where: { userId: id },
                    create: {
                        userId: id,
                        licenseNumber,
                    },
                    update: {
                        licenseNumber,
                    },
                });
            } else if (user.role !== "DRIVER") {
                // if change role from driver, delete driver profile
                await tx.driverProfile.deleteMany({ where: { userId: id } });
            }

            return tx.user.findUnique({
                where: { id },
                include: {driverProfile: true},
            });
        });
    }

    async delete(id: string, schoolId?: string): Promise<void> {
        const owned = await prisma.user.findFirst({
            where: {id, schoolId, deletedAt: null},
            select: {id: true},
        });
        if (!owned) {
            throw new NotFoundError("Không tìm thấy người dùng");
        }
        await prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    // hard delete: used to roll back a freshly-created user when invite issuance
    // fails. email is @unique, so a soft delete would lock that email forever.
    // onDelete: Cascade removes any profile / invite token rows.
    async hardDelete(id: string): Promise<void> {
        await prisma.user.delete({
            where: {id},
        });
    }

    async restore(id: string): Promise<void> {
        await prisma.user.update({
            where: {id},
            data: {deletedAt: null},
        })
    }
}

export const userRepository = new UserRepository();
