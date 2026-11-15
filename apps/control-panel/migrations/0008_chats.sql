-- Conversations on the Create page.
CREATE TABLE IF NOT EXISTS "chat" (
  "id" text NOT NULL PRIMARY KEY,
  "organizationId" text NOT NULL REFERENCES "organization" ("id") ON DELETE CASCADE,
  "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  -- First thing the person typed, trimmed. Null until that arrives.
  "title" text,
  "createdAt" text NOT NULL,
  "updatedAt" text NOT NULL
);

-- A sidebar of recent chats reads exactly this way.
CREATE INDEX IF NOT EXISTS "chat_org_updatedAt_idx" ON "chat" ("organizationId", "updatedAt");
CREATE INDEX IF NOT EXISTS "chat_user_updatedAt_idx" ON "chat" ("userId", "updatedAt");

CREATE TABLE IF NOT EXISTS "chatMessage" (
  "id" text NOT NULL PRIMARY KEY,
  "chatId" text NOT NULL REFERENCES "chat" ("id") ON DELETE CASCADE,
  "role" text NOT NULL,
  -- The UIMessage parts array, verbatim. Storing the rendered shape rather
  -- than re-deriving it means a reloaded chat looks exactly as it did —
  -- including which tool ran and what it returned.
  "parts" text NOT NULL,
  "createdAt" text NOT NULL
);

CREATE INDEX IF NOT EXISTS "chatMessage_chat_createdAt_idx"
  ON "chatMessage" ("chatId", "createdAt");
