import {
    ACCESS_COOKIE_NAME,
    REFRESH_COOKIE_NAME,
    loginBody,
    refreshBody,
    logoutBody,
    authUserSchema,
    sessionResponseSchema,
    webResponseSchema,
} from "../modules/system/auth";
import {
    schoolBody,
    schoolPatch,
    schoolViewSchema,
    schoolContextSchema,
} from "../modules/system/schools";
import {
    accountBody,
    accountPatch,
    accountQuery,
    accountViewSchema,
    invitationResponseSchema,
} from "../modules/system/accounts";
import { auditQuery, auditSchema } from "../modules/system/audit";
import { policyBody, policySchema } from "../modules/system/school-policies";
import { landingProofSchema } from "../modules/public-reporting";
import {
    studentBody,
    studentPatch,
    studentQuery,
    studentSchema,
    studentDetailSchema,
    guardianSchema,
    cardSchema,
    guardianBody,
    cardBody,
} from "../modules/records/students";
import {
    vehicleBody,
    vehiclePatch,
    vehicleQuery,
    vehicleSchema,
} from "../modules/records/vehicles";
import {
    driverBody,
    driverPatch,
    driverOnboarding,
    driverQuery,
    driverSchema,
} from "../modules/records/drivers";
import {
    stopBody,
    stopPatch,
    stopQuery,
    stopSchema,
} from "../modules/planning/stops";
import {
    planBody,
    planApprovalBody,
    planQuery,
    planSchema,
} from "../modules/planning/route-plans";
import {
    scheduleBody,
    scheduleQuery,
    scheduleSchema,
} from "../modules/planning/schedules";
import {
    tripBody,
    tripPatch,
    cancelBody,
    tripQuery,
    tripSchema,
    tripDetailSchema,
} from "../modules/operations/trips";
import { z } from "zod";
import { activationBody, invitationBody } from "../modules/system/accounts";
import {
    listQuerySchema,
    pageResponseSchema,
} from "../http/contracts/pagination";
import { reasonBody } from "../http/normalization";
import { problemSchema } from "../http/contracts/problem";
import {
    manifest,
    registration,
    transportExamples,
} from "./transport-examples";

