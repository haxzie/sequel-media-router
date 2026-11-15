'use client';

import { AnvilIcon, Alert, Field, Input, SubmitButton } from '@sequel/ui';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { GoogleMark } from './google-mark';

type Stage = 'idle' | 'sending' | 'sent';

/**
 * One screen for both returning and new people. There is no sign-up form: an
 * address we have not seen becomes an account, and onboarding asks for the
 * rest. A separate sign-up page would only ask the same question twice.
 */
export function LoginForm({
  googleEnabled,
  consoleOnlyEmail,
  callbackURL,
}: {
  googleEnabled: boolean;
  consoleOnlyEmail: boolean;
  callbackURL: string;
}) {
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setStage('sending');
    const { error: failure } = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL,
    });
    if (failure) {
      setError(failure.message ?? 'Could not send the link. Try again.');
      setStage('idle');
      return;
    }
    setStage('sent');
  }

  if (stage === 'sent') {
    return (
      <div className="text-center">
        <Mark />
        <h1 className="mt-6 text-[22px] font-medium tracking-tight">Check your email</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
          We sent a sign-in link to <span className="text-[var(--color-text)]">{email}</span>. It
          expires in 15 minutes.
        </p>
        {consoleOnlyEmail && (
          <div className="mt-5 text-left">
            <Alert tone="info">
              No email provider is configured yet, so nothing was actually sent — the link was
              printed to the dev server console. Open it from there.
            </Alert>
          </div>
        )}
        <button
          type="button"
          onClick={() => setStage('idle')}
          className="mt-5 text-[13px] text-[var(--color-dim)] transition-colors hover:text-[var(--color-text)]"
        >
          Use a different address
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center">
        <Mark />
        <h1 className="mt-6 text-[22px] font-medium tracking-tight">Sign in to Sequel</h1>
        <p className="mt-2 text-[14px] text-[var(--color-muted)]">
          One MCP server for every media model.
        </p>
      </div>

      {googleEnabled ? (
        <button
          type="button"
          onClick={() => authClient.signIn.social({ provider: 'google', callbackURL })}
          className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-full bg-white px-4 py-2.5 text-[14px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
        >
          <GoogleMark />
          Continue with Google
        </button>
      ) : (
        <div className="mt-8">
          <Alert tone="info">
            Google sign-in is off until GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set. Email
            still works.
          </Alert>
        </div>
      )}

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--color-line)]" />
        <span className="text-[12px] text-[var(--color-dim)]">or</span>
        <span className="h-px flex-1 bg-[var(--color-line)]" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        {error && <Alert>{error}</Alert>}

        <SubmitButton full busy={stage === 'sending'} disabled={!email.trim()}>
          Email me a sign-in link
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-[12px] leading-relaxed text-[var(--color-dim)]">
        No account needed — signing in with a new address creates one.
      </p>
    </div>
  );
}

function Mark() {
  return (
    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#0a0a0a]">
      <AnvilIcon className="h-6 w-6" />
    </div>
  );
}
