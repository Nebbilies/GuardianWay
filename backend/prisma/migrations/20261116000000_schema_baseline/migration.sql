-- Approved GuardianWay schema r1. Independent baseline; never apply to the application database.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE "school" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "timezone" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "pk_school" PRIMARY KEY ("id"),
    CONSTRAINT "uq_school_code" UNIQUE ("code")
 );


CREATE TABLE "school_policy_version" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "version_no" INTEGER NOT NULL,
    "previous_version_id" UUID,
    "effective_from" TIMESTAMPTZ(3) NOT NULL,
    "effective_to" TIMESTAMPTZ(3),
    "pickup_arrival_time" TIME(0),
    "dropoff_departure_time" TIME(0),
    "ride_warning_minutes" DOUBLE PRECISION,
    "pickup_wait_minutes" DOUBLE PRECISION,
    "gps_stale_seconds" INTEGER,
    "history_retention_days" INTEGER,
    "approved_by_id" UUID,
    "approved_at" TIMESTAMPTZ(3),
    "approval_basis" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_school_policy_version" PRIMARY KEY ("id"),
    CONSTRAINT "uq_school_policy_version_school_id_version_no" UNIQUE ("school_id", "version_no"),
    CONSTRAINT "uq_school_policy_version_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_school_policy_version_version_no" CHECK ("version_no" > 0),
    CONSTRAINT "ck_school_policy_version_ride_warning_minutes" CHECK ("ride_warning_minutes" >= 0 AND "ride_warning_minutes" < 'Infinity'::double precision),
    CONSTRAINT "ck_school_policy_version_pickup_wait_minutes" CHECK ("pickup_wait_minutes" >= 0 AND "pickup_wait_minutes" < 'Infinity'::double precision),
    CONSTRAINT "ck_school_policy_version_gps_stale_seconds" CHECK ("gps_stale_seconds" > 0),
    CONSTRAINT "ck_school_policy_version_history_retention_days" CHECK ("history_retention_days" > 0),
    CONSTRAINT "ck_school_policy_version_interval" CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from")
 );

CREATE INDEX "ix_school_policy_version_1" ON "school_policy_version" (school_id,effective_from);

CREATE TABLE "user_account" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "activated_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "pk_user_account" PRIMARY KEY ("id"),
    CONSTRAINT "uq_user_account_email" UNIQUE ("email"),
    CONSTRAINT "uq_user_account_school_id_id" UNIQUE ("school_id", "id")
 );

CREATE INDEX "ix_user_account_1" ON "user_account" (school_id,role,status);

CREATE TABLE "user_invite" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "invited_by_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "issued_at" TIMESTAMPTZ(3) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "accepted_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_user_invite" PRIMARY KEY ("id"),
    CONSTRAINT "uq_user_invite_token_hash" UNIQUE ("token_hash"),
    CONSTRAINT "uq_user_invite_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_user_invite_expiry" CHECK ("expires_at" > "issued_at")
 );

CREATE INDEX "ix_user_invite_1" ON "user_invite" (school_id,account_id,created_at DESC);

CREATE TABLE "refresh_token" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID,
    "account_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "user_agent" TEXT,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    CONSTRAINT "pk_refresh_token" PRIMARY KEY ("id"),
    CONSTRAINT "uq_refresh_token_token_hash" UNIQUE ("token_hash"),
    CONSTRAINT "uq_refresh_token_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_refresh_token_expiry" CHECK ("expires_at" > "created_at")
 );

CREATE INDEX "ix_refresh_token_1" ON "refresh_token" (account_id,revoked_at,expires_at);

CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID,
    "actor_id" UUID,
    "notification_id" UUID,
    "action" TEXT NOT NULL,
    "subject_kind" TEXT NOT NULL,
    "subject_reference" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "change_summary" JSONB NOT NULL,
    "operation_key" TEXT NOT NULL,
    CONSTRAINT "pk_audit_log" PRIMARY KEY ("id"),
    CONSTRAINT "uq_audit_log_school_id_id" UNIQUE ("school_id", "id")
 );

CREATE INDEX "ix_audit_log_1" ON "audit_log" (school_id,created_at DESC,id DESC);

CREATE TABLE "driver_profile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "account_id" UUID,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "pk_driver_profile" PRIMARY KEY ("id"),
    CONSTRAINT "uq_driver_profile_account_id" UNIQUE ("account_id"),
    CONSTRAINT "uq_driver_profile_school_id_id" UNIQUE ("school_id", "id")
 );

CREATE UNIQUE INDEX "ux_live_driver_profile_school_id_code" ON "driver_profile" ("school_id", "code") WHERE deleted_at IS NULL;
CREATE INDEX "ix_driver_profile_1" ON "driver_profile" (school_id,status) WHERE deleted_at IS NULL;

CREATE TABLE "vehicle" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "plate_number" TEXT NOT NULL,
    "student_capacity" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "pk_vehicle" PRIMARY KEY ("id"),
    CONSTRAINT "uq_vehicle_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_vehicle_student_capacity" CHECK ("student_capacity" > 0)
 );

CREATE UNIQUE INDEX "ux_live_vehicle_school_id_code" ON "vehicle" ("school_id", "code") WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX "ux_live_vehicle_school_id_plate_number" ON "vehicle" ("school_id", "plate_number") WHERE deleted_at IS NULL;
CREATE INDEX "ix_vehicle_1" ON "vehicle" (school_id,status) WHERE deleted_at IS NULL;

CREATE TABLE "student" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "student_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "class_label" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "pk_student" PRIMARY KEY ("id"),
    CONSTRAINT "uq_student_school_id_id" UNIQUE ("school_id", "id")
 );

CREATE UNIQUE INDEX "ux_live_student_school_id_student_code" ON "student" ("school_id", "student_code") WHERE deleted_at IS NULL;
CREATE INDEX "ix_student_1" ON "student" (school_id,class_label) WHERE deleted_at IS NULL;

CREATE TABLE "guardian_link" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "guardian_account_id" UUID NOT NULL,
    "relationship_label" TEXT,
    "can_track" BOOLEAN NOT NULL,
    "can_request" BOOLEAN NOT NULL,
    "confirmed_by_id" UUID NOT NULL,
    "effective_from" TIMESTAMPTZ(3) NOT NULL,
    "effective_to" TIMESTAMPTZ(3),
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_guardian_link" PRIMARY KEY ("id"),
    CONSTRAINT "uq_guardian_link_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_guardian_link_interval" CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from")
 );

CREATE UNIQUE INDEX "ux_open_guardian_link" ON "guardian_link" ("student_id", "guardian_account_id") WHERE effective_to IS NULL;
CREATE INDEX "ix_guardian_link_1" ON "guardian_link" (school_id,guardian_account_id,effective_from);

CREATE TABLE "student_card_assignment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "card_uid" TEXT NOT NULL,
    "technology" TEXT NOT NULL,
    "assigned_by_id" UUID NOT NULL,
    "effective_from" TIMESTAMPTZ(3) NOT NULL,
    "effective_to" TIMESTAMPTZ(3),
    "revoked_by_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_student_card_assignment" PRIMARY KEY ("id"),
    CONSTRAINT "uq_student_card_assignment_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_student_card_assignment_interval" CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from")
 );

CREATE UNIQUE INDEX "ux_open_student_card_assignment" ON "student_card_assignment" ("school_id", "technology", "card_uid") WHERE effective_to IS NULL;
CREATE INDEX "ix_student_card_assignment_1" ON "student_card_assignment" (school_id,technology,card_uid,effective_from);

