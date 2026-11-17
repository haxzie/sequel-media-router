'use client';

import { useState, useTransition } from 'react';
import { decide } from '@/app/(auth)/consent/actions';

/**
 * Plain English for the scopes we issue.
 *
 * A screen that says "mcp:tools" is not consent, it is a formality. Anything
 * unrecognised is shown raw rather than guessed at.
 */
const SCOPES: Record<string, string> = {
  'mcp:tools': 'Generate images, video and audio, and read the runs it started',
  openid: 'Confirm who you are',
  profile: 'See your name and avatar',
  email: 'See your email address',
  offline_access: 'Stay connected without asking you again',
};

export function ConsentForm({
  oauthQuery,
  clientName,
  clientIcon,
  scopes,
  account,
}: {
  oauthQuery: string;
  clientName: string;
  clientIcon: string | null;
  scopes: string[];
  account: string;
}) {
  const [pending, start] = useTransition();
  const [choice, setChoice] = useState<'allow' | 'deny' | null>(null);

  function answer(accept: boolean) {
    setChoice(accept ? 'allow' : 'deny');
    start(() => {
      void decide(accept, oauthQuery);
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        {clientIcon ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={clientIcon} alt="" className="h-10 w-10 rounded-xl object-cover" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-card)] text-[15px] text-[var(--color-muted)]">
            {clientName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-[17px] text-[var(--color-text)]">{clientName}</h1>
          <p className="text-[13px] text-[var(--color-dim)]">wants access to your Sequel account</p>
        </div>
      </div>

      {/*
        * Said plainly because it is true, and because a name is the only thing
        * distinguishing a client someone installed from one they did not.
        */}
      <p className="mb-5 rounded-xl bg-[var(--color-card)] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--color-muted)]">
        Anyone can register an app under any name. Only continue if you just asked{' '}
        <span className="text-[var(--color-text)]">{clientName}</span> to connect.
      </p>

      <ul className="mb-6 space-y-2.5">
        {scopes.map((scope) => (
          <li key={scope} className="flex gap-2.5 text-[13px] text-[var(--color-text)]">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[var(--status-done)]">
              <path d="M3.5 8.5l3 3 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{SCOPES[scope] ?? scope}</span>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => answer(false)}
          disabled={pending}
          className="flex-1 rounded-xl border border-[var(--color-line)] px-4 py-2.5 text-[14px] text-[var(--color-muted)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-text)] disabled:opacity-50"
        >
          {pending && choice === 'deny' ? 'Cancelling…' : 'Cancel'}
        </button>
        <button
          type="button"
          onClick={() => answer(true)}
          disabled={pending}
          className="flex-1 rounded-xl bg-white px-4 py-2.5 text-[14px] text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending && choice === 'allow' ? 'Connecting…' : 'Allow'}
        </button>
      </div>

      {account && (
        <p className="mt-4 text-center text-[12px] text-[var(--color-dim)]">Signed in as {account}</p>
      )}
    </div>
  );
}
