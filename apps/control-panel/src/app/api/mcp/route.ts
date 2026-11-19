/**
 * The old address, kept alive.
 *
 * The endpoint moved to /mcp, which is what the install command now hands
 * out. Anyone who ran the old one has `…/api/mcp` written into their client
 * config, and an MCP server that stops answering is indistinguishable from a
 * broken one from inside an agent.
 *
 * It re-exports rather than redirects: a 308 preserves method and body, but
 * it depends on every client's HTTP layer following redirects on POST, and
 * this costs nothing to keep. The OAuth resource is stated as /mcp in both
 * places, so a token minted through either path validates through both.
 *
 * Deletable once the installs that predate the move are gone.
 */
export { dynamic, GET, OPTIONS, POST } from '../../mcp/route';
