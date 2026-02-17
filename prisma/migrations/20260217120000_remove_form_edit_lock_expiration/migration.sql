-- Remove time-based expiry for form edit locks
DROP INDEX IF EXISTS "FormEditLock_expiresAt_idx";
ALTER TABLE "FormEditLock" DROP COLUMN IF EXISTS "expiresAt";
