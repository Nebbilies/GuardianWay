import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import {pagination} from "prisma-extension-pagination";

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
