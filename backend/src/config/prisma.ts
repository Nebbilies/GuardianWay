import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "@prisma/client";
import { config as loadEnv } from "dotenv";
import path from "path";

if (process.env.GUARDIANWAY_ENV_LOADED !== "1") {
    loadEnv({ path: path.resolve(process.cwd(), "backend/.env"), quiet: true });
    loadEnv({ path: path.resolve(process.cwd(), ".env"), quiet: true });
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const options: Prisma.PrismaClientOptions = {
    adapter,
    // Credential reads opt in inside the accounts repository only.
    omit: {
        userAccount: {
            passwordHash: true,
        },
    },
};
const prisma = new PrismaClient(options);

export default prisma;
export * from "@prisma/client"
