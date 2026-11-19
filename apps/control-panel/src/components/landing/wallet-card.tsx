import { Arcs, Wordmark } from './mark';

/**
 * The wallet, drawn as the thing everyone already understands.
 *
 * Pay-as-you-go is hard to picture — a sentence about balances reads as
 * terms and conditions. A card does the explaining: one object, your name
 * on it, a figure that goes down. The two slivers behind it are the point
 * of the section: the per-provider accounts this one replaces, close
 * enough to recognise and faded enough to be past tense.
 *
 * Everything is drawn in CSS against the brand tokens, so it stays sharp
 * and cannot drift from the palette the way an exported mock would.
 */
export function WalletCard() {
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      {/* The accounts it stands in for. */}
      <div className="absolute inset-x-10 -top-6 aspect-[1.586] rounded-[22px] border border-[var(--color-line)] bg-[var(--color-surface)] opacity-40 blur-[1.5px]" />
      <div className="absolute inset-x-5 -top-3 aspect-[1.586] rounded-[22px] border border-[var(--color-line)] bg-[var(--color-card)] opacity-70" />

      <div className="relative aspect-[1.586] overflow-hidden rounded-[22px] border border-white/[0.12] bg-[linear-gradient(145deg,#232323_0%,#111111_52%,#1a1a1a_100%)] p-6 shadow-[0_44px_90px_-34px_rgba(0,0,0,0.95)]">
        {/* The mark, at card scale — same arcs as the page's own watermark. */}
        <Arcs className="pointer-events-none absolute -right-[14%] -top-[46%] h-[170%] w-[170%] text-white opacity-[0.07]" />
        {/* A single sheen, angled across the corner: enough to read as a
            surface catching light rather than as a flat rectangle. */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,transparent_34%,rgba(255,255,255,0.07)_50%,transparent_63%)]" />

        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between">
            <Wordmark className="text-white" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
              pay as you go
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3.5">
            <Chip />
            <span className="font-mono text-[13px] tracking-[0.3em] text-white/30">
              •••• •••• ••••
            </span>
          </div>

          <div className="mt-auto flex items-end justify-between gap-4">
            <div>
              <div className="text-[9.5px] uppercase tracking-[0.2em] text-white/35">Balance</div>
              <div className="nums mt-1.5 text-[27px] leading-none tracking-tight text-white">
                $248.60
              </div>
            </div>
            <div className="text-right text-[11px] leading-[1.6] text-white/45">
              image · video · audio
              <br />
              one balance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The contact plate. Three strokes is all the eye needs to read 'card'. */
function Chip() {
  return (
    <span
      className="relative block h-[26px] w-[34px] shrink-0 overflow-hidden rounded-[6px] bg-[linear-gradient(140deg,#d8cdb6,#8d8471_46%,#efe6d2)]"
      aria-hidden
    >
      <span className="absolute inset-x-0 top-[7px] h-px bg-black/25" />
      <span className="absolute inset-x-0 top-[13px] h-px bg-black/25" />
      <span className="absolute inset-x-0 top-[19px] h-px bg-black/25" />
      <span className="absolute inset-y-0 left-[11px] w-px bg-black/25" />
      <span className="absolute inset-y-0 left-[23px] w-px bg-black/25" />
    </span>
  );
}
