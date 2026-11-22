"use strict";
const bcrypt = require("bcrypt");
const { z } = require("zod");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { targetUrl } = require("./target-guard.cjs");
const { recordId } = require("./demo-record-id.cjs");
class DemoSchoolConflict extends Error {}
const { school: demoSchool, records } = require("./seed-demo-data.json");
const credential = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z
        .string()
        .min(12)
        .refine(
            (value) => Buffer.byteLength(value, "utf8") <= 72,
            "Password exceeds bcrypt byte limit",
        ),
});
async function seedSchoolData(database, schoolId, adminId, userPassword) {
    const ids = new Map([["$admin", adminId]]);
    for (const rows of Object.values(records)) {
        for (const key of Object.keys(rows)) {
            ids.set("$" + key, recordId(schoolId, key));
        }
    }
    function resolve(value) {
        if (typeof value === "string" && value.startsWith("$")) {
            if (!ids.has(value)) {
                throw new Error("Unknown demo record: " + value);
            }
            return ids.get(value);
        }
        if (Array.isArray(value)) {
            return value.map(resolve);
        }
        if (value && typeof value === "object") {
            return Object.fromEntries(
                Object.entries(value).map(([key, field]) => [
                    key,
                    resolve(field),
                ]),
            );
        }
        return value;
    }
    const newTrips = new Set();
    for (const [model, rows] of Object.entries(records)) {
        for (const [key, row] of Object.entries(rows)) {
            const id = ids.get("$" + key);
            const existing = await database[model].findUnique({
                where: { id },
                select: { schoolId: true },
            });
            if (existing) {
                if (existing.schoolId !== schoolId) {
                    throw new Error("Demo record belongs to another school");
                }
                continue;
            }
            const data = { id, schoolId, ...resolve(row) };
            if (model === "userAccount") {
                data.email = key + "." + schoolId + "@demo.invalid";
                if (userPassword) {
                    data.passwordHash = await bcrypt.hash(userPassword, 10);
                    data.status = "ACTIVE";
                    data.activatedAt = new Date();
                }
            }
            await database[model].create({ data, select: { id: true } });
            if (model === "trip") {
                newTrips.add(id);
            }
            // The trip and its closing check reference each other.
            if (model === "tripReconciliation" && newTrips.has(data.tripId)) {
                await database.trip.update({
                    where: { id: data.tripId },
                    data: { closedReconciliationId: id },
                });
            }
        }
    }
}
async function seedDemo(
    client,
    environment,
    { firstPlatformOnly = false } = {},
) {
    const platform = credential.parse({
        email: environment.BOOTSTRAP_PLATFORM_EMAIL,
        password: environment.BOOTSTRAP_PLATFORM_PASSWORD,
    });
    const admin =
        environment.DEMO_ADMIN_EMAIL || environment.DEMO_ADMIN_PASSWORD
            ? credential.parse({
                  email: environment.DEMO_ADMIN_EMAIL,
                  password: environment.DEMO_ADMIN_PASSWORD,
              })
            : null;
    return client.$transaction(
        async (database) => {
            await database.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('guardianway.demo-bootstrap'))`;
            async function account(input, role, schoolId, displayName) {
                const existing = await database.userAccount.findUnique({
                    where: { email: input.email },
                    omit: { passwordHash: false },
                });
                if (existing) {
                    if (
                        existing.role !== role ||
                        existing.schoolId !== schoolId ||
                        existing.deletedAt
                    ) {
                        throw new Error(
                            "Bootstrap account conflicts with existing account ownership",
                        );
                    }
                    if (
                        existing.status !== "ACTIVE" ||
                        !existing.activatedAt ||
                        !existing.passwordHash
                    ) {
                        throw new Error(
                            "Existing bootstrap account cannot sign in",
                        );
                    }
                    return existing;
                }
                return database.userAccount.create({
                    data: {
                        email: input.email,
                        passwordHash: await bcrypt.hash(input.password, 10),
                        role,
                        schoolId,
                        displayName,
                        status: "ACTIVE",
                        activatedAt: new Date(),
                    },
                });
            }
            if (firstPlatformOnly) {
                await database.$executeRaw`LOCK TABLE user_account IN SHARE ROW EXCLUSIVE MODE`;
                const others = await database.userAccount.count({
                    where: {
                        role: "PLATFORM_ADMIN",
                        email: { not: platform.email },
                    },
                });
                if (others) {
                    throw new Error("A platform administrator already exists");
                }
            }
            await account(
                platform,
                "PLATFORM_ADMIN",
                null,
                "Demo platform administrator",
            );
            if (admin) {
                const code = (environment.DEMO_SCHOOL_CODE || "DEMO")
                    .trim()
                    .toUpperCase();
                const { id } = await database.school.upsert({
                    where: { code },
                    update: {},
                    create: { code, ...demoSchool, status: "ACTIVE" },
                });
                const [school] =
                    await database.$queryRaw`SELECT id, name, address, timezone, status, deleted_at AS "deletedAt" FROM school WHERE id = ${id}::uuid FOR SHARE`;
                if (!school || school.deletedAt || school.status !== "ACTIVE") {
                    throw new Error("Demo school is not active");
                }
                if (
                    school.name !== demoSchool.name ||
                    school.address !== demoSchool.address
                ) {
                    throw new Error(
                        "Demo school code belongs to a different school",
                    );
                }
                if (school.timezone !== demoSchool.timezone) {
                    throw new DemoSchoolConflict(
                        "Demo trip times require a school in " +
                            demoSchool.timezone,
                    );
                }
                const policy = await database.schoolPolicyVersion.findFirst({
                    where: {
                        schoolId: id,
                        versionNo: records.schoolPolicyVersion.policy.versionNo,
                    },
                    select: { id: true },
                });
                if (policy && policy.id !== recordId(id, "policy")) {
                    throw new DemoSchoolConflict(
                        "The school already has a different version 1 policy. Use a dedicated demo school and administrator.",
                    );
                }
                const schoolAdmin = await account(
                    admin,
                    "SCHOOL_ADMIN",
                    school.id,
                    "Demo school administrator",
                );
                const userPassword =
                    environment.DEMO_USER_PASSWORD || undefined;
                if (userPassword) {
                    credential.shape.password.parse(userPassword);
                }
                await seedSchoolData(
                    database,
                    school.id,
                    schoolAdmin.id,
                    userPassword,
                );
            }
        },
        { timeout: 30_000 },
    );
}
module.exports = { seedDemo };
if (require.main === module) {
    const url = targetUrl(process.env.DATABASE_URL);
    const database = new PrismaClient({
        adapter: new PrismaPg({ connectionString: url }),
    });
    seedDemo(database, process.env)
        .then(() =>
            console.log(
                "Demo bootstrap completed; existing accounts and history preserved",
            ),
        )
        .catch((error) => {
            console.error(
                error instanceof DemoSchoolConflict
                    ? error.message
                    : "Demo bootstrap failed. Check required credentials and existing ownership; no credentials are logged.",
            );
            process.exitCode = 1;
        })
        .finally(() => database.$disconnect());
}
