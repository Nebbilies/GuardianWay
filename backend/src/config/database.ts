import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { mapPrismaError } from "../errors/prisma-error.mapper";

export type Database = Prisma.TransactionClient;

export async function transaction<T>(work: (database: Database) => Promise<T>): Promise<T> {
    try {
        return await prisma.$transaction(work);
    } catch (error) {
        throw mapPrismaError(error);
    }
}
