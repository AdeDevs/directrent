/**
 * Utility for generating safe, unique keys for React components.
 * Incorporates context to prevent collisions between different roles or views.
 */
export const getSafeKey = (id: string | number, prefix: string = '', context: string = '') => {
  const parts = [];
  if (prefix) parts.push(prefix);
  if (context) parts.push(context);
  parts.push(id);
  return parts.join('-');
};

/**
 * Higher-level key generator for list items.
 */
export const listItemKey = (baseId: string | number, listType: string) => {
  return getSafeKey(baseId, 'list', listType);
};
