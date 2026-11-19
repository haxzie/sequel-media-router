/**
 * How each MCP client is installed.
 *
 * `deepLink` opens the client and prefills the server where one supports it;
 * everything else gets the exact command or config file to paste. The shapes
 * differ more than you would expect — VS Code uses `servers` where everyone
 * else uses `mcpServers`, Cursor base64s its whole config into a deep link —
 * so each entry carries its own snippet rather than filling a template.
 */
export interface McpClient {
  id: string;
  name: string;
  /** What the install actually is, in three or four words. */
  method: string;
  logo: string;
  /**
   * Tile background — any CSS background value, so a brand with a gradient
   * (Gemini) gets one rather than being flattened to a single hex.
   */
  tone: string;
  /** Opens the client with the server prefilled, where one exists. */
  deepLink?: (url: string) => string;
  /** Where the snippet goes: a terminal, or the path of a config file. */
  target: string;
  snippet: (url: string) => string;
  note?: string;
}

const base64 = (value: string) =>
  typeof window === 'undefined' ? '' : window.btoa(value);

export const MCP_CLIENTS: McpClient[] = [
  // Ordered by lab — Anthropic, OpenAI, Google — then the editors and
  // CLIs that embed them. Someone looking for their client scans by the
  // name they already know.
  {
    id: 'claude-code',
    tone: '#D97757',
    name: 'Claude Code',
    method: 'One command',
    logo: '/clients/claude-code.svg',
    target: 'Run in your terminal',
    snippet: (url) => `claude mcp add --scope user --transport http sequel ${url}`,
    note: 'Drop --scope user to install it for the current project only.',
  },
  {
    id: 'claude',
    tone: '#D97757',
    name: 'Claude',
    method: 'Custom connector',
    logo: '/clients/claude.svg',
    deepLink: (url) =>
      `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=Sequel&connectorUrl=${encodeURIComponent(url)}`,
    target: 'claude.ai → Settings → Connectors',
    snippet: (url) => `Name:\nSequel\n\nRemote MCP server URL:\n${url}`,
  },
  {
    id: 'chatgpt',
    tone: '#10A37F',
    name: 'ChatGPT',
    method: 'Connector settings',
    logo: '/clients/chatgpt.svg',
    target: 'Settings → Connectors',
    snippet: (url) => `Server URL:\n${url}`,
  },
  {
    id: 'codex',
    tone: 'linear-gradient(150deg, #B6A8F8 0%, #7A8BF9 48%, #2F44F5 100%)',
    name: 'Codex',
    method: 'One command',
    logo: '/clients/codex.svg',
    target: 'Run in your terminal',
    snippet: (url) =>
      `codex --add-mcp-server \\\n  --name sequel \\\n  --transport http \\\n  --url ${url}`,
  },
  {
    id: 'gemini',
    tone: 'linear-gradient(135deg, #4285F4 0%, #9B72CB 50%, #D96570 100%)',
    name: 'Gemini CLI',
    method: 'Config file',
    logo: '/clients/gemini.svg',
    target: '~/.gemini/settings.json',
    snippet: (url) =>
      JSON.stringify({ mcpServers: { sequel: { url } } }, null, 2),
  },
  {
    id: 'grok-bot',
    tone: '#000000',
    name: 'Grok Bot',
    method: 'Ask the bot',
    logo: '/clients/grok.svg',
    /* The only client here with no settings screen: a Bot takes a server by
       being told about one in chat, then lists it under Connect apps. */
    target: 'Say this to your bot',
    snippet: (url) => `Add this MCP server:\n${url}`,
    note: 'The bot confirms the details with you, then lists Sequel under Connect apps.',
  },
  {
    id: 'muse',
    tone: '#0064E0',
    name: 'Muse',
    method: 'Config file',
    logo: '/clients/muse.svg',
    target: '~/.config/muse/settings.json',
    snippet: (url) =>
      JSON.stringify(
        {
          mcp_servers: { sequel: { transport: 'streamable_http', url, enabled: true } },
        },
        null,
        2,
      ),
    note: 'Muse Code reads this file. The Muse app connects through custom connectors instead.',
  },
  {
    id: 'cursor',
    tone: '#000000',
    name: 'Cursor',
    method: 'Deep link or config',
    logo: '/clients/cursor.svg',
    deepLink: (url) =>
      `cursor://anysphere.cursor-deeplink/mcp/install?name=sequel&config=${encodeURIComponent(
        base64(JSON.stringify({ url })),
      )}`,
    target: '.cursor/mcp.json',
    snippet: (url) =>
      JSON.stringify({ mcpServers: { sequel: { url } } }, null, 2),
  },
  {
    id: 'vscode',
    tone: '#0065A9',
    name: 'VS Code',
    method: 'Deep link or config',
    logo: '/clients/vscode.svg',
    deepLink: (url) =>
      `vscode:mcp/install?${encodeURIComponent(
        JSON.stringify({ name: 'sequel', type: 'http', url }),
      )}`,
    target: '.vscode/mcp.json',
    snippet: (url) =>
      JSON.stringify({ servers: { sequel: { type: 'http', url } } }, null, 2),
  },
];
