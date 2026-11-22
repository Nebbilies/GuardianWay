import { z } from "zod";
import { instant, pageSchema, callApi } from "@/lib/http/contracts";
import { buildQuery } from "@/lib/api-client";
export const auditSchema = z.object({
    id: z.uuid(),
    schoolId: z.uuid().nullable(),
    actorId: z.uuid().nullable(),
    action: z.string(),
    subjectKind: z.string(),
    subjectReference: z.string(),
    occurredAt: instant,
    createdAt: instant,
    reason: z.string().nullable(),
    changeSummary: z.object({
        schemaVersion: z.number().int(),
        scope: z.enum(["SCHOOL", "PLATFORM"]),
        actor: z.object({ id: z.uuid(), role: z.string() }).nullable(),
        before: z.unknown(),
        after: z.unknown(),
        request: z.unknown(),
    }),
});
export type AuditEntry = z.infer<typeof auditSchema>;
export const listAudit = (query: {
    action?: string;
    targetId?: string;
    page?: number;
    schoolId?: string;
}) =>
    callApi(
        { path: "/audit-logs?" + buildQuery(query), method: "GET" },
        pageSchema(auditSchema),
    );
