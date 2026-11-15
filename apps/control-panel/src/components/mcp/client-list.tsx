'use client';

import { Alert, Card, CheckIcon, CopyIcon, ExternalIcon, Modal } from '@sequel/ui';
import { useState } from 'react';
import { MCP_CLIENTS, type McpClient } from './clients';

export function McpClientList({ url }: { url: string }) {
  const [open, setOpen] = useState<McpClient | null>(null);

  return (
    <>
      <Card className="overflow-hidden">
        {MCP_CLIENTS.map((client, index) => (
          <div
            key={client.id}
            className={[
              'flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--color-card-hover)]',
              index > 0 ? 'border-t border-[var(--color-line)]' : '',
            ].join(' ')}
          >
            <ClientMark client={client} />

            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px]">{client.name}</div>
              <div className="truncate text-[12px] text-[var(--color-dim)]">{client.method}</div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(client)}
              className="shrink-0 rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
            >
              Install
            </button>
          </div>
        ))}
      </Card>

      <InstallDialog client={open} url={url} onClose={() => setOpen(null)} />
    </>
  );
}

/**
 * Brand-coloured tile with the mark knocked out in white.
 *
 * The mark is a CSS mask rather than an <img>, because an image cannot be
 * recoloured — and these are single-colour glyphs, so masking to white is
 * exactly right. Brand hexes are used as-is, including the black ones: a black
 * tile sits darker than the card behind it and the white glyph carries the
 * contrast.
 */
function ClientMark({ client }: { client: McpClient }) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
      style={{ backgroundColor: client.tone }}
    >
      <span
        className="h-[18px] w-[18px] bg-white"
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
        aria-hidden
      />
    </div>
  );
}

function InstallDialog({
  client,
  url,
  onClose,
}: {
  client: McpClient | null;
  url: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  // Built during render rather than in the list, because the deep links for
  // Cursor need btoa and so cannot be computed on the server.
  const snippet = client ? client.snippet(url) : '';
  const deepLink = client?.deepLink ? client.deepLink(url) : null;

  return (
    <Modal
      open={client !== null}
      onClose={() => {
        setCopied(false);
        onClose();
      }}
      title={client ? `Add Sequel to ${client.name}` : ''}
      width={560}
    >
      {client && (
        <div className="space-y-4">
          {deepLink && (
            <a
              href={deepLink}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
            >
              Open in {client.name}
              <ExternalIcon className="h-3.5 w-3.5" />
            </a>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-[12px] text-[var(--color-dim)]">
                {deepLink ? `${client.target} — if the link does not open` : client.target}
              </span>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(snippet).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  });
                }}
                className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
              >
                {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="scroll-area overflow-x-auto rounded-xl bg-[var(--color-card-hover)] px-4 py-3.5 font-mono text-[12px] leading-relaxed text-[var(--color-muted)]">
              {snippet}
            </pre>
          </div>

          {client.note && (
            <p className="text-[12px] leading-relaxed text-[var(--color-dim)]">{client.note}</p>
          )}

          {/*
            No Authorization header in any snippet, because nothing checks one.
            Printing a Bearer line would teach a setup that is not real and
            would break the moment keys start being verified.
          */}
          <Alert tone="info">
            The endpoint is not authenticated yet, so no API key goes in the config. When
            verification lands, these snippets gain an Authorization header and existing installs
            will need updating.
          </Alert>
        </div>
      )}
    </Modal>
  );
}
