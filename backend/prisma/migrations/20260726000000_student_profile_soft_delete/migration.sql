-- StudentProfile: add timestamps + soft-delete, and make studentId unique per school
-- only among non-deleted rows so a graduated student's ID can be reused.

ALTER TABLE "StudentProfile"
  ADD COLUMN "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "deletedAt" TIMESTAMPTZ(3);

-- Replace the full unique with a plain index + a partial-unique (active rows only).
DROP INDEX "StudentProfile_studentId_schoolId_key";
CREATE INDEX "StudentProfile_studentId_schoolId_idx" ON "StudentProfile"("studentId", "schoolId");
CREATE UNIQUE INDEX "StudentProfile_studentId_schoolId_active_key"
  ON "StudentProfile"("studentId", "schoolId") WHERE "deletedAt" IS NULL;
