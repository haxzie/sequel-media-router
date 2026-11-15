-- Tool-call timings live on the assistant message that made the calls.
--
-- They are measured on the server, where the tool actually runs, and sent
-- down as message metadata. Without this column the trace would be accurate
-- while the stream is open and empty the moment you reload — the browser
-- cannot time work it did not do.
ALTER TABLE chatMessage ADD COLUMN metadata TEXT;
