-- Wallet credits.
--
-- A ledger, not a balance column: the balance is derived (credits minus spend)
-- so it can never drift from its own history, and every entry says where the
-- money came from. `source` is the honest part — nothing here has been through
-- a payment provider yet, and a `test_credit` row must never be mistaken for
-- one that has.
CREATE TABLE IF NOT EXISTS "walletCredit" (
  "id" text NOT NULL PRIMARY KEY,
  "organizationId" text NOT NULL REFERENCES "organization" ("id") ON DELETE CASCADE,
  "amountUsd" text NOT NULL,
  -- test_credit: added from the dashboard with no card charged.
  -- stripe / grant: reserved for when a provider exists.
  "source" text NOT NULL,
  -- The provider's own id, once there is a provider.
  "reference" text,
  "createdByUserId" text REFERENCES "user" ("id") ON DELETE SET NULL,
  "createdAt" text NOT NULL
);

-- Every read is "this organisation, newest first".
CREATE INDEX IF NOT EXISTS "walletCredit_org_createdAt_idx"
  ON "walletCredit" ("organizationId", "createdAt");
