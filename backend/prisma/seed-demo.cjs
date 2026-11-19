"use strict";
const bcrypt = require("bcrypt");
const { z } = require("zod");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { targetUrl } = require("./target-guard.cjs");
const credential = z.object({ email: z.string().trim().toLowerCase().pipe(z.email()), password: z.string().min(12).max(200) });
async function seedDemo(client, environment) {
    const platform = credential.parse({ email: environment.BOOTSTRAP_PLATFORM_EMAIL, password: environment.BOOTSTRAP_PLATFORM_PASSWORD });
    const admin = environment.DEMO_ADMIN_EMAIL || environment.DEMO_ADMIN_PASSWORD ? credential.parse({ email: environment.DEMO_ADMIN_EMAIL, password: environment.DEMO_ADMIN_PASSWORD }) : null;
    return client.$transaction(async database => {
    async function account(input, role, schoolId, displayName) {
        const existing = await database.userAccount.findUnique({ where: { email: input.email } });
        if (existing) {
            if (existing.role !== role || existing.schoolId !== schoolId || existing.deletedAt) throw new Error("Bootstrap account conflicts with existing account ownership");
            return;
        }
        await database.userAccount.create({ data: { email: input.email, passwordHash: await bcrypt.hash(input.password, 10), role, schoolId, displayName, status: "ACTIVE", activatedAt: new Date() } });
    }
    await account(platform, "PLATFORM_ADMIN", null, "Demo platform administrator");
    if (admin) {
        const code = (environment.DEMO_SCHOOL_CODE || "DEMO").trim().toUpperCase();
        const school = await database.school.upsert({ where: { code }, update: {}, create: { code, name: "GuardianWay demonstration school", address: "Fictional school address", timezone: "Asia/Ho_Chi_Minh", status: "ACTIVE" } });
        if (school.deletedAt) throw new Error("Demo school has been deleted; resolve it explicitly before bootstrapping");
        await account(admin, "SCHOOL_ADMIN", school.id, "Demo school administrator");
    }
    });
}
module.exports = { seedDemo };
if (require.main === module) {
    const url = targetUrl(process.env.DATABASE_URL);
    const database = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    seedDemo(database, process.env).then(() => console.log("Demo bootstrap completed; existing accounts and history preserved"))
        .catch(() => { console.error("Demo bootstrap failed. Check required credentials and existing ownership; no credentials are logged."); process.exitCode = 1; })
        .finally(() => database.$disconnect());
}
