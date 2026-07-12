import React from 'react';
import Landing from '../pages/Landing';
import TermsOfUse from '../pages/TermsOfUse';
import staticRoutes from './staticRoutes.json';

export interface PrerenderRoute {
  path: string;
  Component: React.ComponentType<any>;
  props?: Record<string, unknown>;
}

const COMPONENT_BY_PATH: Record<string, React.ComponentType<any>> = {
  '/': Landing,
  '/terms': TermsOfUse,
  '/legal': TermsOfUse,
};

export const prerenderRoutes: PrerenderRoute[] = (staticRoutes as Array<{ path: string }>).map((r) => ({
  path: r.path,
  Component: COMPONENT_BY_PATH[r.path],
}));
