import React from 'react';
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import * as reactRouterDom from 'react-router-dom';
const { MemoryRouter, Routes, Route } = (reactRouterDom as any).default || reactRouterDom;
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';

export interface RenderInput {
  path: string;                              // concrete URL, e.g. '/legal'
  Component: React.ComponentType<any>;
  props?: Record<string, unknown>;
  routePattern?: string;                     // React Router pattern
}

export interface RenderOutput { bodyHtml: string; headHtml: string; }

export async function renderRoute(input: RenderInput): Promise<RenderOutput> {
  const routePattern = input.routePattern ?? input.path;
  const helmetContext: { helmet?: any } = {};

  // Force THIS HelmetProvider into SSR mode so it writes to helmetContext rather than
  // mutating document.head. Restore after.
  const prevCanUseDOM = (HelmetProvider as any).canUseDOM;
  (HelmetProvider as any).canUseDOM = false;

  // Filter useLayoutEffect server-side render warning
  const prevConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const first = typeof args[0] === 'string' ? args[0] : '';
    if (first.includes('useLayoutEffect does nothing on the server')) return;
    prevConsoleError(...(args as []));
  };

  try {
    const bodyHtml = renderToString(
      <HelmetProvider context={helmetContext}>
        <ThemeProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={[input.path]}>
              <Routes>
                <Route path={routePattern} element={<input.Component {...(input.props ?? {})} />} />
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    );

    const h = helmetContext.helmet;
    const headHtml = h
      ? [h.title.toString(), h.meta.toString(), h.link.toString(), h.script.toString()].join('\n')
      : '';
    return { bodyHtml, headHtml };
  } finally {
    (HelmetProvider as any).canUseDOM = prevCanUseDOM;
    console.error = prevConsoleError;
  }
}

// Strip the shell's default head tags before injecting per-route ones
const DEFAULT_HEAD_PATTERNS: RegExp[] = [
  /<title>[^<]*<\/title>/i,
  /<meta\s+name="description"[^>]*>/i,
  /<meta\s+property="og:[^"]*"[^>]*>/gi,
  /<meta\s+name="twitter:[^"]*"[^>]*>/gi,
  /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi,
];

/** Pure function: inject rendered head/body/preloaded into the built index.html template. */
export function injectIntoTemplate(
  template: string,
  parts: { headHtml: string; bodyHtml: string }
): string {
  let html = template;
  for (const re of DEFAULT_HEAD_PATTERNS) html = html.replace(re, '');
  html = html.replace('</head>', `${parts.headHtml}\n</head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${parts.bodyHtml}</div>`);
  return html;
}
