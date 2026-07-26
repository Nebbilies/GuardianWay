-- GuardianWay initial schema (squashed: base tables + PostGIS/TimescaleDB).
-- Extensions must exist before any geography DDL or the hypertable below.
-- Expected, inert Prisma<->PostGIS drift: schema.prisma models BusStop.location and
-- TrackingLog.location as Unsupported/optional, but here BusStop.location is a STORED
-- generated column and TrackingLog.location is NOT NULL. `prisma migrate diff` will
-- always report those two as drift; that is intentional.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DRIVER', 'PARENT');

-- CreateEnum
CREATE TYPE "BusStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "BusTripStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BoardingAction" AS ENUM ('BOARDED', 'ALIGHTED', 'ABSENT', 'NO_SHOW', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('PICKUP', 'DROPOFF');

-- CreateEnum
CREATE TYPE "TripEventType" AS ENUM ('STARTED', 'ARRIVED_STOP', 'DEPARTED_STOP', 'DELAYED', 'COMPLETED');

-- CreateTable
CREATE TABLE "School" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "schoolId" UUID,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "passwordSetupRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMPTZ(3),
    "role" "Role" NOT NULL,
    "phoneNumber" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentClass" TEXT NOT NULL,
    "cardTokenHash" TEXT,
    "parentId" UUID,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "licenseNumber" TEXT NOT NULL,

    CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bus" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "BusStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Bus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusStop" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" geography(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography) STORED,
    "isSchoolStop" BOOLEAN NOT NULL DEFAULT false,
    "geofenceRadius" DOUBLE PRECISION DEFAULT 75,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),
    "schoolId" UUID NOT NULL,

    CONSTRAINT "BusStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusRoute" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),
    "schoolId" UUID NOT NULL,

    CONSTRAINT "BusRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteStop" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "routeId" UUID NOT NULL,
    "stopId" UUID NOT NULL,
    "stopOrder" INTEGER NOT NULL,
    "scheduledTime" TIME(6),
    "isFinalStop" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusTrip" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "routeId" UUID NOT NULL,
    "busId" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "tripType" "TripType" NOT NULL,
    "scheduledStartTime" TIMESTAMPTZ(3) NOT NULL,
    "scheduledEndTime" TIMESTAMPTZ(3) NOT NULL,
    "actualStartTime" TIMESTAMPTZ(3),
    "actualEndTime" TIMESTAMPTZ(3),
    "status" "BusTripStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "BusTrip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "busTripId" UUID NOT NULL,
    "eventType" "TripEventType" NOT NULL,
    "stopId" UUID,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardingRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actionType" "BoardingAction" NOT NULL,
    "recordedBy" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "stopId" UUID NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "BoardingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "busTripId" UUID NOT NULL,
    "location" geography(Point, 4326) NOT NULL,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "recordedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingLog_pkey" PRIMARY KEY ("recordedAt","id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipientId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInviteToken" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "consumedAt" TIMESTAMPTZ(3),
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "UserInviteToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_slug_key" ON "School"("slug");

-- CreateIndex
CREATE INDEX "User_schoolId_idx" ON "User"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_cardTokenHash_key" ON "StudentProfile"("cardTokenHash");

-- CreateIndex
CREATE INDEX "StudentProfile_schoolId_idx" ON "StudentProfile"("schoolId");

-- CreateIndex
CREATE INDEX "StudentProfile_parentId_idx" ON "StudentProfile"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_studentId_schoolId_key" ON "StudentProfile"("studentId", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverProfile_userId_key" ON "DriverProfile"("userId");

-- CreateIndex
CREATE INDEX "Bus_schoolId_idx" ON "Bus"("schoolId");

-- CreateIndex
CREATE INDEX "BusStop_schoolId_idx" ON "BusStop"("schoolId");

-- CreateIndex
CREATE INDEX "BusStop_location_idx" ON "BusStop" USING GIST ("location");

-- CreateIndex
CREATE INDEX "BusRoute_schoolId_idx" ON "BusRoute"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "RouteStop_routeId_stopOrder_key" ON "RouteStop"("routeId", "stopOrder");

-- CreateIndex
CREATE INDEX "BusTrip_schoolId_idx" ON "BusTrip"("schoolId");

-- CreateIndex
CREATE INDEX "BusTrip_busId_idx" ON "BusTrip"("busId");

-- CreateIndex
CREATE INDEX "BusTrip_driverId_idx" ON "BusTrip"("driverId");

-- CreateIndex
CREATE INDEX "BusTrip_routeId_idx" ON "BusTrip"("routeId");

-- CreateIndex
CREATE INDEX "TripEvent_busTripId_occurredAt_idx" ON "TripEvent"("busTripId", "occurredAt");

-- CreateIndex
CREATE INDEX "TripEvent_schoolId_idx" ON "TripEvent"("schoolId");

-- CreateIndex
CREATE INDEX "BoardingRecord_studentId_idx" ON "BoardingRecord"("studentId");

-- CreateIndex
CREATE INDEX "BoardingRecord_tripId_idx" ON "BoardingRecord"("tripId");

-- CreateIndex
CREATE INDEX "BoardingRecord_recordedBy_idx" ON "BoardingRecord"("recordedBy");

-- CreateIndex
CREATE UNIQUE INDEX "BoardingRecord_tripId_studentId_actionType_key" ON "BoardingRecord"("tripId", "studentId", "actionType");

-- CreateIndex
CREATE INDEX "TrackingLog_busTripId_recordedAt_idx" ON "TrackingLog"("busTripId", "recordedAt");

-- CreateIndex
CREATE INDEX "TrackingLog_location_idx" ON "TrackingLog" USING GIST ("location");

-- CreateIndex
CREATE UNIQUE INDEX "UserInviteToken_tokenHash_key" ON "UserInviteToken"("tokenHash");

-- CreateIndex
CREATE INDEX "UserInviteToken_userId_idx" ON "UserInviteToken"("userId");

-- CreateIndex
CREATE INDEX "UserInviteToken_expiresAt_idx" ON "UserInviteToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bus" ADD CONSTRAINT "Bus_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusStop" ADD CONSTRAINT "BusStop_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusRoute" ADD CONSTRAINT "BusRoute_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "BusRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "BusStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusTrip" ADD CONSTRAINT "BusTrip_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusTrip" ADD CONSTRAINT "BusTrip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusTrip" ADD CONSTRAINT "BusTrip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "BusRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusTrip" ADD CONSTRAINT "BusTrip_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripEvent" ADD CONSTRAINT "TripEvent_busTripId_fkey" FOREIGN KEY ("busTripId") REFERENCES "BusTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripEvent" ADD CONSTRAINT "TripEvent_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "BusStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripEvent" ADD CONSTRAINT "TripEvent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingRecord" ADD CONSTRAINT "BoardingRecord_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "BusStop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingRecord" ADD CONSTRAINT "BoardingRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingRecord" ADD CONSTRAINT "BoardingRecord_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "BusTrip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingRecord" ADD CONSTRAINT "BoardingRecord_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingLog" ADD CONSTRAINT "TrackingLog_busTripId_fkey" FOREIGN KEY ("busTripId") REFERENCES "BusTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInviteToken" ADD CONSTRAINT "UserInviteToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Partial-unique: uniqueness only among non-deleted rows, so a soft-deleted email /
-- license plate can be reused (there is a restore feature). Prisma can't model partial-unique.
CREATE UNIQUE INDEX "User_email_active_key" ON "User"("email") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "Bus_schoolId_licensePlate_active_key" ON "Bus"("schoolId", "licensePlate") WHERE "deletedAt" IS NULL;

-- Convert TrackingLog to a Timescale hypertable last: table is empty and PK (recordedAt, id)
-- already includes the partition column. create_default_indexes=>FALSE — the PK index covers
-- time-range scans, so no standalone recordedAt index is needed.
SELECT create_hypertable('"TrackingLog"', 'recordedAt', create_default_indexes => FALSE);
