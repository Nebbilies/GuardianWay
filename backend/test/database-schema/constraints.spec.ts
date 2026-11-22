import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { Client } from "pg";
import { clone, data, randomUUID, schoolB } from "./fixtures";

describe("schema-next data integrity", () => {
    let db: Client;
    beforeAll(async () => {
        db = new Client({ connectionString: inject("schemaDatabaseUrl") });
        await db.connect();
    });
    afterAll(async () => {
        await db?.end();
    });

    it("rejects duplicate live student codes but allows them in a different school", async () => {
        await expect(
            clone(db, "student", data("student").id),
        ).rejects.toMatchObject({ code: "23505" });
        await expect(
            clone(db, "student", data("student").id, { school_id: schoolB }),
        ).resolves.toMatchObject({ school_id: schoolB });
    });

    it("releases student codes only on soft delete, not INACTIVE", async () => {
        const code = `HS_${randomUUID()}`;
        const row = await clone(db, "student", data("student").id, {
            student_code: code,
            status: "INACTIVE",
        });
        await expect(
            clone(db, "student", data("student").id, { student_code: code }),
        ).rejects.toMatchObject({ code: "23505" });
        await db.query(
            "UPDATE student SET deleted_at=now(), updated_at=now() WHERE id=$1",
            [row.id],
        );
        await expect(
            clone(db, "student", data("student").id, { student_code: code }),
        ).resolves.toMatchObject({ student_code: code });
    });

    it("releases vehicle code and plate after soft deletion", async () => {
        const code = `XE_${randomUUID()}`;
        const row = await clone(db, "vehicle", data("vehicle").id, {
            code,
            plate_number: code,
        });
        await expect(
            clone(db, "vehicle", row.id, { code: `OTHER_${randomUUID()}` }),
        ).rejects.toMatchObject({ code: "23505" });
        await db.query(
            "UPDATE vehicle SET deleted_at=now(), updated_at=now() WHERE id=$1",
            [row.id],
        );
        await expect(
            clone(db, "vehicle", row.id, { deleted_at: null }),
        ).resolves.toMatchObject({ code });
    });

    it("does not release an email when its account is soft deleted", async () => {
        const row = await clone(db, "user_account", data("userAccount").id, {
            email: `deleted-${randomUUID()}@example.invalid`,
            deleted_at: new Date(),
        });
        await expect(
            clone(db, "user_account", row.id, { deleted_at: null }),
        ).rejects.toMatchObject({ code: "23505" });
    });

    it("rejects cross-school registration references", async () => {
        await expect(
            clone(db, "service_registration", data("serviceRegistration").id, {
                school_id: schoolB,
            }),
        ).rejects.toMatchObject({ code: "23503" });
    });

    it("allows platform accounts without a school and references them as actors", async () => {
        const account = await clone(
            db,
            "user_account",
            data("userAccount").id,
            {
                school_id: null,
                role: "PLATFORM_ADMIN",
                email: `platform-${randomUUID()}@example.invalid`,
            },
        );
        await expect(
            clone(db, "audit_log", data("auditLog").id, {
                school_id: null,
                actor_id: account.id,
            }),
        ).resolves.toMatchObject({ actor_id: account.id });
        // This tests FK shape only; platform authorization is a backend contract.
    });

    it("prevents assigning one student to two routes of the same plan", async () => {
        const route = await clone(
            db,
            "planned_route",
            data("plannedRoute").id,
            { route_code: `T_${randomUUID()}` },
        );
        const stop = await clone(db, "planned_stop", data("plannedStop").id, {
            route_id: route.id,
        });
        const passenger = data("plannedPassenger");
        await expect(
            clone(db, "planned_passenger", passenger.id, {
                route_id: route.id,
                planned_stop_id: stop.id,
            }),
        ).rejects.toMatchObject({ code: "23505" });
        const otherPlan = await clone(
            db,
            "plan_version",
            data("planVersion").id,
            { plan_key: randomUUID() },
        );
        const otherRoute = await clone(db, "planned_route", route.id, {
            plan_version_id: otherPlan.id,
        });
        await expect(
            clone(db, "planned_passenger", passenger.id, {
                plan_version_id: otherPlan.id,
                route_id: otherRoute.id,
            }),
        ).rejects.toMatchObject({
            code: "23503",
            constraint: "fk_planned_passenger_planned_stop_id",
        });
    });

    it("cannot bypass plan/student uniqueness by lying about route context", async () => {
        const plan = await clone(db, "plan_version", data("planVersion").id, {
            plan_key: randomUUID(),
        });
        await expect(
            clone(db, "planned_passenger", data("plannedPassenger").id, {
                plan_version_id: plan.id,
            }),
        ).rejects.toMatchObject({ code: "23503" });
    });

    it("prevents regenerating a trip through another version of its schedule", async () => {
        const schedule = await clone(
            db,
            "recurring_schedule",
            data("recurringSchedule").id,
            { version_no: 2 },
        );
        await expect(
            clone(db, "trip", data("trip").id, { schedule_id: schedule.id }),
        ).rejects.toMatchObject({ code: "23505" });
    });

    it("cannot bypass trip generation uniqueness with a fabricated schedule key", async () => {
        await expect(
            clone(db, "trip", data("trip").id, {
                schedule_key: randomUUID(),
                service_date: "2026-11-18",
            }),
        ).rejects.toMatchObject({ code: "23503" });
    });

    it("allows at most one open manifest version and rejects reversed intervals", async () => {
        await expect(
            clone(db, "trip_passenger", data("tripPassenger").id, {
                version_no: 2,
            }),
        ).rejects.toMatchObject({ code: "23505" });
        await expect(
            clone(db, "trip_passenger", data("tripPassenger").id, {
                version_no: 2,
                effective_to: "2026-11-15T00:00:00Z",
            }),
        ).rejects.toMatchObject({ code: "23514" });
    });

    it("allows one open GPS source per assignment", async () => {
        const session = await clone(
            db,
            "tracking_session",
            data("trackingSession").id,
            { effective_to: null, ended_at: null },
        );
        await expect(
            clone(db, "tracking_session", session.id),
        ).rejects.toMatchObject({ code: "23505" });
    });

    it("does not encode future status values as database enums", async () => {
        await expect(
            clone(db, "student", data("student").id, {
                student_code: `HS_${randomUUID()}`,
                status: "FUTURE_STATUS",
            }),
        ).resolves.toMatchObject({ status: "FUTURE_STATUS" });
    });

    it("requires exactly one typed notification origin", async () => {
        await expect(
            clone(db, "notification", data("notification").id, {
                occurrence_key: randomUUID(),
                origin_attendance_event_id: null,
            }),
        ).rejects.toMatchObject({ code: "23514" });
        await expect(
            clone(db, "notification", data("notification").id, {
                occurrence_key: randomUUID(),
                origin_trip_id: data("trip").id,
            }),
        ).rejects.toMatchObject({ code: "23514" });
        await expect(
            clone(db, "notification", data("notification").id, {
                occurrence_key: randomUUID(),
                origin_attendance_event_id: null,
                origin_trip_id: data("trip").id,
            }),
        ).resolves.toMatchObject({ origin_trip_id: data("trip").id });
    });

    it("rejects evidence without an event or transfer, and duplicate evidence", async () => {
        await expect(
            clone(
                db,
                "reconciliation_evidence",
                data("reconciliationEvidence").id,
                { attendance_event_id: null, attendance_revision_id: null },
            ),
        ).rejects.toMatchObject({ code: "23514" });
        await expect(
            clone(
                db,
                "reconciliation_evidence",
                data("reconciliationEvidence").id,
            ),
        ).rejects.toMatchObject({ code: "23505" });
    });

    it("prevents branching directly from the same attendance revision", async () => {
        const second = await clone(
            db,
            "attendance_revision",
            data("attendanceRevision").id,
            {
                revision_no: 2,
                previous_revision_id: data("attendanceRevision").id,
                operation_key: randomUUID(),
            },
        );
        await expect(
            clone(db, "attendance_revision", second.id, {
                revision_no: 3,
                operation_key: randomUUID(),
            }),
        ).rejects.toMatchObject({ code: "23505" });
    });

    it("rejects zero capacity and weekday outside ISO range", async () => {
        await expect(
            clone(db, "vehicle", data("vehicle").id, {
                code: randomUUID(),
                plate_number: randomUUID(),
                student_capacity: 0,
            }),
        ).rejects.toMatchObject({ code: "23514" });
        await expect(
            clone(db, "schedule_weekday", data("scheduleWeekday").id, {
                iso_weekday: 8,
            }),
        ).rejects.toMatchObject({ code: "23514" });
    });

    it("keeps vehicle history and blocks hard delete", async () => {
        await expect(
            db.query("DELETE FROM vehicle WHERE id=$1", [data("vehicle").id]),
        ).rejects.toMatchObject({ code: "23503" });
        const before = await db.query(
            "SELECT initial_vehicle_id FROM trip WHERE id=$1",
            [data("trip").id],
        );
        expect(before.rows[0].initial_vehicle_id).toBe(data("vehicle").id);
    });
});
