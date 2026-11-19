'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MCP_CLIENTS, type McpClient } from '@/components/mcp/clients';
import { Faces } from './parts';

/**
 * The hero's primary action, as a dialog rather than a jump link.
 *
 * It used to scroll to the install section, which answered the question
 * 'how do I add this' with 'keep reading'. The install is a two-part
 * decision — which client, then what to paste — so the dialog is split the
 * same way: the rail on the left is the choice, the pane on the right is
 * the one instruction that choice implies. Nothing else moves.
 *
 * The client registry is shared with the dashboard's connect screen, so a
 * client added there appears here without being written twice.
 */
export function InstallPill({
  url,
  variant = 'faces',
  children = 'Add to your agent',
}: {
  /**
   * Omitted in the header, which renders on pages that do not compute it:
   * the dialog falls back to this origin, which is the same server the
   * client would be pointed at anyway.
   */
  url?: string;
  variant?: 'faces' | 'compact';
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const faces = variant === 'faces';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2.5 rounded-full bg-white text-[14px] font-medium text-[#0a0a0a] transition-all hover:opacity-90 ${
          faces ? 'py-2 pl-2 pr-4' : 'px-5 py-2.5'
        }`}
      >
        {faces && <Faces />}
        {children}
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
          <path
            d="M6 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <InstallDialog url={url} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function InstallDialog({
  url,
  open,
  onClose,
}: {
  url?: string;
  open: boolean;
  onClose: () => void;
}) {
  const [client, setClient] = useState<McpClient>(MCP_CLIENTS[0]!);
  const [copied, setCopied] = useState(false);

  /* Portalled, so the dialog is positioned against the viewport rather than
     against the hero — which is inside a clipped, arc-bearing container. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  /* Built during render: Cursor's deep link needs btoa, which does not exist
     on the server, so neither value can be precomputed. */
  const server = url ?? `${window.location.origin}/mcp`;
  const snippet = client.snippet(server);
  const deepLink = client.deepLink?.(server) ?? null;

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 sm:px-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-black/70 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add Sequel to your agent"
        className="relative flex max-h-[86vh] w-full max-w-[880px] flex-col overflow-hidden rounded-[24px] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
      >
        <header className="flex items-center justify-between gap-4 border-b border-[var(--color-line)] px-6 py-4">
          <h2 className="text-[17px] tracking-tight text-[var(--color-text)]">
            Add Sequel to your agent
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 shrink-0 rounded-lg p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-[236px_1fr]">
          {/* The choice. */}
          <nav
            aria-label="Clients"
            className="scroll-area max-h-[168px] overflow-y-auto border-b border-[var(--color-line)] bg-[var(--color-bg)] p-2 sm:max-h-none sm:border-b-0 sm:border-r"
          >
            {MCP_CLIENTS.map((item) => {
              const active = item.id === client.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setClient(item);
                    setCopied(false);
                  }}
                  aria-current={active}
                  className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                    active
                      ? 'bg-[var(--color-card)] text-[var(--color-text)]'
                      : 'text-[var(--color-muted)] hover:bg-[var(--color-card)]/60 hover:text-[var(--color-text)]'
                  }`}
                >
                  <ClientMark client={item} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px]">{item.name}</span>
                    <span className="block truncate text-[11.5px] text-[var(--color-dim)]">
                      {item.method}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          {/* What that choice means. */}
          <div className="scroll-area min-h-0 overflow-y-auto px-6 py-5">
            <div className="flex items-center gap-3">
              <ClientMark client={client} size="lg" />
              <div>
                <div className="text-[15px] text-[var(--color-text)]">{client.name}</div>
                <div className="text-[12.5px] text-[var(--color-dim)]">{client.method}</div>
              </div>
            </div>

            {deepLink && (
              <a
                href={deepLink}
                target="_blank"
                rel="noreferrer"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
              >
                Open in {client.name}
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
                  <path
                    d="M6.5 3.5h6v6M12.5 3.5L6 10M11 9.5V13H3V5h3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-[12px] text-[var(--color-dim)]">
                {deepLink ? `${client.target} — if the link does not open` : client.target}
              </span>
              <button
                type="button"
                onClick={copy}
                className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
                  {copied ? (
                    <path
                      d="M3.5 8.5l3 3 6-6"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <>
                      <rect
                        x="5.5"
                        y="5.5"
                        width="8"
                        height="8"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      />
                      <path
                        d="M10.5 3.5a2 2 0 00-2-2h-4a3 3 0 00-3 3v4a2 2 0 002 2"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </>
                  )}
                </svg>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <pre className="scroll-area mt-2 overflow-x-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3.5 font-mono text-[12.5px] leading-[1.75] text-[var(--color-muted)]">
              {snippet}
            </pre>

            {client.note && (
              <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--color-dim)]">
                {client.note}
              </p>
            )}

            <p className="mt-5 border-t border-[var(--color-line)] pt-4 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
              Once it is connected, ask for the media you want. Your agent searches the catalogue,
              picks a model and generates —{' '}
              <a href="/docs" className="text-[var(--color-text)] underline underline-offset-2">
                read the docs
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Brand tile with the mark knocked out in white, as the dashboard draws it. */
function ClientMark({ client, size = 'sm' }: { client: McpClient; size?: 'sm' | 'lg' }) {
  const box = size === 'lg' ? 'h-9 w-9 rounded-xl' : 'h-7 w-7 rounded-lg';
  const glyph = size === 'lg' ? 'h-[18px] w-[18px]' : 'h-[14px] w-[14px]';

  return (
    <span
      className={`flex shrink-0 items-center justify-center ${box}`}
      style={{ background: client.tone }}
      aria-hidden
    >
      <span
        className={`bg-white ${glyph}`}
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
