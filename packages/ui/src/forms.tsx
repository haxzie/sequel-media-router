'use client';

/**
 * Form primitives.
 *
 * The dashboard had no forms until auth arrived, so these are new rather than
 * extracted. They follow the same rules as the rest of the system: pill radii
 * on controls, card radii on containers, and no colour that isn't a token.
 */
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[13px] text-[var(--color-muted)]">{label}</div>
      {children}
      {error ? (
        <div className="mt-1.5 text-[12px] text-[var(--color-pink)]">{error}</div>
      ) : hint ? (
        <div className="mt-1.5 text-[12px] text-[var(--color-dim)]">{hint}</div>
      ) : null}
    </label>
  );
}

const control =
  'w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] px-3.5 py-2.5 text-[14px] text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-dim)] focus:border-[var(--color-line-strong)] disabled:opacity-50';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props;
  return <input {...rest} className={`${control} ${className}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', children, ...rest } = props;
  return (
    <select {...rest} className={`${control} appearance-none ${className}`}>
      {children}
    </select>
  );
}

/**
 * Input with a fixed unit stuck to its left, behind a divider.
 *
 * A `$` typed into the field would be parsed as part of the number and a `$`
 * floated over it would sit on top of the caret. Putting it outside the input
 * but inside the border makes it unmistakably a label rather than content.
 */
export function PrefixedInput({
  prefix,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { prefix: string }) {
  const { className = '', ...rest } = props;
  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] focus-within:border-[var(--color-line-strong)]">
      <span
        className="flex select-none items-center border-r border-[var(--color-line)] px-3.5 text-[14px] text-[var(--color-dim)]"
        aria-hidden
      >
        {prefix}
      </span>
      <input
        {...rest}
        className={`w-full bg-transparent px-3.5 py-2.5 text-[14px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-dim)] disabled:opacity-50 ${className}`}
      />
    </div>
  );
}

/**
 * A radio group that looks like a list of cards.
 *
 * Single-choice, so the indicator is a ring that fills when chosen — a square
 * checkbox would promise multi-select. Without any indicator the only signal
 * was a border colour, which is too quiet to read as "this is your answer".
 */
export function ChoiceGroup<T extends string>({
  value,
  options,
  onChange,
  columns = 1,
}: {
  value: T | null;
  options: Array<{ value: T; label: ReactNode; description?: string }>;
  onChange: (next: T) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className={`grid gap-2 ${columns === 2 ? 'grid-cols-2' : ''}`}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={[
              'flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors',
              active
                ? 'border-[var(--color-text)] bg-[var(--color-card-hover)]'
                : 'border-[var(--color-line)] bg-[var(--color-card)] hover:border-[var(--color-line-strong)]',
            ].join(' ')}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] text-[var(--color-text)]">
                {option.label}
              </span>
              {option.description && (
                <span className="mt-0.5 block truncate text-[12px] text-[var(--color-dim)]">
                  {option.description}
                </span>
              )}
            </span>
            <CheckRing active={active} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * The multi-select sibling of ChoiceGroup.
 *
 * Same card, same layout, same right-hand indicator — a square one, because a
 * circle that fills is the shape people read as "pick one" and these are not
 * exclusive. Shares the markup so the two cannot drift apart.
 */
export function MultiChoiceGroup<T extends string>({
  value,
  options,
  onChange,
  columns = 1,
}: {
  value: T[];
  options: Array<{ value: T; label: ReactNode; description?: string }>;
  onChange: (next: T[]) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className={`grid gap-2 ${columns === 2 ? 'grid-cols-2' : ''}`}>
      {options.map((option) => {
        const active = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            role="checkbox"
            aria-checked={active}
            onClick={() =>
              onChange(
                active ? value.filter((entry) => entry !== option.value) : [...value, option.value],
              )
            }
            className={[
              'flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors',
              active
                ? 'border-[var(--color-text)] bg-[var(--color-card-hover)]'
                : 'border-[var(--color-line)] bg-[var(--color-card)] hover:border-[var(--color-line-strong)]',
            ].join(' ')}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] text-[var(--color-text)]">
                {option.label}
              </span>
              {option.description && (
                <span className="mt-0.5 block truncate text-[12px] text-[var(--color-dim)]">
                  {option.description}
                </span>
              )}
            </span>
            <CheckBox active={active} />
          </button>
        );
      })}
    </div>
  );
}

function CheckBox({ active }: { active: boolean }) {
  return (
    <span
      className={[
        'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border transition-colors',
        active ? 'border-white bg-white text-[#0a0a0a]' : 'border-[var(--color-line-strong)]',
      ].join(' ')}
      aria-hidden
    >
      {active && (
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
          <path
            d="m3 6.2 2.1 2.1L9 4.4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

function CheckRing({ active }: { active: boolean }) {
  return (
    <span
      className={[
        'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors',
        active ? 'border-white bg-white text-[#0a0a0a]' : 'border-[var(--color-line-strong)]',
      ].join(' ')}
      aria-hidden
    >
      {active && (
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
          <path
            d="m3 6.2 2.1 2.1L9 4.4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

/**
 * Wizard progress. Segments rather than numbered dots: the point is how much
 * is left, and three labelled circles would outweigh the question itself.
 */
export function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={[
            'h-[3px] flex-1 rounded-full transition-colors',
            index < step ? 'bg-white' : 'bg-[var(--color-line-strong)]',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

/** Submit-capable button. PrimaryButton is deliberately type="button". */
export function SubmitButton({
  children,
  disabled,
  busy,
  full,
}: {
  children: ReactNode;
  disabled?: boolean;
  busy?: boolean;
  full?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || busy}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-40',
        full ? 'w-full' : '',
      ].join(' ')}
    >
      {busy ? 'Working…' : children}
    </button>
  );
}

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'info'; children: ReactNode }) {
  const tones = {
    error: 'text-[var(--color-pink)]',
    info: 'text-[var(--color-muted)]',
  } as const;
  return (
    <div className={`rounded-xl bg-[var(--color-card)] px-3.5 py-3 text-[13px] leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  );
}

/** Initial-letter avatar. Used for members, where we have no photo to show. */
export function Avatar({ name, src, size = 32 }: { name: string; src?: string | null; size?: number }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-[var(--color-card-hover)] font-medium uppercase text-[var(--color-muted)]"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {name.trim().charAt(0) || '?'}
    </div>
  );
}