CREATE TABLE "service_registration" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "submitted_by_id" UUID NOT NULL,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL,
    "status" TEXT NOT NULL,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "review_note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_service_registration" PRIMARY KEY ("id"),
    CONSTRAINT "uq_service_registration_school_id_id" UNIQUE ("school_id", "id")
 );

CREATE INDEX "ix_service_registration_1" ON "service_registration" (school_id,status,submitted_at DESC);
CREATE INDEX "ix_service_registration_2" ON "service_registration" (school_id,student_id,status);

CREATE TABLE "registration_day" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "service_date" DATE NOT NULL,
    "direction" TEXT NOT NULL,
    "requested_address" TEXT,
    "requested_stop_id" UUID,
    "approved_stop_id" UUID,
    "approval_stop_snapshot" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_registration_day" PRIMARY KEY ("id"),
    CONSTRAINT "uq_registration_day_registration_id_service_date_direction" UNIQUE ("registration_id", "service_date", "direction"),
    CONSTRAINT "uq_registration_day_school_id_id" UNIQUE ("school_id", "id")
 );

CREATE INDEX "ix_registration_day_1" ON "registration_day" (school_id,service_date,direction,registration_id);

CREATE TABLE "absence_request" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "registration_day_id" UUID NOT NULL,
    "trip_id" UUID,
    "submitted_by_id" UUID NOT NULL,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL,
    "processed_by_id" UUID,
    "processed_at" TIMESTAMPTZ(3),
    "resolution_note" TEXT,
    "applied_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_absence_request" PRIMARY KEY ("id"),
    CONSTRAINT "uq_absence_request_school_id_id" UNIQUE ("school_id", "id")
 );

CREATE INDEX "ix_absence_request_1" ON "absence_request" (school_id,registration_day_id,status);

CREATE TABLE "stop_change_request" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "registration_day_id" UUID NOT NULL,
    "trip_id" UUID,
    "from_stop_id" UUID NOT NULL,
    "requested_stop_id" UUID NOT NULL,
    "submitted_by_id" UUID NOT NULL,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "review_note" TEXT,
    "applied_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_stop_change_request" PRIMARY KEY ("id"),
    CONSTRAINT "uq_stop_change_request_school_id_id" UNIQUE ("school_id", "id")
 );

CREATE INDEX "ix_stop_change_request_1" ON "stop_change_request" (school_id,registration_day_id,status);

CREATE TABLE "stop" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "kind" TEXT NOT NULL,
    "allows_pickup" BOOLEAN NOT NULL,
    "allows_dropoff" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "access_note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),
    "location" geography(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("longitude","latitude"),4326)::geography) STORED NOT NULL,
    CONSTRAINT "pk_stop" PRIMARY KEY ("id"),
    CONSTRAINT "uq_stop_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_stop_latitude" CHECK ("latitude" BETWEEN -90 AND 90),
    CONSTRAINT "ck_stop_longitude" CHECK ("longitude" BETWEEN -180 AND 180)
 );

CREATE UNIQUE INDEX "ux_live_stop_school_id_code" ON "stop" ("school_id", "code") WHERE deleted_at IS NULL;
CREATE INDEX "ix_stop_1" ON "stop" (school_id,kind,status) WHERE deleted_at IS NULL;

CREATE TABLE "plan_version" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "plan_key" UUID NOT NULL,
    "version_no" INTEGER NOT NULL,
    "previous_version_id" UUID,
    "reference_date" DATE NOT NULL,
    "direction" TEXT NOT NULL,
    "policy_version_id" UUID NOT NULL,
    "input_snapshot" JSONB NOT NULL,
    "pickup_arrival_deadline" TIME(0),
    "dropoff_departure_time" TIME(0),
    "status" TEXT NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by_id" UUID,
    "approved_at" TIMESTAMPTZ(3),
    "effective_from" DATE,
    "effective_to" DATE,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_plan_version" PRIMARY KEY ("id"),
    CONSTRAINT "uq_plan_version_school_id_plan_key_version_no" UNIQUE ("school_id", "plan_key", "version_no"),
    CONSTRAINT "uq_plan_version_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_plan_version_version_no" CHECK ("version_no" > 0),
    CONSTRAINT "ck_plan_version_interval" CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from")
 );

CREATE INDEX "ix_plan_version_1" ON "plan_version" (school_id,status,reference_date);

CREATE TABLE "plan_demand" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "plan_version_id" UUID NOT NULL,
    "registration_day_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "stop_id" UUID NOT NULL,
    "demand_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_plan_demand" PRIMARY KEY ("id"),
    CONSTRAINT "uq_plan_demand_plan_version_id_registration_day_id" UNIQUE ("plan_version_id", "registration_day_id"),
    CONSTRAINT "uq_plan_demand_school_id_id" UNIQUE ("school_id", "id")
 );


CREATE TABLE "planned_route" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "plan_version_id" UUID NOT NULL,
    "route_code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "capacity_snapshot" INTEGER NOT NULL,
    "distance_metres" DOUBLE PRECISION NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_planned_route" PRIMARY KEY ("id"),
    CONSTRAINT "uq_planned_route_plan_version_id_route_code" UNIQUE ("plan_version_id", "route_code"),
    CONSTRAINT "uq_planned_route_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "uq_planned_route_school_id_plan_version_id_id" UNIQUE ("school_id", "plan_version_id", "id"),
    CONSTRAINT "ck_planned_route_capacity_snapshot" CHECK ("capacity_snapshot" > 0),
    CONSTRAINT "ck_planned_route_distance_metres" CHECK ("distance_metres" >= 0 AND "distance_metres" < 'Infinity'::double precision),
    CONSTRAINT "ck_planned_route_duration_seconds" CHECK ("duration_seconds" >= 0)
 );


CREATE TABLE "planned_stop" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "stop_id" UUID NOT NULL,
    "sequence_no" INTEGER NOT NULL,
    "planned_time" TIME(0) NOT NULL,
    "stop_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_planned_stop" PRIMARY KEY ("id"),
    CONSTRAINT "uq_planned_stop_route_id_sequence_no" UNIQUE ("route_id", "sequence_no"),
    CONSTRAINT "uq_planned_stop_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_planned_stop_sequence_no" CHECK ("sequence_no" > 0)
 );


CREATE TABLE "planned_passenger" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "planned_stop_id" UUID NOT NULL,
    "source_demand_id" UUID,
    "estimated_ride_seconds" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan_version_id" UUID NOT NULL,
    CONSTRAINT "pk_planned_passenger" PRIMARY KEY ("id"),
    CONSTRAINT "uq_planned_passenger_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "uq_planned_passenger_plan_version_id_student_id" UNIQUE ("plan_version_id", "student_id"),
    CONSTRAINT "ck_planned_passenger_estimated_ride_seconds" CHECK ("estimated_ride_seconds" >= 0)
 );


CREATE TABLE "plan_finding" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "plan_version_id" UUID NOT NULL,
    "route_id" UUID,
    "demand_id" UUID,
    "severity" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "measured_value" DOUBLE PRECISION,
    "limit_value" DOUBLE PRECISION,
    "unit" TEXT,
    "accepted_by_id" UUID,
    "accepted_at" TIMESTAMPTZ(3),
    "acceptance_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_plan_finding" PRIMARY KEY ("id"),
    CONSTRAINT "uq_plan_finding_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_plan_finding_measured_value" CHECK ("measured_value" >= 0 AND "measured_value" < 'Infinity'::double precision),
    CONSTRAINT "ck_plan_finding_limit_value" CHECK ("limit_value" >= 0 AND "limit_value" < 'Infinity'::double precision)
 );

