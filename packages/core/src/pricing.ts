/**
 * Cost estimation.
 *
 * Providers quote in four incompatible units. This normalises them into one
 * dollar figure per run so the control panel and `run_models` can report a
 * number before anything is spent.
 *
 * Every figure is an ESTIMATE unless a provider returns an actual. Callers must
 * keep the `estimated` flag with the number — a quoted price presented as a
 * charged price is the kind of thing that ends up in a support ticket.
 */
import type { AnyModel } from './define';
import type { Rate } from './types';

export interface CostEstimate {
  usd: string;
  estimated: boolean;
  /** Human-readable derivation, e.g. "8s @ $0.20/second". Shown in the UI. */
  basis: string;
}

function money(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0.000000';
  return n.toFixed(6);
}

/** Pull a duration in seconds out of whatever field a model happens to use. */
function durationSeconds(input: Record<string, unknown>): number | undefined {
  const raw = input.duration ?? input.duration_s ?? input.durationSeconds ?? input.seconds;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const m = raw.match(/([\d.]+)/);
    if (m?.[1]) return Number(m[1]);
  }
  return undefined;
}

function textLength(input: Record<string, unknown>): number | undefined {
  const raw = input.text ?? input.prompt ?? input.input;
  return typeof raw === 'string' ? raw.length : undefined;
}

/**
 * Pick the rate matching the request. Models publish several rates qualified by
 * resolution and audio; we match on those tokens and fall back to the first
 * (cheapest, by catalog convention) rate.
 */
export function selectRate(model: AnyModel, input: Record<string, unknown>): Rate | undefined {
  if (model.rates.length === 0) return undefined;
  const resolution = String(input.resolution ?? '').toLowerCase();
  const wantsAudio = input.generate_audio === true || input.audio === true;

  const scored = model.rates.map((rate) => {
    const q = (rate.qualifier ?? '').toLowerCase();
    let score = 0;
    if (resolution && q.includes(resolution)) score += 2;
    if (wantsAudio && q.includes('audio')) score += 2;
    if (!wantsAudio && q.includes('audio')) score -= 2;
    return { rate, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]!.score > 0 ? scored[0]!.rate : model.rates[0];
}

/**
 * Generic estimator. A model with unusual billing supplies its own `estimate`
 * in its definition and this is never consulted for it.
 */
export function estimateCost(model: AnyModel, input: Record<string, unknown>): CostEstimate {
  if (model.estimate) {
    return { usd: model.estimate(input), estimated: true, basis: 'model-supplied estimate' };
  }

  const rate = selectRate(model, input);
  if (!rate) return { usd: '0.000000', estimated: true, basis: 'no published rate' };

  const unitPrice = Number(rate.usd);
  const qualifier = rate.qualifier ? ` ${rate.qualifier}` : '';

  switch (rate.unit) {
    case 'second': {
      const secs = durationSeconds(input) ?? 6;
      return {
        usd: money(unitPrice * secs),
        estimated: true,
        basis: `${secs}s @ $${rate.usd}/second${qualifier}`,
      };
    }
    case 'character': {
      const chars = textLength(input) ?? 0;
      return {
        usd: money(unitPrice * chars),
        estimated: true,
        basis: `${chars} chars @ $${rate.usd}/character`,
      };
    }
    case '1k_characters': {
      const chars = textLength(input) ?? 0;
      return {
        usd: money((unitPrice * chars) / 1000),
        estimated: true,
        basis: `${chars} chars @ $${rate.usd}/1k characters`,
      };
    }
    case 'minute': {
      const mins = (durationSeconds(input) ?? 60) / 60;
      return {
        usd: money(unitPrice * mins),
        estimated: true,
        basis: `${mins.toFixed(2)} min @ $${rate.usd}/minute`,
      };
    }
    case 'image': {
      const n = typeof input.n === 'number' ? input.n : 1;
      return { usd: money(unitPrice * n), estimated: true, basis: `${n} × $${rate.usd}/image` };
    }
    case 'tile_512': {
      // Workers AI image models bill per 512×512 tile, plus per diffusion step.
      const width = Number(input.width ?? 1024);
      const height = Number(input.height ?? 1024);
      const tiles = Math.ceil(width / 512) * Math.ceil(height / 512);
      const steps = Number(input.steps ?? 4);
      const stepRate = model.rates.find((r) => r.unit === 'step');
      const stepCost = stepRate ? Number(stepRate.usd) * steps : 0;
      return {
        usd: money(unitPrice * tiles + stepCost),
        estimated: true,
        basis: `${tiles} tile(s) @ $${rate.usd}${stepRate ? ` + ${steps} steps @ $${stepRate.usd}` : ''}`,
      };
    }
    case 'track':
    case 'clip': {
      const n = typeof input.n === 'number' ? input.n : 1;
      return {
        usd: money(unitPrice * n),
        estimated: true,
        basis: `${n} × $${rate.usd}/${rate.unit}${qualifier}`,
      };
    }
    case '1m_tokens':
      // Token-billed image models cannot be priced before the call returns usage.
      return {
        usd: '0.000000',
        estimated: true,
        basis: `token-billed — actual cost reported after the run`,
      };
    default:
      return { usd: money(unitPrice), estimated: true, basis: `$${rate.usd}/${rate.unit}` };
  }
}

export function addMoney(a: string, b: string): string {
  return money(Number(a) + Number(b));
}

/**
 * Money for display, at full stored precision.
 *
 * Costs are carried as fixed 6-decimal strings, and rounding them for display
 * hid real spend: a $0.0059 run read as $0.01, and a whole page of sub-cent
 * audio runs read as $0.00 each. So show every digit that is actually there,
 * trimming only trailing zeros and never dropping below two decimals.
 *
 * toFixed(6) first also launders float noise out of summed totals
 * (3.9600000000000004 -> "3.960000" -> $3.96).
 */
export function formatUsd(value: string | number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0.00';
  const [whole, frac = '000000'] = n.toFixed(6).split('.');
  const trimmed = frac.replace(/0+$/, '');
  return `$${whole}.${trimmed.length < 2 ? frac.slice(0, 2) : trimmed}`;
}
