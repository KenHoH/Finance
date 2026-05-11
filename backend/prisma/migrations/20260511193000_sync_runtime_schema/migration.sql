ALTER TABLE "Notification"
ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Transaction"
ADD COLUMN IF NOT EXISTS "sourceId" TEXT;

CREATE TABLE IF NOT EXISTS "Settings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Settings_userId_idx" ON "Settings"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Settings_userId_key_key" ON "Settings"("userId", "key");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Settings_userId_fkey'
  ) THEN
    ALTER TABLE "Settings"
    ADD CONSTRAINT "Settings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