CREATE INDEX "ix_plan_finding_1" ON "plan_finding" (school_id,plan_version_id,severity);

CREATE TABLE "recurring_schedule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "schedule_key" UUID NOT NULL,
    "version_no" INTEGER NOT NULL,
    "previous_schedule_id" UUID,
    "route_id" UUID NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "direction" TEXT NOT NULL,
    "planned_start_time" TIME(0) NOT NULL,
    "default_vehicle_id" UUID,
    "default_driver_id" UUID,
    "status" TEXT NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_recurring_schedule" PRIMARY KEY ("id"),
    CONSTRAINT "uq_recurring_schedule_school_id_schedule_key_version_no" UNIQUE ("school_id", "schedule_key", "version_no"),
    CONSTRAINT "uq_recurring_schedule_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "uq_recurring_schedule_school_id_schedule_key_id" UNIQUE ("school_id", "schedule_key", "id"),
    CONSTRAINT "ck_recurring_schedule_version_no" CHECK ("version_no" > 0),
    CONSTRAINT "ck_recurring_schedule_interval" CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from")
 );

CREATE INDEX "ix_recurring_schedule_1" ON "recurring_schedule" (school_id,status,effective_from,effective_to);

CREATE TABLE "schedule_weekday" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "iso_weekday" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_schedule_weekday" PRIMARY KEY ("id"),
    CONSTRAINT "uq_schedule_weekday_schedule_id_iso_weekday" UNIQUE ("schedule_id", "iso_weekday"),
    CONSTRAINT "uq_schedule_weekday_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_schedule_weekday_iso_weekday" CHECK ("iso_weekday" BETWEEN 1 AND 7)
 );


CREATE TABLE "trip" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "service_date" DATE NOT NULL,
    "direction" TEXT NOT NULL,
    "planned_start_at" TIMESTAMPTZ(3) NOT NULL,
    "initial_vehicle_id" UUID,
    "initial_driver_id" UUID,
    "operating_policy_id" UUID,
    "status" TEXT NOT NULL,
    "data_version" INTEGER NOT NULL,
    "started_at" TIMESTAMPTZ(3),
    "started_by_id" UUID,
    "school_departed_at" TIMESTAMPTZ(3),
    "departure_checked_version" INTEGER,
    "completed_at" TIMESTAMPTZ(3),
    "closed_reconciliation_id" UUID,
    "cancelled_at" TIMESTAMPTZ(3),
    "cancelled_by_id" UUID,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schedule_key" UUID NOT NULL,
    CONSTRAINT "pk_trip" PRIMARY KEY ("id"),
    CONSTRAINT "uq_trip_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "uq_trip_school_id_schedule_key_service_date_direction" UNIQUE ("school_id", "schedule_key", "service_date", "direction"),
    CONSTRAINT "ck_trip_data_version" CHECK ("data_version" >= 0),
    CONSTRAINT "ck_trip_departure_checked_version" CHECK ("departure_checked_version" >= 0)
 );

CREATE INDEX "ix_trip_1" ON "trip" (school_id,service_date,status);

CREATE TABLE "trip_stop" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "logical_stop_key" UUID NOT NULL,
    "version_no" INTEGER NOT NULL,
    "previous_stop_id" UUID,
    "planned_stop_id" UUID,
    "stop_id" UUID NOT NULL,
    "sequence_no" INTEGER NOT NULL,
    "planned_at" TIMESTAMPTZ(3) NOT NULL,
    "stop_snapshot" JSONB NOT NULL,
    "effective_from" TIMESTAMPTZ(3) NOT NULL,
    "effective_to" TIMESTAMPTZ(3),
    "change_request_id" UUID,
    "changed_by_id" UUID NOT NULL,
    "change_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_trip_stop" PRIMARY KEY ("id"),
    CONSTRAINT "uq_trip_stop_trip_id_logical_stop_key_version_no" UNIQUE ("trip_id", "logical_stop_key", "version_no"),
    CONSTRAINT "uq_trip_stop_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_trip_stop_version_no" CHECK ("version_no" > 0),
    CONSTRAINT "ck_trip_stop_sequence_no" CHECK ("sequence_no" > 0),
    CONSTRAINT "ck_trip_stop_interval" CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from")
 );

CREATE UNIQUE INDEX "ux_open_trip_stop" ON "trip_stop" ("trip_id", "logical_stop_key") WHERE effective_to IS NULL;
CREATE INDEX "ix_trip_stop_1" ON "trip_stop" (school_id,trip_id,sequence_no) WHERE effective_to IS NULL;

CREATE TABLE "trip_passenger" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "version_no" INTEGER NOT NULL,
    "previous_passenger_id" UUID,
    "registration_day_id" UUID NOT NULL,
    "planned_passenger_id" UUID,
    "trip_stop_id" UUID NOT NULL,
    "disposition" TEXT NOT NULL,
    "absence_request_id" UUID,
    "stop_change_request_id" UUID,
    "effective_from" TIMESTAMPTZ(3) NOT NULL,
    "effective_to" TIMESTAMPTZ(3),
    "changed_by_id" UUID,
    "change_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_trip_passenger" PRIMARY KEY ("id"),
    CONSTRAINT "uq_trip_passenger_trip_id_student_id_version_no" UNIQUE ("trip_id", "student_id", "version_no"),
    CONSTRAINT "uq_trip_passenger_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_trip_passenger_version_no" CHECK ("version_no" > 0),
    CONSTRAINT "ck_trip_passenger_interval" CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from")
 );

CREATE UNIQUE INDEX "ux_open_trip_passenger" ON "trip_passenger" ("trip_id", "student_id") WHERE effective_to IS NULL;
CREATE INDEX "ix_trip_passenger_1" ON "trip_passenger" (school_id,trip_id,student_id,effective_from);

CREATE TABLE "trip_assignment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "previous_assignment_id" UUID,
    "effective_from" TIMESTAMPTZ(3) NOT NULL,
    "effective_to" TIMESTAMPTZ(3),
    "assigned_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_trip_assignment" PRIMARY KEY ("id"),
    CONSTRAINT "uq_trip_assignment_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_trip_assignment_interval" CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from")
 );

CREATE UNIQUE INDEX "ux_open_trip_assignment" ON "trip_assignment" ("trip_id") WHERE effective_to IS NULL;
CREATE INDEX "ix_trip_assignment_1" ON "trip_assignment" (school_id,trip_id,effective_from);
CREATE INDEX "ix_trip_assignment_2" ON "trip_assignment" (school_id,driver_id,effective_from);
CREATE INDEX "ix_trip_assignment_3" ON "trip_assignment" (school_id,vehicle_id,effective_from);

CREATE TABLE "student_transfer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "from_assignment_id" UUID NOT NULL,
    "to_assignment_id" UUID NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_by_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "operation_key" TEXT NOT NULL,
    CONSTRAINT "pk_student_transfer" PRIMARY KEY ("id"),
    CONSTRAINT "uq_student_transfer_school_id_operation_key" UNIQUE ("school_id", "operation_key"),
    CONSTRAINT "uq_student_transfer_school_id_id" UNIQUE ("school_id", "id")
 );

