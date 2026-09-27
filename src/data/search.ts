export function normalizeSearch(value: string) {
  return value.toUpperCase().replace(/\s+/g, '');
}
