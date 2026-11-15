'use client';

import { formatUsd } from '@sequel/core/pricing';
import { CloseIcon, DownloadIcon } from '@sequel/ui';
import { useEffect } from 'react';
import type { CreditRow } from './billing-panel';

const SOURCE_LABEL: Record<CreditRow['source'], string> = {
  test_credit: 'Test credit',
  stripe: 'Card',
  grant: 'Grant',
};

function stamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * One charge, line by line.
 *
 * Every figure here is read from the ledger rather than recomputed — a receipt
 * that derives its own tax would stop matching the row it describes the moment
 * a rate changed.
 */
export function CreditPanel({
  credit,
  organizationName,
  onClose,
}: {
  credit: CreditRow;
  organizationName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <aside className="fixed right-0 top-0 z-50 flex h-screen w-[420px] flex-col border-l border-[var(--color-line)] bg-[var(--color-surface)]">
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <span className="text-[13px] text-[var(--color-muted)]">
          {SOURCE_LABEL[credit.source]}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
        >
          <CloseIcon />
        </button>
      </header>

      <div className="scroll-area min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <div className="display nums text-[40px] leading-none">{formatUsd(credit.amountUsd)}</div>
        <div className="mt-2 text-[13px] text-[var(--color-muted)]">added to your wallet</div>

        <div className="mt-6 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
          <Row label="Credit">{formatUsd(credit.amountUsd)}</Row>
          <Row label="Platform fee">{formatUsd(credit.platformFeeUsd)}</Row>
          <Row
            label="Tax"
            // Said plainly: there is no billing address on file, so this is not
            // a calculated zero.
            hint="No tax jurisdiction on file"
          >
            {formatUsd(credit.taxUsd)}
          </Row>
          <Row label="Total charged" strong>
            {formatUsd(credit.totalUsd)}
          </Row>
        </div>

        <div className="mt-6 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
          <Row label="Date">{stamp(credit.createdAt)}</Row>
          <Row label="Payment method">{credit.paymentMethod ?? 'None on file'}</Row>
          <Row label="Added by">{credit.createdBy?.name ?? '—'}</Row>
          <Row label="Reference">
            <code className="font-mono text-[11px] text-[var(--color-dim)]">{credit.id}</code>
          </Row>
        </div>
      </div>

      <footer className="flex items-center gap-2 border-t border-[var(--color-line)] px-5 py-4">
        <button
          type="button"
          onClick={() => downloadReceipt(credit, organizationName)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
        >
          <DownloadIcon />
          Receipt
        </button>
        <button
          type="button"
          onClick={() => downloadInvoice(credit, organizationName)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--color-line-strong)] px-4 py-2 text-[13px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <DownloadIcon />
          Invoice
        </button>
      </footer>
    </aside>
  );
}

function Row({
  label,
  hint,
  strong,
  children,
}: {
  label: string;
  hint?: string;
  strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <div className="shrink-0">
        <div className="text-[12px] text-[var(--color-dim)]">{label}</div>
        {hint && <div className="mt-0.5 text-[11px] text-[var(--color-dim)]">{hint}</div>}
      </div>
      <div
        className={[
          'nums min-w-0 text-right text-[13px]',
          strong ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)]',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
}

function save(filename: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Both documents carry the same stored figures and both say the charge was not
 * processed by a payment provider. A receipt that omitted that would be the
 * one artefact a person keeps and later relies on.
 */
function downloadReceipt(credit: CreditRow, organizationName: string) {
  const lines = [
    'SEQUEL — RECEIPT',
    '',
    `Reference:      ${credit.id}`,
    `Date:           ${stamp(credit.createdAt)}`,
    `Organisation:   ${organizationName}`,
    `Added by:       ${credit.createdBy?.name ?? '—'}`,
    `Payment method: ${credit.paymentMethod ?? 'None on file'}`,
    '',
    `Credit          ${formatUsd(credit.amountUsd)}`,
    `Platform fee    ${formatUsd(credit.platformFeeUsd)}`,
    `Tax             ${formatUsd(credit.taxUsd)}  (no tax jurisdiction on file)`,
    `Total charged   ${formatUsd(credit.totalUsd)}`,
    '',
    credit.source === 'test_credit'
      ? 'This was recorded as a test credit. No payment provider was involved and no card was charged.'
      : '',
  ];
  save(`sequel-receipt-${credit.id}.txt`, lines.join('\n'), 'text/plain');
}

function downloadInvoice(credit: CreditRow, organizationName: string) {
  const row = (label: string, value: string, strong = false) =>
    `<tr><td>${label}</td><td style="text-align:right${
      strong ? ';font-weight:600' : ''
    }">${value}</td></tr>`;

  const html = `<!doctype html>
<meta charset="utf-8">
<title>Invoice ${credit.id}</title>
<style>
  body { font: 14px/1.6 system-ui, sans-serif; margin: 48px; color: #111; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  table { border-collapse: collapse; margin-top: 24px; width: 360px; }
  td { padding: 6px 0; border-bottom: 1px solid #eee; }
  .note { margin-top: 32px; color: #666; font-size: 12px; }
</style>
<h1>Invoice</h1>
<div>${organizationName}</div>
<div>${stamp(credit.createdAt)}</div>
<div>Reference ${credit.id}</div>
<table>
  ${row('Credit', formatUsd(credit.amountUsd))}
  ${row('Platform fee', formatUsd(credit.platformFeeUsd))}
  ${row('Tax (no jurisdiction on file)', formatUsd(credit.taxUsd))}
  ${row('Total charged', formatUsd(credit.totalUsd), true)}
</table>
<div>Payment method: ${credit.paymentMethod ?? 'None on file'}</div>
${
  credit.source === 'test_credit'
    ? '<p class="note">Recorded as a test credit. No payment provider was involved and no card was charged.</p>'
    : ''
}`;
  save(`sequel-invoice-${credit.id}.html`, html, 'text/html');
}