type Options = {
    body?: z.ZodType;
    query?: z.ZodType;
    status?: number;
    optionalBody?: boolean;
    note?: string;
    media?: string;
    refreshCookie?: boolean;
    fixtureExamples?: Record<string, { value: unknown }>;
};
function jsonSchema(schema: z.ZodType, io: "input" | "output" = "input") {
    // Input view preserves wire formats for normalized codes, plates and query strings.
    const { $schema: dialect, ...json } = z.toJSONSchema(schema, {
        io,
        unrepresentable: "any",
    });
    void dialect;
    return json;
}
export function buildOpenApi() {
    const paths: Record<string, Record<string, unknown>> = {};
    const problem = {
        description:
            "Request failed. See the machine-readable code and traceId.",
        content: {
            "application/json": {
                schema: { $ref: "#/components/schemas/Problem" },
            },
        },
    };
    function group(tag: string, base: string, roles: string[]) {
        return function operation(
            method: string,
            suffix: string,
            summary: string,
            response: z.ZodType,
            options: Options = {},
        ) {
            const path = base + suffix;
            const parameters: Record<string, unknown>[] = Array.from(
                path.matchAll(/\{(\w+)\}/g),
                ([, name]) => ({
                    name,
                    in: "path",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                }),
            );
            if (options.query) {
                const query = jsonSchema(options.query);
                for (const [name, schema] of Object.entries(
                    query.properties ?? {},
                )) {
                    parameters.push({
                        name,
                        in: "query",
                        required: query.required?.includes(name) ?? false,
                        schema,
                    });
                }
            }
            const description = [
                roles.length
                    ? "Access: " + roles.join(" or ") + "."
                    : "Public endpoint.",
                options.note,
                options.fixtureExamples &&
                    "Fixture preview. This endpoint is not implemented yet.",
            ]
                .filter(Boolean)
                .join(" ");
            const success = {
                description: summary,
                content: {
                    [options.media ?? "application/json"]: {
                        schema: jsonSchema(response, "output"),
                        ...(options.fixtureExamples && {
                            examples: options.fixtureExamples,
                        }),
                    },
                },
            };
            (paths[path] ??= {})[method] = {
                tags: [tag],
                summary,
                description,
                ...(options.fixtureExamples && { "x-fixture-only": true }),
                security: options.refreshCookie
                    ? [{ refreshCookie: [] }, {}]
                    : roles.length
                      ? [{ bearerAuth: [] }, { sessionCookie: [] }]
                      : [],
                parameters,
                ...(options.body && {
                    requestBody: {
                        required: !options.optionalBody,
                        content: {
                            "application/json": {
                                schema: jsonSchema(options.body),
                            },
                        },
                    },
                }),
                responses: {
                    [options.status ?? 200]: success,
                    ...(path === "/readyz" && {
                        "503": {
                            ...success,
                            description: "Dependency unavailable",
                        },
                    }),
                    default: problem,
                },
            };
        };
    }
    const school = ["SCHOOL_ADMIN"],
        platform = ["PLATFORM_ADMIN"],
        admins = [...school, ...platform];
    const message = z.object({ message: z.string() });
    const auth = group("Authentication", "/api/auth", []);
    for (const mobile of [false, true]) {
        const prefix = mobile ? "/token" : "";
        const name = mobile ? "mobile" : "web";
        const result = mobile ? sessionResponseSchema : webResponseSchema;
        auth("post", prefix + "/login", "Sign in (" + name + ")", result, {
            body: loginBody,
            note: mobile
                ? "Returns access and refresh tokens."
                : "Sets HttpOnly session cookies used by this browser.",
        });
        auth(
            "post",
            prefix + "/refresh",
            "Refresh session (" + name + ")",
            result,
            {
                body: refreshBody,
                optionalBody: !mobile,
                refreshCookie: !mobile,
                note: mobile
                    ? "Supply the mobile refresh token."
                    : "Use the refresh cookie or supply refreshToken in the body.",
            },
        );
        auth("post", prefix + "/logout", "Sign out (" + name + ")", message, {
            body: logoutBody,
            optionalBody: true,
        });
    }
    auth("post", "/setup-password", "Activate an invited account", message, {
        body: activationBody,
    });
    group("Authentication", "/api/auth", ["any signed-in account"])(
        "get",
        "/me",
        "Read current user",
        z.object({ user: authUserSchema }),
    );
    group("Authentication", "/api/auth", admins)(
        "post",
        "/invites",
        "Resend invitation by email",
        invitationResponseSchema,
        { body: invitationBody },
    );
    group("Public reporting", "/api/public", [])(
        "get",
        "/landing-proof",
        "Read landing page statistics",
        landingProofSchema,
    );
    const schools = group("Schools", "/api/schools", platform);
    schools("get", "", "List schools", pageResponseSchema(schoolViewSchema), {
        query: listQuerySchema,
    });
    schools("post", "", "Create school", schoolViewSchema, {
        body: schoolBody,
        status: 201,
    });
    schools("patch", "/{id}", "Update school", schoolViewSchema, {
        body: schoolPatch,
    });
    schools("delete", "/{id}", "Delete school", schoolViewSchema);
    schools("post", "/{id}/restore", "Restore school", schoolViewSchema);
    group("Schools", "/api/school-context", school)(
        "get",
        "",
        "Read school context",
        schoolContextSchema,
    );
    group("Audit", "/api/audit-logs", admins)(
        "get",
        "",
        "List audit entries",
        pageResponseSchema(auditSchema),
        { query: auditQuery },
    );
    const policy = group("School policies", "/api/school-policies", school);
    policy("get", "", "List school policies", z.array(policySchema));
    policy("post", "", "Create policy version", policySchema, {
        body: policyBody,
        status: 201,
    });

    function records(
        tag: string,
        base: string,
        roles: string[],
        row: z.ZodType,
        query: z.ZodType,
        body: z.ZodType,
        patch: z.ZodType,
        detail = row,
        created = row,
    ) {
        const op = group(tag, base, roles);
        const page = pageResponseSchema(row);
        op("get", "", "List " + tag.toLowerCase(), page, { query });
        op("get", "/export", "Export " + tag.toLowerCase(), page, { query });
        op("get", "/{id}", "Read record", detail);
        op("post", "", "Create record", created, { body, status: 201 });
        op("patch", "/{id}", "Update record", row, { body: patch });
        op("delete", "/{id}", "Delete record", row);
        op("post", "/{id}/restore", "Restore record", row);
        return op;
    }
    for (const [path, roles] of [
        ["/api/users", school],
        ["/api/schools/{schoolId}/admins", platform],
    ] as const) {
        const op = records(
            "Accounts",
            path,
            roles,
            accountViewSchema,
            accountQuery,
            accountBody,
            accountPatch,
            accountViewSchema,
            invitationResponseSchema,
        );
        op(
            "post",
            "/{id}/invite",
            "Resend account invitation",
            invitationResponseSchema,
        );
    }
    records(
        "Vehicles",
        "/api/buses",
        school,
        vehicleSchema,
        vehicleQuery,
        vehicleBody,
        vehiclePatch,
    );
    records(
        "Stops",
        "/api/bus-stops",
        school,
        stopSchema,
        stopQuery,
        stopBody,
        stopPatch,
    );
    const drivers = records(
        "Drivers",
        "/api/drivers",
        school,
        driverSchema,
        driverQuery,
        driverBody,
        driverPatch,
    );
    drivers(
        "post",
        "/onboarding",
        "Onboard driver",
        invitationResponseSchema.extend({ driver: driverSchema }),
        { body: driverOnboarding, status: 201 },
    );
    const students = records(
        "Students",
        "/api/students",
        school,
        studentSchema,
        studentQuery,
        studentBody,
        studentPatch,
        studentDetailSchema,
    );
    students("post", "/{id}/guardians", "Link guardian", guardianSchema, {
        body: guardianBody,
        status: 201,
    });
    students(
        "post",
        "/{id}/guardians/{linkId}/close",
        "Close guardian link",
        guardianSchema,
        { body: reasonBody },
    );
    students("post", "/{id}/cards", "Assign card", cardSchema, {
        body: cardBody,
        status: 201,
    });
    students("post", "/{id}/cards/{cardId}/revoke", "Revoke card", cardSchema, {
        body: reasonBody,
    });
    function versioned(
        tag: string,
        path: string,
        row: z.ZodType,
        query: z.ZodType,
        body: z.ZodType,
    ) {
        const op = group(tag, path, school);
        op("get", "", "List " + tag.toLowerCase(), pageResponseSchema(row), {
            query,
        });
        op("get", "/{id}", "Read version", row);
        op("post", "", "Create version", row, { body, status: 201 });
        op("put", "/{id}", "Update version", row, { body });
        op("post", "/{id}/versions", "Create revision", row, {
            body,
            status: 201,
        });
        return op;
    }
    const plans = versioned(
        "Route plans",
        "/api/route-plans",
        planSchema,
        planQuery,
        planBody,
    );
    plans("post", "/{id}/approve", "Approve route plan", planSchema, {
        body: planApprovalBody,
    });
    const schedules = versioned(
        "Schedules",
        "/api/recurring-schedules",
        scheduleSchema,
        scheduleQuery,
        scheduleBody,
    );
    schedules("post", "/{id}/activate", "Activate schedule", scheduleSchema);
    schedules(
        "post",
        "/{id}/deactivate",
        "Deactivate schedule",
        scheduleSchema,
    );
    const trips = group("Trips", "/api/bus-trips", school);
    trips("get", "", "List trips", pageResponseSchema(tripSchema), {
        query: tripQuery,
    });
    trips("get", "/{id}", "Read trip", tripDetailSchema);
    trips("post", "", "Prepare trip", tripDetailSchema, {
        body: tripBody,
        status: 201,
    });
    trips("patch", "/{id}", "Update trip", tripDetailSchema, {
        body: tripPatch,
    });
    trips("post", "/{id}/cancel", "Cancel trip", tripDetailSchema, {
        body: cancelBody,
    });
    const examples = transportExamples();
    group("Service registrations", "/api/service-registrations", [
        "SCHOOL_ADMIN",
        "PARENT",
    ])(
        "get",
        "",
        "List service registrations (fixture)",
        pageResponseSchema(registration),
        {
            query: listQuerySchema.pick({ page: true, limit: true }),
            note: "Parents see registrations for their linked students.",
            fixtureExamples: examples.registrations,
        },
    );
    group("Trips", "/api/bus-trips", ["SCHOOL_ADMIN", "assigned DRIVER"])(
        "get",
        "/{tripId}/passengers",
        "Read trip passenger manifest (fixture)",
        manifest,
        {
            fixtureExamples: examples.manifests,
        },
    );
    const ops = group("Service", "", []);
    ops("get", "/", "Service greeting", z.string(), { media: "text/html" });
    ops(
        "get",
        "/healthz",
        "Check liveness",
        z.object({ status: z.literal("ok") }),
    );
    const check = z.enum(["ok", "fail"]);
    ops(
        "get",
        "/readyz",
        "Check readiness",
        z.object({
            status: check,
            checks: z.object({
                db: check,
                redis: z.enum(["ok", "fail", "disabled"]),
            }),
        }),
    );
    ops("get", "/metrics", "Read internal Prometheus metrics", z.string(), {
        media: "text/plain",
        note: "Direct backend access only.",
    });
    return {
        openapi: "3.1.0",
        info: {
            title: "GuardianWay API",
            version: "1.0.0",
            description:
                "Sign in with web login to use same-origin session cookies, or enter a mobile access token under Authorize.",
        },
        servers: [{ url: "/" }],
        paths,
        components: {
            schemas: { Problem: jsonSchema(problemSchema, "output") },
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
                sessionCookie: {
                    type: "apiKey",
                    in: "cookie",
                    name: ACCESS_COOKIE_NAME,
                },
                refreshCookie: {
                    type: "apiKey",
                    in: "cookie",
                    name: REFRESH_COOKIE_NAME,
                },
            },
        },
    };
}
