# DirectRent Developer Guidelines

Whenever the user says "optimize directrent", perform the following optimizations:

1. **Route-Based Code Splitting**: Ensure all major pages are lazy-loaded using `React.lazy` and `Suspense` to reduce the initial bundle size.
2. **Component Memoization**: Audit high-frequency update components (like property lists, search filters, and inputs) and wrap them in `React.memo` or use `useCallback`/`useMemo`.
3. **Resource Pre-fetching**: Use `rel="preconnect"` or `rel="dns-prefetch"` for critical third-party resources (Firebase, Google Fonts).
4. **Image Handling**: Ensure images use proper `referrerPolicy="no-referrer"` and implement skeleton loaders for slow network stability.
5. **Layout Shifts**: Ensure all dynamic containers have minimum height/width or skeleton states to prevent Cumulative Layout Shift (CLS).
