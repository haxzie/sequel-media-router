'use client';

import { useParams } from 'next/navigation';

import { formatUsd, formatUsdRounded } from '@sequel/core/pricing';
import { Alert, Card, Eyebrow, Field, Modal, PrefixedInput, SubmitButton } from '@sequel/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Wallet {
  creditedUsd: string;
  spentUsd: string;
  availableUsd: string;
}

const PRESETS = ['10', '25', '100'];

export function WalletCard() {
  const { team } = useParams<{ team: string }>();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    const response = await fetch('/api/wallet');
    if (response.ok) setWallet((await response.json()) as Wallet);
  }

  useEffect(() => {
    void load();
  }, []);

  const available = Number(wallet?.availableUsd ?? 0);

  return (
    <Card className="flex h-full flex-col px-5 py-5">
      <Eyebrow>Wallet</Eyebrow>

      <div
        className="display nums mt-2 text-[32px] leading-none"
        // Negative is possible: a run is metered, not refused for funds.
        style={available < 0 ? { color: 'var(--color-pink)' } : undefined}
      >
        {wallet ? formatUsdRounded(wallet.availableUsd) : '—'}
      </div>
      <div className="mt-1 text-[13px] text-[var(--color-muted)]">available</div>

      {wallet && (
        <div className="mt-4 space-y-1 text-[12px] text-[var(--color-dim)]">
          <div className="flex justify-between gap-4">
            <span>Added</span>
            <span className="nums">{formatUsd(wallet.creditedUsd)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Spent</span>
            <span className="nums">{formatUsd(wallet.spentUsd)}</span>
          </div>
        </div>
      )}

      <div className="mt-auto space-y-2 pt-5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
        >
          Add funds
        </button>
        <Link
          href={`/${team}/settings/billing`}
          className="block w-full rounded-full border border-[var(--color-line-strong)] px-4 py-2 text-center text-[13px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          Billing
        </Link>
      </div>

      <AddFundsDialog
        open={open}
        onClose={() => setOpen(false)}
        onAdded={(next) => setWallet(next)}
      />
    </Card>
  );
}

function AddFundsDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (wallet: Wallet) => void;
}) {
  const [amount, setAmount] = useState('25');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amountUsd: amount }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? 'Could not add funds.');
      setBusy(false);
      return;
    }

    onAdded((await response.json()) as Wallet);
    setBusy(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add funds">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Amount">
          <PrefixedInput
            prefix="$"
            type="number"
            min="1"
            max="10000"
            step="1"
            required
            autoFocus
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </Field>

        {/* Shortcuts for the field above, so they read as presets rather than
            as the choice itself. */}
        <div className="flex gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(preset)}
              className={[
                'flex-1 rounded-lg border py-2 text-[13px] transition-colors',
                amount === preset
                  ? 'border-[var(--color-text)] bg-[var(--color-card-hover)] text-[var(--color-text)]'
                  : 'border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-line-strong)]',
              ].join(' ')}
            >
              ${preset}
            </button>
          ))}
        </div>

        {error && <Alert>{error}</Alert>}

        <p className="text-[12px] leading-relaxed text-[var(--color-dim)]">
          Tax and platform fees will be applied at checkout.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2.5 text-[14px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Cancel
          </button>
          <SubmitButton busy={busy} disabled={!Number(amount)}>
            Add test credit
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
