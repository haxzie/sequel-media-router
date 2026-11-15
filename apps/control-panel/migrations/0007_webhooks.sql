-- Webhook endpoints, and a short log of what we sent them.
CREATE TABLE IF NOT EXISTS "webhook" (
  "id" text NOT NULL PRIMARY KEY,
  "organizationId" text NOT NULL REFERENCES "organization" ("id") ON DELETE CASCADE,
  "url" text NOT NULL,
  -- Shown once at creation and never again. Stored in plain text because it
  -- is a shared secret: signing a payload requires the same bytes the
  -- receiver holds, so unlike a password it cannot be hashed.
  "secret" text NOT NULL,
  -- JSON array. One row can subscribe to several event types.
  "events" text NOT NULL,
  "enabled" integer NOT NULL DEFAULT 1,
  "description" text,
  "createdByUserId" text REFERENCES "user" ("id") ON DELETE SET NULL,
  "createdAt" text NOT NULL,
  "lastDeliveryAt" text,
  "lastDeliveryStatus" integer
);

CREATE INDEX IF NOT EXISTS "webhook_organizationId_idx" ON "webhook" ("organizationId");

-- Recent attempts, so a failing endpoint can be diagnosed without asking the
-- person on the other end what they received.
CREATE TABLE IF NOT EXISTS "webhookDelivery" (
  "id" text NOT NULL PRIMARY KEY,
  "webhookId" text NOT NULL REFERENCES "webhook" ("id") ON DELETE CASCADE,
  "eventId" text NOT NULL,
  "eventType" text NOT NULL,
  -- Null when the request never got a response at all (DNS, TLS, timeout).
  "responseStatus" integer,
  "error" text,
  "durationMs" integer,
  "attempt" integer NOT NULL DEFAULT 1,
  "createdAt" text NOT NULL
);

CREATE INDEX IF NOT EXISTS "webhookDelivery_webhook_createdAt_idx"
  ON "webhookDelivery" ("webhookId", "createdAt");
