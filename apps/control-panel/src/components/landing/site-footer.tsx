import Link from 'next/link';
import { AccountLink } from './account-link';
import { Wordmark } from './mark';

/**
 * The site footer, shared by every public page.
 *
 * Each page used to end with its own two-item strip, which meant the
 * company pages had nowhere to be linked from and the legal ones nowhere
 * to live. One component, four columns: what the product is, what you can
 * read, who we are, and the two documents a buyer's lawyer asks for.
 */

const COLUMNS = [
  {
    heading: 'Product',
    links: [
      { href: '/models', label: 'Models' },
      { href: '/#pricing', label: 'Pricing' },
      { href: '/docs', label: 'Docs' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-line)] pb-10 pt-14">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" aria-label="Sequel home">
            <Wordmark className="text-[var(--color-text)]" />
          </Link>
          <p className="mt-3 max-w-[32ch] text-[13px] leading-relaxed text-[var(--color-muted)]">
            Image, video and audio models behind one connection, for the agents that use them.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.heading}>
            <div className="text-[11px] uppercase tracking-wide text-[var(--color-dim)]">
              {column.heading}
            </div>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13.5px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 flex items-center justify-between border-t border-[var(--color-line)] pt-6 text-[13px] text-[var(--color-dim)]">
        <span>© {new Date().getFullYear()} Sequel</span>
        <AccountLink className="transition-colors hover:text-[var(--color-text)]" />
      </div>
    </footer>
  );
}
