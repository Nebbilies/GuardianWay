import { createRequire } from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { vehicleApi, vehicleSchema } from "@/modules/records/vehicles/contracts";
import { stopApi, stopSchema } from "@/modules/planning/stops/contracts";
import { studentApi, studentSchema, studentDetailSchema, guardianSchema, cardSchema, linkGuardianRequest, assignCardRequest } from "@/modules/records/students/contracts";
import { callApi, pageSchema } from "@/lib/http/contracts";
import { accountApi, invitationSchema } from "@/modules/system/accounts/contracts";
import { onboardDriverRequest, driverInvitationSchema } from "@/modules/records/drivers/contracts";
import { schoolApi, schoolSchema, schoolContextSchema, getSchoolContext } from "@/modules/system/schools/contracts";
import { policyApi, policySchema } from "@/modules/system/school-policies/contracts";
import { planApi, planSchema } from "@/modules/planning/route-plans/contracts";
import { scheduleApi, scheduleSchema } from "@/modules/planning/schedules/contracts";
import { tripApi, tripDetailSchema } from "@/modules/operations/trips/contracts";
import { listAudit, auditSchema } from "@/modules/system/audit/contracts";
import { landingProofSchema } from "@/modules/public-reporting/contracts";
import { getLandingProof } from "@/app/(landing)/_lib/get-landing-proof";
import { loginWeb, refreshWeb, currentUser, setupPassword, webLoginSchema, currentUserSchema } from "@/modules/system/auth/contracts";
import { getErrorMessage, i18n } from "@/lib/i18n";

type Case = { id: string; request: { path: string; method: string; body?: Record<string, unknown> }; response: { status: number; body: unknown } };
const requireFromTest = createRequire(import.meta.url);
const { loadCases, consumed } = requireFromTest("../../../scripts/contract-cases.cjs") as { loadCases: () => { cases: Case[] }; consumed: (app: string, ids: string[]) => void };
const records = loadCases().cases.filter(record => !record.id.startsWith("auth.mobile."));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const schemas: Record<string, z.ZodType> = {
    "auth.web.login": webLoginSchema, "auth.web.refresh": webLoginSchema, "auth.me": currentUserSchema,
    "accounts.activate": z.object({ message: z.string() }), "schools.create": schoolSchema, "school.context": schoolContextSchema,
    "accounts.create": invitationSchema, "vehicles.create": vehicleSchema, "stops.create": stopSchema, "stops.terminal.create": stopSchema,
    "students.create": studentSchema, "students.detail": studentDetailSchema, "guardians.create": guardianSchema, "cards.assign": cardSchema,
    "drivers.onboard": driverInvitationSchema, "policies.create": policySchema, "plans.create": planSchema, "plans.approve": planSchema,
    "schedules.create": scheduleSchema, "schedules.activate": scheduleSchema, "trips.create": tripDetailSchema, "trips.update": tripDetailSchema, "trips.cancel": tripDetailSchema,
    "audit.list": pageSchema(auditSchema), "public.landing": landingProofSchema,
};
function resourceId(record: Case) { return record.request.path.split("/")[3]!; }
function studentId(record: Case) { return record.request.path.split("/")[3]!; }
async function invoke(record: Case) {
    const input = record.request.body;
    switch (record.id) {
        case "auth.web.login": case "problem.credentials": return loginWeb(String(input!.email), String(input!.password));
        case "auth.web.refresh": return refreshWeb();
        case "auth.me": return currentUser();
        case "accounts.activate": return setupPassword(String(input!.token), String(input!.password));
        case "schools.create": return schoolApi.create(input);
        case "school.context": return getSchoolContext();
        case "accounts.create": return accountApi.create(input);
        case "vehicles.create": return vehicleApi.create(input);
        case "stops.create": case "stops.terminal.create": return stopApi.create(input);
        case "students.create": return studentApi.create(input);
        case "students.detail": return studentApi.get(resourceId(record));
        case "guardians.create": return callApi(linkGuardianRequest(studentId(record), input), guardianSchema);
        case "cards.assign": return callApi(assignCardRequest(studentId(record), input), cardSchema);
        case "drivers.onboard": return callApi(onboardDriverRequest(input), driverInvitationSchema);
        case "policies.create": return policyApi.create(input);
        case "plans.create": return planApi.create(input);
        case "plans.approve": return planApi.approve(resourceId(record));
        case "schedules.create": return scheduleApi.create(input);
        case "schedules.activate": return scheduleApi.activate(resourceId(record));
        case "trips.create": case "problem.trip.duplicate": return tripApi.create(input);
        case "trips.update": return tripApi.update(resourceId(record), input);
        case "trips.cancel": return tripApi.cancel(resourceId(record), input);
        case "audit.list": return listAudit({});
        case "public.landing": return (await getLandingProof()).data;
        default: throw new Error("Uncovered frontend case: " + record.id);
    }
}
describe("frontend consumer of fresh backend HTTP cases", () => {
    it("decodes all responses and sends the same accepted method, path and body through production API functions", async () => {
        vi.stubEnv("NEXT_PUBLIC_API_URL", "http://provider.test/api");
        for (const record of records) {
            const fetch = vi.fn(async () => new Response(JSON.stringify(record.response.body), { status: record.response.status, headers: { "Content-Type": "application/json" } }));
            vi.stubGlobal("fetch", fetch);
            if (record.response.status >= 400) {
                const error = await invoke(record).catch(error => error);
                expect(error).toMatchObject({ code: (record.response.body as { code: string }).code, status: record.response.status });
                await i18n.changeLanguage("en"); expect(getErrorMessage(error)).not.toBe("Something went wrong. Please try again.");
                await i18n.changeLanguage("vi");
            } else {
                expect(await invoke(record), record.id).toEqual(schemas[record.id]!.parse(record.response.body));
            }
            expect(fetch, record.id).toHaveBeenCalledOnce();
            const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit | undefined];
            expect(new URL(url).pathname).toBe(record.request.path);
            expect((init?.method ?? "GET").toUpperCase()).toBe(record.request.method);
            expect(init?.body ? JSON.parse(String(init.body)) : undefined).toEqual(record.request.body);
        }
        consumed("frontend", records.map(record => record.id));
    });
    it("rejects missing fields, invalid enums, scalar types and date/time values", () => {
        const negatives = [
            { id: "vehicles.create", field: "studentCapacity", value: "20" },
            { id: "students.create", field: "studentCode", value: undefined },
            { id: "plans.create", field: "referenceDate", value: "2026-02-30" },
            { id: "schedules.create", field: "plannedStartTime", value: "25:90" },
            { id: "trips.create", field: "dataVersion", value: null },
            { id: "stops.create", field: "kind", value: "UNKNOWN_KIND" },
        ];
        for (const item of negatives) {
            const record = records.find(record => record.id === item.id)!;
            const body = { ...(record.response.body as Record<string, unknown>), [item.field]: item.value };
            expect(schemas[item.id]!.safeParse(body).success, item.id).toBe(false);
        }
        for (const record of records.filter(record => record.response.status < 400)) {
            expect(schemas[record.id]!.safeParse({ ...(record.response.body as Record<string, unknown>), additionalProviderField: true }).success, record.id).toBe(true);
        }
    });
});
