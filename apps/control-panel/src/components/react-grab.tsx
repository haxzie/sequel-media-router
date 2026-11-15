'use client';

import { useEffect } from 'react';

/**
 * React Grab, development only.
 *
 * Hover any element, press ⌘C, and the clipboard gets the element plus its
 * component stack with source locations — which is what a coding agent needs
 * to find the code behind something you can see.
 *
 * Loaded as a local devDependency rather than the documented CDN script tag:
 * the version is then pinned in the lockfile, dev works offline, and the
 * browser makes no third-party request while you are signed in.
 *
 * `process.env.NODE_ENV` is inlined at build time, so the dynamic import is
 * statically unreachable in a production bundle and never ships.
 */
export function ReactGrab() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    void import('react-grab');
  }, []);

  return null;
}
