-- Files attached to a chat.
--
-- The bytes live wherever uploads live (R2, or local disk on a fresh clone);
-- this table is the chat-scoped index over them, so an attachment can be
-- listed, authorised and shown without a bucket listing.
--
-- `url` is the short /f/<id> alias rather than a signed URL: signatures expire
-- and these rows do not, and it is the same handle run_models accepts as
-- file_url.
CREATE TABLE IF NOT EXISTS chatFile (
  id TEXT PRIMARY KEY,
  chatId TEXT NOT NULL REFERENCES chat(id) ON DELETE CASCADE,
  organizationId TEXT NOT NULL,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  url TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS chatFile_chatId_idx ON chatFile (chatId, createdAt);