CREATE INDEX "ix_student_transfer_1" ON "student_transfer" (school_id,from_assignment_id,occurred_at);
CREATE INDEX "ix_student_transfer_2" ON "student_transfer" (school_id,to_assignment_id,occurred_at);

CREATE TABLE "attendance_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "trip_passenger_id" UUID,
    "trip_stop_id" UUID,
    "card_assignment_id" UUID,
    "event_kind" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "source_reference" TEXT,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_id" UUID NOT NULL,
    "reason" TEXT,
    "outside_manifest" BOOLEAN NOT NULL,
    "operation_key" TEXT NOT NULL,
    "related_event_id" UUID,
    CONSTRAINT "pk_attendance_event" PRIMARY KEY ("id"),
    CONSTRAINT "uq_attendance_event_school_id_operation_key" UNIQUE ("school_id", "operation_key"),
    CONSTRAINT "uq_attendance_event_school_id_id" UNIQUE ("school_id", "id")
 );

CREATE INDEX "ix_attendance_event_1" ON "attendance_event" (school_id,trip_id,student_id,occurred_at,id);

CREATE TABLE "attendance_revision" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "attendance_event_id" UUID NOT NULL,
    "previous_revision_id" UUID,
    "revision_no" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "effective_student_id" UUID,
    "effective_assignment_id" UUID,
    "effective_trip_stop_id" UUID,
    "effective_event_kind" TEXT,
    "effective_occurred_at" TIMESTAMPTZ(3),
    "corrected_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "operation_key" TEXT NOT NULL,
    CONSTRAINT "pk_attendance_revision" PRIMARY KEY ("id"),
    CONSTRAINT "uq_attendance_revision_attendance_event_id_revision_no" UNIQUE ("attendance_event_id", "revision_no"),
    CONSTRAINT "uq_attendance_revision_school_id_operation_key" UNIQUE ("school_id", "operation_key"),
    CONSTRAINT "uq_attendance_revision_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_attendance_revision_revision_no" CHECK ("revision_no" > 0)
 );

CREATE UNIQUE INDEX "ux_previous_attendance_revision" ON "attendance_revision" ("previous_revision_id") WHERE "previous_revision_id" IS NOT NULL;

CREATE TABLE "student_trip_resolution" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "trip_passenger_id" UUID,
    "kind" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "attendance_event_id" UUID,
    "absence_request_id" UUID,
    "previous_resolution_id" UUID,
    "case_key" UUID NOT NULL,
    "revision_no" INTEGER NOT NULL,
    "opened_at" TIMESTAMPTZ(3) NOT NULL,
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMPTZ(3),
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_student_trip_resolution" PRIMARY KEY ("id"),
    CONSTRAINT "uq_student_trip_resolution_trip_id_case_key_revision_no" UNIQUE ("trip_id", "case_key", "revision_no"),
    CONSTRAINT "uq_student_trip_resolution_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_student_trip_resolution_revision_no" CHECK ("revision_no" > 0)
 );

CREATE UNIQUE INDEX "ux_previous_student_trip_resolution" ON "student_trip_resolution" ("previous_resolution_id") WHERE "previous_resolution_id" IS NOT NULL;
CREATE INDEX "ix_student_trip_resolution_1" ON "student_trip_resolution" (school_id,trip_id,student_id,opened_at);

CREATE TABLE "trip_reconciliation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "evaluated_data_version" INTEGER NOT NULL,
    "evaluated_at" TIMESTAMPTZ(3) NOT NULL,
    "performed_by_id" UUID NOT NULL,
    "result" TEXT NOT NULL,
    "vehicle_check_confirmed_at" TIMESTAMPTZ(3),
    "vehicle_check_by_id" UUID,
    "vehicle_check_scope" JSONB,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_trip_reconciliation" PRIMARY KEY ("id"),
    CONSTRAINT "uq_trip_reconciliation_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_trip_reconciliation_evaluated_data_version" CHECK ("evaluated_data_version" >= 0)
 );

CREATE INDEX "ix_trip_reconciliation_1" ON "trip_reconciliation" (school_id,trip_id,evaluated_at DESC);

CREATE TABLE "reconciliation_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "reconciliation_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "trip_passenger_id" UUID,
    "result" TEXT NOT NULL,
    "finding_note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_reconciliation_item" PRIMARY KEY ("id"),
    CONSTRAINT "uq_reconciliation_item_reconciliation_id_student_id" UNIQUE ("reconciliation_id", "student_id"),
    CONSTRAINT "uq_reconciliation_item_school_id_id" UNIQUE ("school_id", "id")
 );


CREATE TABLE "tracking_session" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "source_account_id" UUID NOT NULL,
    "source_device_key" TEXT NOT NULL,
    "effective_from" TIMESTAMPTZ(3) NOT NULL,
    "effective_to" TIMESTAMPTZ(3),
    "started_at" TIMESTAMPTZ(3) NOT NULL,
    "ended_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_tracking_session" PRIMARY KEY ("id"),
    CONSTRAINT "uq_tracking_session_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_tracking_session_interval" CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from"),
    CONSTRAINT "ck_tracking_session_ended" CHECK ("ended_at" IS NULL OR "ended_at" >= "started_at")
 );

CREATE UNIQUE INDEX "ux_open_tracking_session" ON "tracking_session" ("assignment_id") WHERE effective_to IS NULL;
CREATE INDEX "ix_tracking_session_1" ON "tracking_session" (school_id,assignment_id,effective_from);

CREATE TABLE "gps_position" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "tracking_session_id" UUID NOT NULL,
    "measured_at" TIMESTAMPTZ(3) NOT NULL,
    "received_at" TIMESTAMPTZ(3) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy_metres" DOUBLE PRECISION,
    "source_message_key" TEXT NOT NULL,
    "quality_status" TEXT NOT NULL,
    "quality_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" geography(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("longitude","latitude"),4326)::geography) STORED NOT NULL,
    CONSTRAINT "pk_gps_position" PRIMARY KEY ("measured_at", "id"),
    CONSTRAINT "ck_gps_position_latitude" CHECK ("latitude" BETWEEN -90 AND 90),
    CONSTRAINT "ck_gps_position_longitude" CHECK ("longitude" BETWEEN -180 AND 180),
    CONSTRAINT "ck_gps_position_accuracy_metres" CHECK ("accuracy_metres" >= 0 AND "accuracy_metres" < 'Infinity'::double precision)
 );

CREATE INDEX "ix_gps_position_1" ON "gps_position" (school_id,tracking_session_id,measured_at DESC,id DESC);

CREATE TABLE "notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "navigation_kind" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_kind" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "actor_id" UUID,
    "context_trip_id" UUID,
    "context_student_id" UUID,
    "occurrence_key" TEXT NOT NULL,
    "action_snapshot" JSONB NOT NULL,
    "origin_attendance_event_id" UUID,
    "origin_attendance_revision_id" UUID,
    "origin_resolution_id" UUID,
    "origin_assignment_id" UUID,
    "origin_transfer_id" UUID,
    "origin_reconciliation_id" UUID,
    "origin_registration_id" UUID,
    "origin_absence_request_id" UUID,
    "origin_stop_change_request_id" UUID,
    "origin_plan_version_id" UUID,
    "origin_trip_id" UUID,
    "origin_tracking_session_id" UUID,
    CONSTRAINT "pk_notification" PRIMARY KEY ("id"),
    CONSTRAINT "uq_notification_school_id_occurrence_key" UNIQUE ("school_id", "occurrence_key"),
    CONSTRAINT "uq_notification_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_notification_one_origin" CHECK (num_nonnulls("origin_attendance_event_id", "origin_attendance_revision_id", "origin_resolution_id", "origin_assignment_id", "origin_transfer_id", "origin_reconciliation_id", "origin_registration_id", "origin_absence_request_id", "origin_stop_change_request_id", "origin_plan_version_id", "origin_trip_id", "origin_tracking_session_id") = 1)
 );

