-- Enable required extensions. Must run before any geography DDL below.
-- Idempotent so `migrate deploy` is safe to re-run and the shadow DB can replay it.
CREATE
EXTENSION IF NOT EXISTS postgis;
CREATE
EXTENSION IF NOT EXISTS timescaledb;

-- BusStop: `location` is DERIVED from lat/lng (source of truth stays lat/lng).
-- STORED generated column => Prisma/ingest keep writing lat/lng, DB fills location, no drift.
ALTER TABLE "BusStop"
    ADD COLUMN "location" geography(Point, 4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography) STORED;

-- TrackingLog: `location` is a REAL column written by the ingest path (NOT NULL).
-- Also: drop redundant lat/lng, retire `timestamp` for recorded/received clocks,
-- make speed nullable, and move the PK to (recordedAt, id) so Timescale accepts it.
ALTER TABLE "TrackingLog" DROP CONSTRAINT "TrackingLog_pkey",
DROP
COLUMN "latitude",
DROP
COLUMN "longitude",
DROP
COLUMN "timestamp",
ADD COLUMN     "accuracy" DOUBLE PRECISION,
ADD COLUMN     "heading" DOUBLE PRECISION,
ADD COLUMN     "location" geography(Point, 4326) NOT NULL,
ADD COLUMN     "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER
COLUMN "speed" DROP
NOT NULL,
ADD CONSTRAINT "TrackingLog_pkey" PRIMARY KEY ("recordedAt", "id");

-- Indexes (GiST for the spatial columns; composite for time-range scans per trip).
CREATE INDEX "BusStop_location_idx" ON "BusStop" USING GIST ("location");
CREATE INDEX "TrackingLog_busTripId_recordedAt_idx" ON "TrackingLog" ("busTripId", "recordedAt");
CREATE INDEX "TrackingLog_location_idx" ON "TrackingLog" USING GIST ("location");

-- Convert TrackingLog into a Timescale hypertable. Runs last: PK now includes the
-- partition column (recordedAt) and the table is empty, so no migrate_data needed.
SELECT create_hypertable('"TrackingLog"', 'recordedAt', if_not_exists = > TRUE);
