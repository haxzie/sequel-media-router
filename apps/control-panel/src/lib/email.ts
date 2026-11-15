/**
 * Outbound email.
 *
 * There is no provider wired up yet, so a magic link is written to the server
 * log and nothing is sent. That is a real limitation, not a stub to overlook:
 * magic-link login works for anyone who can read this process's output and for
 * nobody else. Wire Cloudflare Email Service or Resend here before this is
 * usable by a second person.
 */
export async function sendMagicLink({ email, url }: { email: string; url: string }) {
  console.info(
    `\n  ── magic link ───────────────────────────────────────────\n  to:   ${email}\n  open: ${url}\n  ─────────────────────────────────────────────────────────\n`,
  );
}

/** True when a link has to be read off the console rather than an inbox. */
export const EMAIL_IS_CONSOLE_ONLY = true;
