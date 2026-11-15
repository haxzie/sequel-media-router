import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { WalletCredit } from './wallet';

/**
 * Receipt and invoice, drawn rather than templated.
 *
 * Generated on the server so the figures come from the ledger rather than from
 * whatever the browser happened to be holding, and so the document cannot be
 * edited into a different number before it is saved.
 *
 * pdf-lib's standard fonts are metric-only — nothing is embedded and no font
 * file ships — which keeps these a few KB and works unchanged on Workers.
 */

// Letter, in points.
const PAGE = { width: 612, height: 792 };
const MARGIN = 56;
const RIGHT = PAGE.width - MARGIN;

const INK = rgb(0.07, 0.07, 0.07);
const MUTED = rgb(0.45, 0.45, 0.45);
const FAINT = rgb(0.85, 0.85, 0.85);

export interface DocumentInput {
  credit: WalletCredit;
  organizationName: string;
  addedByName: string | null;
  documentType: 'receipt' | 'invoice';
}

function usd(value: string): string {
  const n = Number(value);
  return `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}

function stamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export async function renderBillingDocument(input: DocumentInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE.width, PAGE.height]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const title = input.documentType === 'receipt' ? 'Receipt' : 'Invoice';
  pdf.setTitle(`Sequel ${title} ${input.credit.id}`);
  pdf.setProducer('Sequel');
  pdf.setCreationDate(new Date(input.credit.createdAt));

  let y = PAGE.height - MARGIN;

  // Masthead
  page.drawText('Sequel', { x: MARGIN, y: y - 18, size: 20, font: bold, color: INK });
  drawRight(page, title.toUpperCase(), {
    y: y - 14,
    size: 10,
    font: bold,
    color: MUTED,
    spacing: 1.4,
  });
  y -= 34;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: RIGHT, y },
    thickness: 1,
    color: FAINT,
  });
  y -= 30;

  // Two columns of metadata: who it is for, and which document this is.
  const leftLabels: Array<[string, string]> = [
    ['Billed to', input.organizationName],
    ['Added by', input.addedByName ?? '—'],
  ];
  const rightLabels: Array<[string, string]> = [
    ['Reference', input.credit.id],
    ['Date', stamp(input.credit.createdAt)],
    ['Payment method', input.credit.paymentMethod ?? 'None on file'],
  ];

  const blockTop = y;
  for (const [label, value] of leftLabels) {
    page.drawText(label.toUpperCase(), { x: MARGIN, y, size: 7, font: bold, color: MUTED });
    page.drawText(value, { x: MARGIN, y: y - 14, size: 10, font: regular, color: INK });
    y -= 34;
  }

  let ry = blockTop;
  for (const [label, value] of rightLabels) {
    drawRight(page, label.toUpperCase(), { y: ry, size: 7, font: bold, color: MUTED });
    drawRight(page, value, { y: ry - 14, size: 10, font: regular, color: INK });
    ry -= 34;
  }

  y = Math.min(y, ry) - 16;

  // Line items
  page.drawText('DESCRIPTION', { x: MARGIN, y, size: 7, font: bold, color: MUTED });
  drawRight(page, 'AMOUNT', { y, size: 7, font: bold, color: MUTED });
  y -= 10;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: RIGHT, y }, thickness: 1, color: FAINT });
  y -= 22;

  const items: Array<{ label: string; note?: string; amount: string }> = [
    { label: 'Wallet credit', amount: input.credit.amountUsd },
    { label: 'Platform fee', amount: input.credit.platformFeeUsd },
    { label: 'Tax', note: 'No tax jurisdiction on file', amount: input.credit.taxUsd },
  ];

  for (const item of items) {
    page.drawText(item.label, { x: MARGIN, y, size: 10, font: regular, color: INK });
    drawRight(page, usd(item.amount), { y, size: 10, font: regular, color: INK });
    if (item.note) {
      y -= 12;
      page.drawText(item.note, { x: MARGIN, y, size: 8, font: regular, color: MUTED });
    }
    y -= 24;
  }

  y += 6;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: RIGHT, y }, thickness: 1, color: FAINT });
  y -= 24;

  page.drawText('Total charged', { x: MARGIN, y, size: 12, font: bold, color: INK });
  drawRight(page, usd(input.credit.totalUsd), { y, size: 12, font: bold, color: INK });

  // Footer, pinned to the page rather than the flow, so it sits in the same
  // place whatever the item count.
  let fy = MARGIN + 40;
  const notes = [
    input.documentType === 'receipt'
      ? `${usd(input.credit.amountUsd)} was added to the ${input.organizationName} wallet.`
      : `${usd(input.credit.amountUsd)} credited to the ${input.organizationName} wallet.`,
  ];
  if (input.credit.source === 'test_credit') {
    notes.push(
      'Recorded as a test credit. No payment provider was involved and no card was charged.',
    );
  }

  page.drawLine({
    start: { x: MARGIN, y: fy + 24 },
    end: { x: RIGHT, y: fy + 24 },
    thickness: 1,
    color: FAINT,
  });

  for (const note of notes) {
    page.drawText(note, { x: MARGIN, y: fy, size: 8, font: regular, color: MUTED });
    fy -= 12;
  }

  return pdf.save();
}

function drawRight(
  page: PDFPage,
  text: string,
  options: { y: number; size: number; font: PDFFont; color: ReturnType<typeof rgb>; spacing?: number },
) {
  const width = options.font.widthOfTextAtSize(text, options.size);
  page.drawText(text, {
    x: RIGHT - width,
    y: options.y,
    size: options.size,
    font: options.font,
    color: options.color,
    ...(options.spacing ? { characterSpacing: options.spacing } : {}),
  });
}
