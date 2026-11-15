/**
 * Shared primitives.
 *
 * Everything that repeats across pages lives here so the radii, borders and
 * muted tones stay identical — the reference's look depends on that consistency
 * more than on any single element.
 */
import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  tone = 'default',
}: {
  children: ReactNode;
  className?: string;
  tone?: 'default' | 'periwinkle' | 'pink' | 'sand' | 'sky';
}) {
  const tones = {
    default: 'bg-[var(--color-card)] border border-[var(--color-line)] text-[var(--color-text)]',
    periwinkle: 'bg-[var(--color-periwinkle)] text-[#0a0a0a] border border-transparent',
    pink: 'bg-[var(--color-pink)] text-[#0a0a0a] border border-transparent',
    sand: 'bg-[var(--color-sand)] text-[#0a0a0a] border border-transparent',
    sky: 'bg-[var(--color-sky)] text-[#0a0a0a] border border-transparent',
  } as const;

  return (
    <div className={`rounded-[var(--radius-card)] ${tones[tone]} ${className}`}>{children}</div>
  );
}

/** Small uppercase label. Used for sidebar sections and card eyebrows. */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-dim)] ${className}`}
    >
      {children}
    </div>
  );
}

/** Fully-rounded badge. `tone` carries meaning; default is neutral. */
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'sky' | 'pink' | 'mint' | 'outline';
}) {
  const tones = {
    neutral: 'bg-white/8 text-[var(--color-muted)]',
    sky: 'bg-[var(--color-sky)] text-[#0a0a0a]',
    pink: 'bg-[var(--color-pink)] text-[#0a0a0a]',
    mint: 'bg-[var(--color-mint)] text-[#0a0a0a]',
    outline: 'border border-[var(--color-line-strong)] text-[var(--color-muted)]',
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-[3px] text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** A coloured dot plus a label, as the reference uses for row status. */
export function StatusDot({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px]">
      <span className="h-[6px] w-[6px] rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

/** Pill segmented control. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (next: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-[var(--color-card)] p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors',
              active
                ? 'bg-[#2c2c2c] text-[var(--color-text)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]',
            ].join(' ')}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** White primary action, as on the reference's "Invite user". */
export function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
        active
          ? 'border-transparent bg-white text-[#0a0a0a]'
          : 'border-[var(--color-line-strong)] text-[var(--color-muted)] hover:text-[var(--color-text)]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/** Page title block: breadcrumb pill, large title, metadata line. */
export function PageHeader({
  breadcrumb,
  title,
  meta,
  actions,
}: {
  breadcrumb: string[];
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-card)] px-3.5 py-1.5 text-[13px]">
            {breadcrumb.map((crumb, index) => (
              <span key={crumb} className="flex items-center gap-1.5">
                {index > 0 && <span className="text-[var(--color-dim)]">/</span>}
                <span
                  className={
                    index === breadcrumb.length - 1
                      ? 'text-[var(--color-text)]'
                      : 'text-[var(--color-muted)]'
                  }
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>

          <h1 className="display mt-5 text-[44px] leading-[1.05]">{title}</h1>
          {meta && <p className="mt-3 text-[15px] text-[var(--color-muted)]">{meta}</p>}
        </div>
        {actions && <div className="shrink-0 pt-1">{actions}</div>}
      </div>
    </div>
  );
}

/**
 * Tab strip with icons, for a page that holds several settings surfaces.
 *
 * Unlike `Segmented`, which filters one list in place, these switch what the
 * page is about — so they read as navigation: underline on the active tab, no
 * pill, and enough weight to sit under a page title.
 */
export function Tabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string; icon?: (props: { className?: string }) => ReactNode }>;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-[var(--color-line)]">
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-current={active ? 'page' : undefined}
            className={[
              '-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-[14px] transition-colors',
              active
                ? 'border-[var(--color-text)] text-[var(--color-text)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]',
            ].join(' ')}
          >
            {Icon && <Icon />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
