/**
 * One mark per docs page, for the tree on the left.
 *
 * Drawn here rather than pulled from an icon set: eleven glyphs at one size
 * and one weight is less code than a dependency, and they match the stroke
 * the rest of this UI uses — 16 viewBox, currentColor at 1.5, round caps.
 *
 * They are decorative. The label beside each one is the thing being read,
 * so every glyph is aria-hidden and none of them carry meaning alone.
 */

export type IconName =
  | 'start'
  | 'creators'
  | 'developers'
  | 'concepts'
  | 'search'
  | 'generate'
  | 'tasks'
  | 'files'
  | 'sdk'
  | 'api'
  | 'mcp';

const PATHS: Record<IconName, React.ReactNode> = {
  start: (
    <>
      <circle cx="8" cy="8" r="5.75" />
      <path d="M10.4 5.6 9.2 9.2 5.6 10.4 6.8 6.8z" />
    </>
  ),
  creators: (
    <>
      <path d="M5.8 2.4 6.7 4.6l2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z" />
      <path d="M11.4 8.2l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6z" />
    </>
  ),
  developers: (
    <>
      <path d="M6 11 3 8l3-3" />
      <path d="M10 5l3 3-3 3" />
    </>
  ),
  concepts: (
    <>
      <path d="M8 2.2 13.8 5 8 7.8 2.2 5z" />
      <path d="M2.2 8 8 10.8 13.8 8" />
      <path d="M2.2 11 8 13.8 13.8 11" />
    </>
  ),
  search: (
    <>
      <circle cx="7.2" cy="7.2" r="4.4" />
      <path d="m10.5 10.5 3 3" />
    </>
  ),
  generate: (
    <>
      <rect x="2.4" y="3" width="11.2" height="10" rx="2.4" />
      <circle cx="6" cy="6.4" r="1" />
      <path d="m3 11.4 2.8-2.4 2.4 2 2-1.6 3 2.6" />
    </>
  ),
  tasks: (
    <>
      <path d="m2.6 4.4.9.9 1.7-1.9" />
      <path d="m2.6 11.2.9.9 1.7-1.9" />
      <path d="M7.4 4.6h6M7.4 11.4h6M7.4 8h6" />
    </>
  ),
  files: (
    <>
      <path d="M4 2.2h4.6L12 5.6v8.2H4z" />
      <path d="M8.4 2.2v3.6H12" />
    </>
  ),
  sdk: (
    <>
      <path d="M8 2.2 13 5v6L8 13.8 3 11V5z" />
      <path d="m3 5 5 2.8L13 5" />
      <path d="M8 7.8v6" />
    </>
  ),
  api: (
    <>
      <path d="M6.2 2.6c-1.6 0-1 3.6-3 5.4 2 1.8 1.4 5.4 3 5.4" />
      <path d="M9.8 2.6c1.6 0 1 3.6 3 5.4-2 1.8-1.4 5.4-3 5.4" />
    </>
  ),
  mcp: <path d="M8.6 2.2 4.4 8.8h3.2l-.6 5 4.6-6.8H8.2z" />,
};

export function DocIcon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-[15px] w-[15px] shrink-0 ${className}`}
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
