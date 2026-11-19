'use client';

import { useEffect, useRef, useState } from 'react';
import { MCP_CLIENTS, type McpClient } from '@/components/mcp/clients';

/**
 * The page's primary action: one command, for whichever client you use.
 *
 * It asks for nothing first. The server URL is the same for everyone and
 * carries no secret — the client discovers the authorization server from it,
 * opens a browser, and you approve there. That only became true once MCP
 * OAuth was finished; before it, this button would have been a promise the
 * product could not keep.
 */
export function InstallButton({
  url,
  layout = 'stack',
}: {
  url: string;
  /**
   * 'stack' puts the command under the button, which is what the landing
   * page wants from its primary action. 'row' sets them side by side with
   * the button at its natural width — for the docs, where this is a step in
   * a page rather than the thing the page is for.
   */
  layout?: 'stack' | 'row';
}) {
  const [client, setClient] = useState<McpClient>(MCP_CLIENTS[0]!);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const row = layout === 'row';
  const snippet = client.snippet(url);
  const deepLink = client.deepLink?.(url);

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className={`flex w-full ${row ? 'items-stretch gap-2' : 'flex-col'}`}>
      <div
        ref={box}
        className={`relative flex items-stretch gap-px ${row ? 'shrink-0' : ''}`}
      >
        {/* A client with a deep link opens; everything else copies the one
            line it needs. Both are 'add this to your agent'. */}
        {deepLink ? (
          <a
            href={deepLink}
            className={`flex flex-1 items-center justify-center gap-2.5 bg-white font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 ${
              row ? 'rounded-l-xl px-4 py-2.5 text-[14px]' : 'rounded-l-2xl px-5 py-3.5 text-[15px]'
            }`}
          >
            <Mark client={client} />
            Add to {client.name}
          </a>
        ) : (
          <button
            type="button"
            onClick={copy}
            className={`flex flex-1 items-center justify-center gap-2.5 bg-white font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 ${
              row ? 'rounded-l-xl px-4 py-2.5 text-[14px]' : 'rounded-l-2xl px-5 py-3.5 text-[15px]'
            }`}
          >
            <Mark client={client} />
            {copied ? 'Copied' : `Add to ${client.name}`}
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Choose a different client"
          className={`flex items-center justify-center bg-white text-[#0a0a0a] transition-opacity hover:opacity-90 ${
            row ? 'w-9 rounded-r-xl' : 'w-12 rounded-r-2xl'
          }`}
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
            <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-[320px] min-w-[220px] overflow-y-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-1.5 shadow-2xl">
            {MCP_CLIENTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setClient(item);
                  setOpen(false);
                }}
                className="nav-item flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-[14px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
              >
                <Mark client={item} />
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* The command, visible rather than hidden behind the button. Seeing it
          is what tells a developer this is one line and not a signup flow. */}
      <button
        type="button"
        onClick={copy}
        title="Copy"
        /* chip, not a bordered box: this sits next to a solid white button
           and a drawn border beside it reads as a hole. The class carries the
           ring and the lift; the radius is overridden because a 36px pill on
           a full-width row looks like a search field. */
        className={`chip flex items-center gap-3 text-left ${
          row ? 'min-w-0 flex-1 rounded-xl px-3.5 py-2.5' : 'mt-3 w-full rounded-2xl px-4 py-3'
        }`}
      >
        <span className="shrink-0 font-mono text-[13px] text-[var(--color-dim)]">$</span>
        <span className="scroll-area min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13px] text-[var(--color-muted)]">
          {snippet}
        </span>
        <span className="shrink-0 text-[12px] text-[var(--color-dim)]">{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  );
}

function Mark({ client }: { client: McpClient }) {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
      style={{ background: client.tone }}
      aria-hidden
    >
      <span
        className="h-3 w-3 bg-white"
        style={{
          maskImage: `url(${client.logo})`,
          WebkitMaskImage: `url(${client.logo})`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
        }}
      />
    </span>
  );
}
