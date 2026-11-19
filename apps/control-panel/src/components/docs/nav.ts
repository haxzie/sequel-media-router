import type { IconName } from './icons';

export interface DocPage {
  slug: string;
  title: string;
  icon: IconName;
  /** The exported component that renders it, so its headings can be read
   *  out of the source at build time. See lib/docs-headings.ts. */
  component: string;
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
      { icon: 'start', slug: '', component: 'GettingStarted', title: 'Getting started' },
      { icon: 'creators', slug: 'creators', component: 'ForCreators', title: 'For creators' },
      { icon: 'developers', slug: 'developers', component: 'ForDevelopers', title: 'For developers' },
      { icon: 'concepts', slug: 'concepts', component: 'Concepts', title: 'Concepts' },
    ],
  },
  {
    title: 'Guides',
    pages: [
      { icon: 'search', slug: 'search', component: 'Search', title: 'Search' },
      { icon: 'generate', slug: 'generate', component: 'Generate', title: 'Generate' },
      { icon: 'tasks', slug: 'tasks', component: 'Tasks', title: 'Tasks' },
      { icon: 'files', slug: 'files', component: 'Files', title: 'Files' },
    ],
  },
  {
    title: 'Reference',
    pages: [
      { icon: 'sdk', slug: 'sdk', component: 'SdkReference', title: 'SDK reference' },
      { icon: 'api', slug: 'api', component: 'ApiReference', title: 'API reference' },
      { icon: 'mcp', slug: 'mcp', component: 'McpReference', title: 'MCP tools' },
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
