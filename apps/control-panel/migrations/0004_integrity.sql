-- Integrity constraints the generated schema does not carry.
--
-- Additive only: indexes, no table changes. Better Auth owns every table
-- touched here and regenerates them from its own plugin definitions, so
-- altering a column would be overwritten on the next `db:generate`. An index
-- it did not create survives, and the library's own queries are unaffected.
--
-- Each of these is enforced in application code today. That is not the same as
-- being true: a retry, a race between two tabs, or a direct write all bypass
-- application code, and the database currently has no opinion.

-- A person is in an organisation once. Better Auth checks before inserting,
-- but two concurrent accepts of the same invitation both pass that check.
CREATE UNIQUE INDEX IF NOT EXISTS "member_org_user_uidx"
  ON "member" ("organizationId", "userId");

-- One live invitation per address per organisation. Partial, so the history of
-- accepted and cancelled invitations stays intact — only `pending` is unique.
CREATE UNIQUE INDEX IF NOT EXISTS "invitation_org_email_pending_uidx"
  ON "invitation" ("organizationId", "email")
  WHERE "status" = 'pending';

-- The stored value is a hash of the key. Two rows sharing one means two
-- records for one credential, and whichever is found first wins — including
-- for revocation, which would then revoke the wrong row.
CREATE UNIQUE INDEX IF NOT EXISTS "apikey_key_uidx" ON "apikey" ("key");

-- `session.activeOrganizationId` has no foreign key (Better Auth leaves it
-- loose because the organization plugin is optional), so an organisation can
-- be deleted out from under live sessions. The index does not fix that, but it
-- makes finding the affected sessions a lookup rather than a scan.
CREATE INDEX IF NOT EXISTS "session_activeOrganizationId_idx"
  ON "session" ("activeOrganizationId");

-- Every task list is "newest first"; every expiry sweep is "older than".
CREATE INDEX IF NOT EXISTS "oauthAccessToken_expiresAt_idx"
  ON "oauthAccessToken" ("expiresAt");
CREATE INDEX IF NOT EXISTS "oauthRefreshToken_expiresAt_idx"
  ON "oauthRefreshToken" ("expiresAt");
CREATE INDEX IF NOT EXISTS "verification_expiresAt_idx"
  ON "verification" ("expiresAt");

-- One consent row per client per user, which is what "has this person already
-- approved this client" asks. Without it a second approval appends a row and
-- the lookup silently depends on insertion order.
CREATE UNIQUE INDEX IF NOT EXISTS "oauthConsent_client_user_uidx"
  ON "oauthConsent" ("clientId", "userId");
