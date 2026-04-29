import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";
import path from "path";
import {pagination} from "prisma-extension-pagination";

loadEnv({ path: path.resolve(process.cwd(), "backend/.env") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter }).$extends(pagination({
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