CREATE INDEX "ix_notification_1" ON "notification" (school_id,context_trip_id,occurred_at);

CREATE TABLE "notification_recipient" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "notification_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_notification_recipient" PRIMARY KEY ("id"),
    CONSTRAINT "uq_notification_recipient_notification_id_account_id" UNIQUE ("notification_id", "account_id"),
    CONSTRAINT "uq_notification_recipient_school_id_id" UNIQUE ("school_id", "id")
 );

CREATE INDEX "ix_notification_recipient_1" ON "notification_recipient" (school_id,account_id,created_at DESC,id DESC);
CREATE INDEX "ix_notification_recipient_2" ON "notification_recipient" (school_id,account_id,created_at DESC,id DESC) WHERE read_at IS NULL;

CREATE TABLE "push_endpoint" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "device_key" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "token_protected" TEXT NOT NULL,
    "effective_from" TIMESTAMPTZ(3) NOT NULL,
    "effective_to" TIMESTAMPTZ(3),
    "revocation_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_push_endpoint" PRIMARY KEY ("id"),
    CONSTRAINT "uq_push_endpoint_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_push_endpoint_interval" CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from")
 );

CREATE INDEX "ix_push_endpoint_1" ON "push_endpoint" (school_id,account_id,device_key) WHERE effective_to IS NULL;

CREATE TABLE "push_delivery" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "endpoint_id" UUID NOT NULL,
    "attempt_no" INTEGER NOT NULL,
    "attempted_at" TIMESTAMPTZ(3) NOT NULL,
    "status" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "responded_at" TIMESTAMPTZ(3),
    "error_code" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_push_delivery" PRIMARY KEY ("id"),
    CONSTRAINT "uq_push_delivery_recipient_id_endpoint_id_attempt_no" UNIQUE ("recipient_id", "endpoint_id", "attempt_no"),
    CONSTRAINT "uq_push_delivery_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_push_delivery_attempt_no" CHECK ("attempt_no" > 0)
 );


CREATE TABLE "reconciliation_evidence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "attendance_event_id" UUID,
    "attendance_revision_id" UUID,
    "transfer_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_reconciliation_evidence" PRIMARY KEY ("id"),
    CONSTRAINT "uq_reconciliation_evidence_school_id_id" UNIQUE ("school_id", "id"),
    CONSTRAINT "ck_reconciliation_evidence_shape" CHECK (("attendance_event_id" IS NOT NULL AND "transfer_id" IS NULL) OR ("transfer_id" IS NOT NULL AND "attendance_event_id" IS NULL AND "attendance_revision_id" IS NULL))
 );

CREATE UNIQUE INDEX "ux_evidence_attendance_event_id" ON "reconciliation_evidence" (item_id,attendance_event_id) WHERE attendance_event_id IS NOT NULL AND attendance_revision_id IS NULL;
CREATE UNIQUE INDEX "ux_evidence_attendance_revision_id" ON "reconciliation_evidence" (item_id,attendance_revision_id) WHERE attendance_revision_id IS NOT NULL;
CREATE UNIQUE INDEX "ux_evidence_transfer_id" ON "reconciliation_evidence" (item_id,transfer_id) WHERE transfer_id IS NOT NULL;

