-- Append-only audit trail. Denormalized actor/target snapshots keep a row
-- readable even after the actor or target is deleted, so no foreign keys.
CREATE TABLE "AuditLog" (
  "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
  "action"     TEXT NOT NULL,
  "actorId"    UUID,
  "actorEmail" TEXT,
  "actorRole"  TEXT,
  "schoolId"   UUID,
  "targetType" TEXT,
  "targetId"   TEXT,
  "metadata"   JSONB,
  "traceId"    TEXT,
  "ip"         TEXT,
  "userAgent"  TEXT,
  "createdAt"  TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_schoolId_createdAt_idx" ON "AuditLog"("schoolId", "createdAt" DESC);
CREATE INDEX "AuditLog_actorId_createdAt_idx"  ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_action_idx"             ON "AuditLog"("action");
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
