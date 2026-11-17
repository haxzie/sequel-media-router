export interface DocPage {
  slug: string;
  title: string;
}

export interface DocSection {
  title: string;
  pages: DocPage[];
}

/** The whole table of contents, in reading order. */
export const DOC_SECTIONS: DocSection[] = [
  {
    title: 'Start here',
    pages: [
      { slug: '', title: 'Getting started' },
      { slug: 'concepts', title: 'Concepts' },
    ],
  },
  {
    title: 'Guides',
    pages: [
      { slug: 'search', title: 'Search' },
      { slug: 'generate', title: 'Generate' },
      { slug: 'tasks', title: 'Tasks' },
      { slug: 'files', title: 'Files' },
    ],
  },
  {
    title: 'Reference',
    pages: [
      { slug: 'sdk', title: 'SDK reference' },
      { slug: 'api', title: 'API reference' },
      { slug: 'mcp', title: 'MCP tools' },
    ],
  },
];

export const DOC_PAGES = DOC_SECTIONS.flatMap((section) => section.pages);

export function pageTitle(slug: string): string {
  return DOC_PAGES.find((page) => page.slug === slug)?.title ?? 'Docs';
}

export function href(slug: string): string {
  return slug ? `/docs/${slug}` : '/docs';
}