ALTER TABLE "school_policy_version" ADD CONSTRAINT "fk_school_policy_version_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "school_policy_version" ADD CONSTRAINT "fk_school_policy_version_previous_version_id" FOREIGN KEY ("school_id", "previous_version_id") REFERENCES "school_policy_version" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "school_policy_version" ADD CONSTRAINT "fk_school_policy_version_approved_by_id" FOREIGN KEY ("approved_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "user_account" ADD CONSTRAINT "fk_user_account_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "user_invite" ADD CONSTRAINT "fk_user_invite_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "user_invite" ADD CONSTRAINT "fk_user_invite_account_id" FOREIGN KEY ("school_id", "account_id") REFERENCES "user_account" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "user_invite" ADD CONSTRAINT "fk_user_invite_invited_by_id" FOREIGN KEY ("invited_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "refresh_token" ADD CONSTRAINT "fk_refresh_token_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "refresh_token" ADD CONSTRAINT "fk_refresh_token_account_id" FOREIGN KEY ("account_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "audit_log" ADD CONSTRAINT "fk_audit_log_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "audit_log" ADD CONSTRAINT "fk_audit_log_actor_id" FOREIGN KEY ("actor_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "audit_log" ADD CONSTRAINT "fk_audit_log_notification_id" FOREIGN KEY ("notification_id") REFERENCES "notification" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "driver_profile" ADD CONSTRAINT "fk_driver_profile_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "driver_profile" ADD CONSTRAINT "fk_driver_profile_account_id" FOREIGN KEY ("school_id", "account_id") REFERENCES "user_account" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "vehicle" ADD CONSTRAINT "fk_vehicle_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student" ADD CONSTRAINT "fk_student_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "guardian_link" ADD CONSTRAINT "fk_guardian_link_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "guardian_link" ADD CONSTRAINT "fk_guardian_link_student_id" FOREIGN KEY ("school_id", "student_id") REFERENCES "student" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "guardian_link" ADD CONSTRAINT "fk_guardian_link_guardian_account_id" FOREIGN KEY ("school_id", "guardian_account_id") REFERENCES "user_account" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "guardian_link" ADD CONSTRAINT "fk_guardian_link_confirmed_by_id" FOREIGN KEY ("confirmed_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_card_assignment" ADD CONSTRAINT "fk_student_card_assignment_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_card_assignment" ADD CONSTRAINT "fk_student_card_assignment_student_id" FOREIGN KEY ("school_id", "student_id") REFERENCES "student" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_card_assignment" ADD CONSTRAINT "fk_student_card_assignment_assigned_by_id" FOREIGN KEY ("assigned_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_card_assignment" ADD CONSTRAINT "fk_student_card_assignment_revoked_by_id" FOREIGN KEY ("revoked_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "service_registration" ADD CONSTRAINT "fk_service_registration_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "service_registration" ADD CONSTRAINT "fk_service_registration_student_id" FOREIGN KEY ("school_id", "student_id") REFERENCES "student" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "service_registration" ADD CONSTRAINT "fk_service_registration_submitted_by_id" FOREIGN KEY ("submitted_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "service_registration" ADD CONSTRAINT "fk_service_registration_reviewed_by_id" FOREIGN KEY ("reviewed_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "registration_day" ADD CONSTRAINT "fk_registration_day_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "registration_day" ADD CONSTRAINT "fk_registration_day_registration_id" FOREIGN KEY ("school_id", "registration_id") REFERENCES "service_registration" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "registration_day" ADD CONSTRAINT "fk_registration_day_requested_stop_id" FOREIGN KEY ("school_id", "requested_stop_id") REFERENCES "stop" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "registration_day" ADD CONSTRAINT "fk_registration_day_approved_stop_id" FOREIGN KEY ("school_id", "approved_stop_id") REFERENCES "stop" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "absence_request" ADD CONSTRAINT "fk_absence_request_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "absence_request" ADD CONSTRAINT "fk_absence_request_registration_day_id" FOREIGN KEY ("school_id", "registration_day_id") REFERENCES "registration_day" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "absence_request" ADD CONSTRAINT "fk_absence_request_trip_id" FOREIGN KEY ("school_id", "trip_id") REFERENCES "trip" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "absence_request" ADD CONSTRAINT "fk_absence_request_submitted_by_id" FOREIGN KEY ("submitted_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "absence_request" ADD CONSTRAINT "fk_absence_request_processed_by_id" FOREIGN KEY ("processed_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "stop_change_request" ADD CONSTRAINT "fk_stop_change_request_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "stop_change_request" ADD CONSTRAINT "fk_stop_change_request_registration_day_id" FOREIGN KEY ("school_id", "registration_day_id") REFERENCES "registration_day" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "stop_change_request" ADD CONSTRAINT "fk_stop_change_request_trip_id" FOREIGN KEY ("school_id", "trip_id") REFERENCES "trip" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "stop_change_request" ADD CONSTRAINT "fk_stop_change_request_from_stop_id" FOREIGN KEY ("school_id", "from_stop_id") REFERENCES "stop" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "stop_change_request" ADD CONSTRAINT "fk_stop_change_request_requested_stop_id" FOREIGN KEY ("school_id", "requested_stop_id") REFERENCES "stop" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "stop_change_request" ADD CONSTRAINT "fk_stop_change_request_submitted_by_id" FOREIGN KEY ("submitted_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "stop_change_request" ADD CONSTRAINT "fk_stop_change_request_reviewed_by_id" FOREIGN KEY ("reviewed_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "stop" ADD CONSTRAINT "fk_stop_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "plan_version" ADD CONSTRAINT "fk_plan_version_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "plan_version" ADD CONSTRAINT "fk_plan_version_previous_version_id" FOREIGN KEY ("school_id", "previous_version_id") REFERENCES "plan_version" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "plan_version" ADD CONSTRAINT "fk_plan_version_policy_version_id" FOREIGN KEY ("school_id", "policy_version_id") REFERENCES "school_policy_version" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "plan_version" ADD CONSTRAINT "fk_plan_version_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "plan_version" ADD CONSTRAINT "fk_plan_version_approved_by_id" FOREIGN KEY ("approved_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "plan_demand" ADD CONSTRAINT "fk_plan_demand_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "plan_demand" ADD CONSTRAINT "fk_plan_demand_plan_version_id" FOREIGN KEY ("school_id", "plan_version_id") REFERENCES "plan_version" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "plan_demand" ADD CONSTRAINT "fk_plan_demand_registration_day_id" FOREIGN KEY ("school_id", "registration_day_id") REFERENCES "registration_day" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "plan_demand" ADD CONSTRAINT "fk_plan_demand_student_id" FOREIGN KEY ("school_id", "student_id") REFERENCES "student" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "plan_demand" ADD CONSTRAINT "fk_plan_demand_stop_id" FOREIGN KEY ("school_id", "stop_id") REFERENCES "stop" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "planned_route" ADD CONSTRAINT "fk_planned_route_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "planned_route" ADD CONSTRAINT "fk_planned_route_plan_version_id" FOREIGN KEY ("school_id", "plan_version_id") REFERENCES "plan_version" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "planned_route" ADD CONSTRAINT "fk_planned_route_vehicle_id" FOREIGN KEY ("school_id", "vehicle_id") REFERENCES "vehicle" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "planned_stop" ADD CONSTRAINT "fk_planned_stop_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "planned_stop" ADD CONSTRAINT "fk_planned_stop_route_id" FOREIGN KEY ("school_id", "route_id") REFERENCES "planned_route" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "planned_stop" ADD CONSTRAINT "fk_planned_stop_stop_id" FOREIGN KEY ("school_id", "stop_id") REFERENCES "stop" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "planned_passenger" ADD CONSTRAINT "fk_planned_passenger_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "planned_passenger" ADD CONSTRAINT "fk_planned_passenger_route_id" FOREIGN KEY ("school_id", "plan_version_id", "route_id") REFERENCES "planned_route" ("school_id", "plan_version_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "planned_passenger" ADD CONSTRAINT "fk_planned_passenger_student_id" FOREIGN KEY ("school_id", "student_id") REFERENCES "student" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "planned_passenger" ADD CONSTRAINT "fk_planned_passenger_planned_stop_id" FOREIGN KEY ("school_id", "planned_stop_id") REFERENCES "planned_stop" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "planned_passenger" ADD CONSTRAINT "fk_planned_passenger_source_demand_id" FOREIGN KEY ("school_id", "source_demand_id") REFERENCES "plan_demand" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "planned_passenger" ADD CONSTRAINT "fk_planned_passenger_plan_version_id" FOREIGN KEY ("school_id", "plan_version_id") REFERENCES "plan_version" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "plan_finding" ADD CONSTRAINT "fk_plan_finding_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "plan_finding" ADD CONSTRAINT "fk_plan_finding_plan_version_id" FOREIGN KEY ("school_id", "plan_version_id") REFERENCES "plan_version" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "plan_finding" ADD CONSTRAINT "fk_plan_finding_route_id" FOREIGN KEY ("school_id", "route_id") REFERENCES "planned_route" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "plan_finding" ADD CONSTRAINT "fk_plan_finding_demand_id" FOREIGN KEY ("school_id", "demand_id") REFERENCES "plan_demand" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "plan_finding" ADD CONSTRAINT "fk_plan_finding_accepted_by_id" FOREIGN KEY ("accepted_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "recurring_schedule" ADD CONSTRAINT "fk_recurring_schedule_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "recurring_schedule" ADD CONSTRAINT "fk_recurring_schedule_previous_schedule_id" FOREIGN KEY ("school_id", "previous_schedule_id") REFERENCES "recurring_schedule" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "recurring_schedule" ADD CONSTRAINT "fk_recurring_schedule_route_id" FOREIGN KEY ("school_id", "route_id") REFERENCES "planned_route" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "recurring_schedule" ADD CONSTRAINT "fk_recurring_schedule_default_vehicle_id" FOREIGN KEY ("school_id", "default_vehicle_id") REFERENCES "vehicle" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "recurring_schedule" ADD CONSTRAINT "fk_recurring_schedule_default_driver_id" FOREIGN KEY ("school_id", "default_driver_id") REFERENCES "driver_profile" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "recurring_schedule" ADD CONSTRAINT "fk_recurring_schedule_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "schedule_weekday" ADD CONSTRAINT "fk_schedule_weekday_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "schedule_weekday" ADD CONSTRAINT "fk_schedule_weekday_schedule_id" FOREIGN KEY ("school_id", "schedule_id") REFERENCES "recurring_schedule" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip" ADD CONSTRAINT "fk_trip_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip" ADD CONSTRAINT "fk_trip_schedule_id" FOREIGN KEY ("school_id", "schedule_key", "schedule_id") REFERENCES "recurring_schedule" ("school_id", "schedule_key", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip" ADD CONSTRAINT "fk_trip_initial_vehicle_id" FOREIGN KEY ("school_id", "initial_vehicle_id") REFERENCES "vehicle" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip" ADD CONSTRAINT "fk_trip_initial_driver_id" FOREIGN KEY ("school_id", "initial_driver_id") REFERENCES "driver_profile" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip" ADD CONSTRAINT "fk_trip_operating_policy_id" FOREIGN KEY ("school_id", "operating_policy_id") REFERENCES "school_policy_version" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip" ADD CONSTRAINT "fk_trip_started_by_id" FOREIGN KEY ("started_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip" ADD CONSTRAINT "fk_trip_closed_reconciliation_id" FOREIGN KEY ("school_id", "closed_reconciliation_id") REFERENCES "trip_reconciliation" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip" ADD CONSTRAINT "fk_trip_cancelled_by_id" FOREIGN KEY ("cancelled_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_stop" ADD CONSTRAINT "fk_trip_stop_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_stop" ADD CONSTRAINT "fk_trip_stop_trip_id" FOREIGN KEY ("school_id", "trip_id") REFERENCES "trip" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_stop" ADD CONSTRAINT "fk_trip_stop_previous_stop_id" FOREIGN KEY ("school_id", "previous_stop_id") REFERENCES "trip_stop" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_stop" ADD CONSTRAINT "fk_trip_stop_planned_stop_id" FOREIGN KEY ("school_id", "planned_stop_id") REFERENCES "planned_stop" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_stop" ADD CONSTRAINT "fk_trip_stop_stop_id" FOREIGN KEY ("school_id", "stop_id") REFERENCES "stop" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_stop" ADD CONSTRAINT "fk_trip_stop_change_request_id" FOREIGN KEY ("school_id", "change_request_id") REFERENCES "stop_change_request" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_stop" ADD CONSTRAINT "fk_trip_stop_changed_by_id" FOREIGN KEY ("changed_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_passenger" ADD CONSTRAINT "fk_trip_passenger_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_passenger" ADD CONSTRAINT "fk_trip_passenger_trip_id" FOREIGN KEY ("school_id", "trip_id") REFERENCES "trip" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_passenger" ADD CONSTRAINT "fk_trip_passenger_student_id" FOREIGN KEY ("school_id", "student_id") REFERENCES "student" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_passenger" ADD CONSTRAINT "fk_trip_passenger_previous_passenger_id" FOREIGN KEY ("school_id", "previous_passenger_id") REFERENCES "trip_passenger" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_passenger" ADD CONSTRAINT "fk_trip_passenger_registration_day_id" FOREIGN KEY ("school_id", "registration_day_id") REFERENCES "registration_day" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_passenger" ADD CONSTRAINT "fk_trip_passenger_planned_passenger_id" FOREIGN KEY ("school_id", "planned_passenger_id") REFERENCES "planned_passenger" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_passenger" ADD CONSTRAINT "fk_trip_passenger_trip_stop_id" FOREIGN KEY ("school_id", "trip_stop_id") REFERENCES "trip_stop" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_passenger" ADD CONSTRAINT "fk_trip_passenger_absence_request_id" FOREIGN KEY ("school_id", "absence_request_id") REFERENCES "absence_request" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_passenger" ADD CONSTRAINT "fk_trip_passenger_stop_change_request_id" FOREIGN KEY ("school_id", "stop_change_request_id") REFERENCES "stop_change_request" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_passenger" ADD CONSTRAINT "fk_trip_passenger_changed_by_id" FOREIGN KEY ("changed_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_assignment" ADD CONSTRAINT "fk_trip_assignment_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_assignment" ADD CONSTRAINT "fk_trip_assignment_trip_id" FOREIGN KEY ("school_id", "trip_id") REFERENCES "trip" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_assignment" ADD CONSTRAINT "fk_trip_assignment_vehicle_id" FOREIGN KEY ("school_id", "vehicle_id") REFERENCES "vehicle" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_assignment" ADD CONSTRAINT "fk_trip_assignment_driver_id" FOREIGN KEY ("school_id", "driver_id") REFERENCES "driver_profile" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_assignment" ADD CONSTRAINT "fk_trip_assignment_previous_assignment_id" FOREIGN KEY ("school_id", "previous_assignment_id") REFERENCES "trip_assignment" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_assignment" ADD CONSTRAINT "fk_trip_assignment_assigned_by_id" FOREIGN KEY ("assigned_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_transfer" ADD CONSTRAINT "fk_student_transfer_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_transfer" ADD CONSTRAINT "fk_student_transfer_student_id" FOREIGN KEY ("school_id", "student_id") REFERENCES "student" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_transfer" ADD CONSTRAINT "fk_student_transfer_from_assignment_id" FOREIGN KEY ("school_id", "from_assignment_id") REFERENCES "trip_assignment" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_transfer" ADD CONSTRAINT "fk_student_transfer_to_assignment_id" FOREIGN KEY ("school_id", "to_assignment_id") REFERENCES "trip_assignment" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_transfer" ADD CONSTRAINT "fk_student_transfer_confirmed_by_id" FOREIGN KEY ("confirmed_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "attendance_event" ADD CONSTRAINT "fk_attendance_event_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "attendance_event" ADD CONSTRAINT "fk_attendance_event_trip_id" FOREIGN KEY ("school_id", "trip_id") REFERENCES "trip" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "attendance_event" ADD CONSTRAINT "fk_attendance_event_student_id" FOREIGN KEY ("school_id", "student_id") REFERENCES "student" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "attendance_event" ADD CONSTRAINT "fk_attendance_event_assignment_id" FOREIGN KEY ("school_id", "assignment_id") REFERENCES "trip_assignment" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "attendance_event" ADD CONSTRAINT "fk_attendance_event_trip_passenger_id" FOREIGN KEY ("school_id", "trip_passenger_id") REFERENCES "trip_passenger" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "attendance_event" ADD CONSTRAINT "fk_attendance_event_trip_stop_id" FOREIGN KEY ("school_id", "trip_stop_id") REFERENCES "trip_stop" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "attendance_event" ADD CONSTRAINT "fk_attendance_event_card_assignment_id" FOREIGN KEY ("school_id", "card_assignment_id") REFERENCES "student_card_assignment" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "attendance_event" ADD CONSTRAINT "fk_attendance_event_recorded_by_id" FOREIGN KEY ("recorded_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "attendance_event" ADD CONSTRAINT "fk_attendance_event_related_event_id" FOREIGN KEY ("school_id", "related_event_id") REFERENCES "attendance_event" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "attendance_revision" ADD CONSTRAINT "fk_attendance_revision_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "attendance_revision" ADD CONSTRAINT "fk_attendance_revision_attendance_event_id" FOREIGN KEY ("school_id", "attendance_event_id") REFERENCES "attendance_event" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "attendance_revision" ADD CONSTRAINT "fk_attendance_revision_previous_revision_id" FOREIGN KEY ("school_id", "previous_revision_id") REFERENCES "attendance_revision" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "attendance_revision" ADD CONSTRAINT "fk_attendance_revision_effective_student_id" FOREIGN KEY ("school_id", "effective_student_id") REFERENCES "student" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "attendance_revision" ADD CONSTRAINT "fk_attendance_revision_effective_assignment_id" FOREIGN KEY ("school_id", "effective_assignment_id") REFERENCES "trip_assignment" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "attendance_revision" ADD CONSTRAINT "fk_attendance_revision_effective_trip_stop_id" FOREIGN KEY ("school_id", "effective_trip_stop_id") REFERENCES "trip_stop" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "attendance_revision" ADD CONSTRAINT "fk_attendance_revision_corrected_by_id" FOREIGN KEY ("corrected_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_trip_resolution" ADD CONSTRAINT "fk_student_trip_resolution_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_trip_resolution" ADD CONSTRAINT "fk_student_trip_resolution_trip_id" FOREIGN KEY ("school_id", "trip_id") REFERENCES "trip" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_trip_resolution" ADD CONSTRAINT "fk_student_trip_resolution_student_id" FOREIGN KEY ("school_id", "student_id") REFERENCES "student" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_trip_resolution" ADD CONSTRAINT "fk_student_trip_resolution_trip_passenger_id" FOREIGN KEY ("school_id", "trip_passenger_id") REFERENCES "trip_passenger" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_trip_resolution" ADD CONSTRAINT "fk_student_trip_resolution_attendance_event_id" FOREIGN KEY ("school_id", "attendance_event_id") REFERENCES "attendance_event" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_trip_resolution" ADD CONSTRAINT "fk_student_trip_resolution_absence_request_id" FOREIGN KEY ("school_id", "absence_request_id") REFERENCES "absence_request" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_trip_resolution" ADD CONSTRAINT "fk_student_trip_resolution_previous_resolution_id" FOREIGN KEY ("school_id", "previous_resolution_id") REFERENCES "student_trip_resolution" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "student_trip_resolution" ADD CONSTRAINT "fk_student_trip_resolution_resolved_by_id" FOREIGN KEY ("resolved_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_reconciliation" ADD CONSTRAINT "fk_trip_reconciliation_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_reconciliation" ADD CONSTRAINT "fk_trip_reconciliation_trip_id" FOREIGN KEY ("school_id", "trip_id") REFERENCES "trip" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_reconciliation" ADD CONSTRAINT "fk_trip_reconciliation_performed_by_id" FOREIGN KEY ("performed_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "trip_reconciliation" ADD CONSTRAINT "fk_trip_reconciliation_vehicle_check_by_id" FOREIGN KEY ("vehicle_check_by_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "reconciliation_item" ADD CONSTRAINT "fk_reconciliation_item_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "reconciliation_item" ADD CONSTRAINT "fk_reconciliation_item_reconciliation_id" FOREIGN KEY ("school_id", "reconciliation_id") REFERENCES "trip_reconciliation" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "reconciliation_item" ADD CONSTRAINT "fk_reconciliation_item_student_id" FOREIGN KEY ("school_id", "student_id") REFERENCES "student" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "reconciliation_item" ADD CONSTRAINT "fk_reconciliation_item_trip_passenger_id" FOREIGN KEY ("school_id", "trip_passenger_id") REFERENCES "trip_passenger" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "tracking_session" ADD CONSTRAINT "fk_tracking_session_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "tracking_session" ADD CONSTRAINT "fk_tracking_session_assignment_id" FOREIGN KEY ("school_id", "assignment_id") REFERENCES "trip_assignment" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "tracking_session" ADD CONSTRAINT "fk_tracking_session_source_account_id" FOREIGN KEY ("school_id", "source_account_id") REFERENCES "user_account" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "gps_position" ADD CONSTRAINT "fk_gps_position_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "gps_position" ADD CONSTRAINT "fk_gps_position_tracking_session_id" FOREIGN KEY ("school_id", "tracking_session_id") REFERENCES "tracking_session" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_actor_id" FOREIGN KEY ("actor_id") REFERENCES "user_account" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_context_trip_id" FOREIGN KEY ("school_id", "context_trip_id") REFERENCES "trip" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_context_student_id" FOREIGN KEY ("school_id", "context_student_id") REFERENCES "student" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_origin_attendance_event_id" FOREIGN KEY ("school_id", "origin_attendance_event_id") REFERENCES "attendance_event" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_origin_attendance_revision_id" FOREIGN KEY ("school_id", "origin_attendance_revision_id") REFERENCES "attendance_revision" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_origin_resolution_id" FOREIGN KEY ("school_id", "origin_resolution_id") REFERENCES "student_trip_resolution" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_origin_assignment_id" FOREIGN KEY ("school_id", "origin_assignment_id") REFERENCES "trip_assignment" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_origin_transfer_id" FOREIGN KEY ("school_id", "origin_transfer_id") REFERENCES "student_transfer" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_origin_reconciliation_id" FOREIGN KEY ("school_id", "origin_reconciliation_id") REFERENCES "trip_reconciliation" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_origin_registration_id" FOREIGN KEY ("school_id", "origin_registration_id") REFERENCES "service_registration" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_origin_absence_request_id" FOREIGN KEY ("school_id", "origin_absence_request_id") REFERENCES "absence_request" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_origin_stop_change_request_id" FOREIGN KEY ("school_id", "origin_stop_change_request_id") REFERENCES "stop_change_request" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_origin_plan_version_id" FOREIGN KEY ("school_id", "origin_plan_version_id") REFERENCES "plan_version" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_origin_trip_id" FOREIGN KEY ("school_id", "origin_trip_id") REFERENCES "trip" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_origin_tracking_session_id" FOREIGN KEY ("school_id", "origin_tracking_session_id") REFERENCES "tracking_session" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification_recipient" ADD CONSTRAINT "fk_notification_recipient_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification_recipient" ADD CONSTRAINT "fk_notification_recipient_notification_id" FOREIGN KEY ("school_id", "notification_id") REFERENCES "notification" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification_recipient" ADD CONSTRAINT "fk_notification_recipient_account_id" FOREIGN KEY ("school_id", "account_id") REFERENCES "user_account" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "push_endpoint" ADD CONSTRAINT "fk_push_endpoint_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "push_endpoint" ADD CONSTRAINT "fk_push_endpoint_account_id" FOREIGN KEY ("school_id", "account_id") REFERENCES "user_account" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "push_delivery" ADD CONSTRAINT "fk_push_delivery_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "push_delivery" ADD CONSTRAINT "fk_push_delivery_recipient_id" FOREIGN KEY ("school_id", "recipient_id") REFERENCES "notification_recipient" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "push_delivery" ADD CONSTRAINT "fk_push_delivery_endpoint_id" FOREIGN KEY ("school_id", "endpoint_id") REFERENCES "push_endpoint" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "reconciliation_evidence" ADD CONSTRAINT "fk_reconciliation_evidence_school_id" FOREIGN KEY ("school_id") REFERENCES "school" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "reconciliation_evidence" ADD CONSTRAINT "fk_reconciliation_evidence_item_id" FOREIGN KEY ("school_id", "item_id") REFERENCES "reconciliation_item" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "reconciliation_evidence" ADD CONSTRAINT "fk_reconciliation_evidence_attendance_event_id" FOREIGN KEY ("school_id", "attendance_event_id") REFERENCES "attendance_event" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "reconciliation_evidence" ADD CONSTRAINT "fk_reconciliation_evidence_attendance_revision_id" FOREIGN KEY ("school_id", "attendance_revision_id") REFERENCES "attendance_revision" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "reconciliation_evidence" ADD CONSTRAINT "fk_reconciliation_evidence_transfer_id" FOREIGN KEY ("school_id", "transfer_id") REFERENCES "student_transfer" ("school_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

SELECT create_hypertable('gps_position', 'measured_at', chunk_time_interval => INTERVAL '7 days', create_default_indexes => FALSE);
