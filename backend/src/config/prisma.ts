import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";
import path from "path";
import {pagination} from "prisma-extension-pagination";
import {mapPrismaError} from "../errors/prisma-error.mapper";

loadEnv({ path: path.resolve(process.cwd(), "backend/.env") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({
    adapter,
    // Never return the password hash by default. Re-include explicitly
    // (omit: { password: false }) only on the auth lookup that must compare it.
    omit: {
        user: {
            password: true,
        },
    },
})
    .$extends({
        query: {
            $allModels: {
                async $allOperations({args, query}) {
                    try {
                        return await query(args);
                    } catch (error) {
                        throw mapPrismaError(error);
                    }
                },
            },
        },
    })
    .$extends(pagination({
        pages: {
            limit: 10,
            includePageCount: true,
        },
        cursor: {
            limit: 10,
            includeTotalCount: true,
        }
    }));

export default prisma;
export * from "@prisma/client"
