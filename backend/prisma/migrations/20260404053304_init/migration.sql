-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'DRIVER', 'STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "BusStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "BusTripStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BoardingAction" AS ENUM ('BOARDING', 'ABSENT');

-- CreateTable
CREATE TABLE "User"
(
    "id"                    TEXT         NOT NULL DEFAULT gen_random_uuid(),
    "name"                  TEXT         NOT NULL,
    "email"                 TEXT         NOT NULL,
    "password"              TEXT,
    "passwordSetupRequired" BOOLEAN      NOT NULL DEFAULT true,
    "isActive"              BOOLEAN      NOT NULL DEFAULT true,
    "lastLoginAt"           TIMESTAMP(3),
    "role"                  "Role"       NOT NULL,
    "phoneNumber"           TEXT,
    "address"               TEXT,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL,
    "deletedAt"             TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile"
(
    "id"           TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId"       TEXT NOT NULL,
    "studentId"    TEXT NOT NULL,
    "studentClass" TEXT NOT NULL,
    "parentId"     TEXT,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverProfile"
(
    "id"            TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId"        TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,

    CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bus"
(
    "id"           TEXT         NOT NULL DEFAULT gen_random_uuid(),
    "licensePlate" TEXT         NOT NULL,
    "model"        TEXT         NOT NULL,
    "capacity"     INTEGER      NOT NULL,
    "status"       "BusStatus"  NOT NULL DEFAULT 'ACTIVE',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    "deletedAt"    TIMESTAMP(3),

    CONSTRAINT "Bus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusStop"
(
    "id"           TEXT             NOT NULL DEFAULT gen_random_uuid(),
    "name"         TEXT             NOT NULL,
    "address"      TEXT             NOT NULL,
    "latitude"     DOUBLE PRECISION NOT NULL,
    "longitude"    DOUBLE PRECISION NOT NULL,
    "isSchoolStop" BOOLEAN          NOT NULL DEFAULT false,
    "createdAt"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3)     NOT NULL,
    "deletedAt"    TIMESTAMP(3),

    CONSTRAINT "BusStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusRoute"
(
    "id"            TEXT             NOT NULL DEFAULT gen_random_uuid(),
    "name"          TEXT             NOT NULL,
    "description"   TEXT,
    "totalDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)     NOT NULL,
    "deletedAt"     TIMESTAMP(3),

    CONSTRAINT "BusRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteStop"
(
    "routeId"       TEXT    NOT NULL,
    "stopId"        TEXT    NOT NULL,
    "stopOrder"     INTEGER NOT NULL,
    "scheduledTime" TIME(6),
    "isFinalStop"   BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("routeId", "stopId")
);

-- CreateTable
CREATE TABLE "BusTrip"
(
    "id"        TEXT            NOT NULL DEFAULT gen_random_uuid(),
    "routeId"   TEXT            NOT NULL,
    "busId"     TEXT            NOT NULL,
    "driverId"  TEXT            NOT NULL,
    "date"      DATE            NOT NULL,
    "startTime" TIME(6)         NOT NULL,
    "endTime"   TIME(6),
    "status"    "BusTripStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3)    NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BusTrip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardingRecord"
(
    "id"         TEXT             NOT NULL DEFAULT gen_random_uuid(),
    "actionType" "BoardingAction" NOT NULL,
    "studentId"  TEXT             NOT NULL,
    "tripId"     TEXT             NOT NULL,
    "stopId"     TEXT             NOT NULL,
    "timestamp"  TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note"       TEXT,

    CONSTRAINT "BoardingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingLog"
(
    "id"        TEXT             NOT NULL DEFAULT gen_random_uuid(),
    "busTripId" TEXT             NOT NULL,
    "latitude"  DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed"     DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification"
(
    "id"          TEXT         NOT NULL DEFAULT gen_random_uuid(),
    "recipientId" TEXT         NOT NULL,
    "title"       TEXT         NOT NULL,
    "message"     TEXT         NOT NULL,
    "type"        TEXT         NOT NULL,
    "isRead"      BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInviteToken"
(
    "id"         TEXT         NOT NULL DEFAULT gen_random_uuid(),
    "userId"     TEXT         NOT NULL,
    "tokenHash"  TEXT         NOT NULL,
    "expiresAt"  TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdBy"  TEXT         NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInviteToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken"
(
    "id"        TEXT         NOT NULL DEFAULT gen_random_uuid(),
    "userId"    TEXT         NOT NULL,
    "tokenHash" TEXT         NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile" ("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_studentId_key" ON "StudentProfile" ("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverProfile_userId_key" ON "DriverProfile" ("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Bus_licensePlate_key" ON "Bus" ("licensePlate");

-- CreateIndex
CREATE UNIQUE INDEX "UserInviteToken_tokenHash_key" ON "UserInviteToken" ("tokenHash");

-- CreateIndex
CREATE INDEX "UserInviteToken_userId_idx" ON "UserInviteToken" ("userId");

-- CreateIndex
CREATE INDEX "UserInviteToken_expiresAt_idx" ON "UserInviteToken" ("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken" ("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken" ("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken" ("expiresAt");

-- AddForeignKey
ALTER TABLE "StudentProfile"
    ADD CONSTRAINT "StudentProfile_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile"
    ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverProfile"
    ADD CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop"
    ADD CONSTRAINT "RouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "BusRoute" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop"
    ADD CONSTRAINT "RouteStop_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "BusStop" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusTrip"
    ADD CONSTRAINT "BusTrip_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusTrip"
    ADD CONSTRAINT "BusTrip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusTrip"
    ADD CONSTRAINT "BusTrip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "BusRoute" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingRecord"
    ADD CONSTRAINT "BoardingRecord_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "BusStop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingRecord"
    ADD CONSTRAINT "BoardingRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingRecord"
    ADD CONSTRAINT "BoardingRecord_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "BusTrip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingLog"
    ADD CONSTRAINT "TrackingLog_busTripId_fkey" FOREIGN KEY ("busTripId") REFERENCES "BusTrip" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInviteToken"
    ADD CONSTRAINT "UserInviteToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

