import type { AnyModel } from '@sequel/core';
import { formatUsd } from '@sequel/core/pricing';
import { ProviderMark } from './provider-mark';

/**
 * The catalogue, moving.
 *
 * Three rows, alternating direction, because a catalogue this size is the
 * product and a static list of eight rows undersells it. Opposing directions
 * also stop the rows reading as one block sliding past — the eye catches the
 * shear between them and reads it as many rather than as a banner.
 *
 * Each row renders its models twice and travels exactly half its own width,
 * which is what makes the loop seamless: at the end of the animation the
 * second copy sits exactly where the first one started.
 *
 * The cards carry real names, modalities and published rates, so this is the
 * catalogue rather than a decoration shaped like one.
 */
export function ModelMarquee({ rows }: { rows: AnyModel[][] }) {
  return (
    <div
      className="sequel-marquee space-y-3"
      /* The rows run the full width of the section and fade out at both
         ends, so cards leave the frame instead of being chopped by it. */
      style={{
        maskImage:
          'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)',
      }}
    >
      {rows.map((models, index) => (
        <div key={index} className="flex overflow-hidden">
          <div
            className={`flex w-max shrink-0 gap-3 ${
              index % 2 === 0 ? 'marquee-left' : 'marquee-right'
            }`}
            /* Longer rows take proportionally longer, so every row moves at
               the same speed rather than the same cadence. */
            style={{ animationDuration: `${models.length * 7}s` }}
          >
            {[...models, ...models].map((model, copy) => (
              <Card key={`${model.id}-${copy}`} model={model} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Card({ model }: { model: AnyModel }) {
  const rate = model.rates[0];

  return (
    <div className="flex w-[258px] shrink-0 items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
      <ProviderMark provider={model.provider} name={model.name} />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] text-[var(--color-text)]">{model.name}</span>
        <span className="nums mt-0.5 block truncate font-mono text-[11.5px] text-[var(--color-dim)]">
          {model.modality}
          {rate ? ` · ${formatUsd(rate.usd)}/${rate.unit}` : ''}
        </span>
      </span>
    </div>
  );
}
