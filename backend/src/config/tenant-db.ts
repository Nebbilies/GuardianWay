// App-layer tenant isolation.
//
// Instead of every repository remembering to add `where: { schoolId }`, a Prisma
// Client extension injects it automatically for tenant-owned models. The current
// schoolId travels via AsyncLocalStorage — a per-request "backpack" — so it never
// has to be threaded through controller -> service -> repository signatures.
//
// RLS is still the planned DB-level backstop; this only removes human error.

import { AsyncLocalStorage } from "node:async_hooks";
import { Prisma } from "@prisma/client";
import basePrisma from "./prisma";
import { ValidationError } from "../errors/http-errors";

type Db = typeof basePrisma;

// Models that carry a `schoolId` column and must be tenant-scoped.
// NOTE: User is intentionally excluded — SUPER_ADMIN is a User with schoolId=null
// and creates users across schools, so that module scopes itself explicitly.
const SCOPED_MODELS = new Set<string>([
    "StudentProfile",
    "Bus",
    "BusStop",
    "BusRoute",
    "BusTrip",
    "TripEvent",
    "TrackingLog",
]);

// Operations whose `where` accepts arbitrary (non-unique) fields — safe to filter.
const WHERE_OPS = new Set<string>([
    "findFirst",
    "findFirstOrThrow",
    "findMany",
    "count",
    "aggregate",
    "groupBy",
    "updateMany",
    "deleteMany",
]);

// Unique-`where` ops: Prisma only allows unique fields in their `where`, so we can't
// inject schoolId — they would silently bypass the tenant filter. Forbid them on
// scoped models; repositories must use the *Many / findFirst variants instead.
const UNIQUE_OPS = new Set<string>([
    "findUnique",
    "findUniqueOrThrow",
    "update",
    "delete",
    "upsert",
]);

// A Prisma extension bound (via closure) to one schoolId.
function forTenant(schoolId: string) {
    return Prisma.defineExtension((client) =>
        client.$extends({
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
                        if (!SCOPED_MODELS.has(model)) return query(args);

                        // Reads + bulk mutations: inject the tenant filter. These are the
                        // ops where a forgotten `where` silently leaks across tenants.
                        if (WHERE_OPS.has(operation)) {
                            const a = args as { where?: object };
                            a.where = { ...(a.where ?? {}), schoolId };
                            return query(args);
                        }

                        // Unique-`where` ops can't be scoped (Prisma only allows unique
                        // fields there), so they'd bypass the filter — forbid them.
                        if (UNIQUE_OPS.has(operation)) {
                            throw new Error(
                                `Tenant-scoped model "${model}" cannot use "${operation}" ` +
                                `(its unique where bypasses the tenant filter). ` +
                                `Use findFirst / updateMany / deleteMany instead.`,
                            );
                        }

                        // create / createMany fall through: the repo supplies schoolId
                        // (type-safe), and a forgotten one fails loudly on NOT NULL.
                        return query(args);
                    },
                },
            },
        }),
    );
}

export interface TenantContext {
    schoolId: string | null;
    userId?: string;
    role?: string;
    prisma: Db;
}

const tenantStore = new AsyncLocalStorage<TenantContext>();

// Enter a tenant context for the duration of `fn` (and everything it awaits).
// schoolId=null (SUPER_ADMIN / background jobs) uses the unscoped base client.
export function runWithTenant<T>(
    ctx: { schoolId: string | null; userId?: string; role?: string },
    fn: () => T,
): T {
    const prisma = ctx.schoolId
        ? (basePrisma.$extends(forTenant(ctx.schoolId)) as unknown as Db)
        : basePrisma;
    return tenantStore.run({ ...ctx, prisma }, fn);
}

// The tenant-scoped Prisma client for the current request.
// Falls back to the base client outside any request (seed, scripts).
export function db(): Db {
    return tenantStore.getStore()?.prisma ?? basePrisma;
}

export function currentSchoolId(): string | null {
    return tenantStore.getStore()?.schoolId ?? null;
}

// For creating tenant-owned rows: the acting user must belong to a school.
// SUPER_ADMIN (schoolId null) can't create school-scoped resources this way.
export function requireCurrentSchoolId(): string {
    const id = currentSchoolId();
    if (!id) {
        throw new ValidationError("Tài khoản không gắn với trường học nào");
    }
    return id;
}
