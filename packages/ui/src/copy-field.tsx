'use client';

import { useState } from 'react';
import { CheckIcon, CopyIcon } from './icons';

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-full bg-[var(--color-card)] py-2 pl-5 pr-2">
      <code className="flex-1 truncate font-mono text-[13px] text-[var(--color-text)]">
        {value}
      </code>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
