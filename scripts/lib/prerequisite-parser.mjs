// Extract references, not AND/OR eligibility rules. Case matters for unknown prefixes.
const proseWords = new Set(['FROM', 'YEAR']);

export function extractCourseCodes(text, knownPrefixes = new Set()) {
  const codes = new Set();
  const explicit = /\b([A-Za-z]{2,8})\s*(\d{4}[A-Za-z]?)(?![\w])/g;
  for (const match of text.matchAll(explicit)) {
    const prefix = match[1].toUpperCase();
    if (proseWords.has(prefix) || (!knownPrefixes.has(prefix) && !/^[A-Z]{4}$/.test(match[1]))) continue;
    // A range names a group, not a single prerequisite. Do not invent its endpoints.
    const rest = text.slice(match.index + match[0].length);
    if (/^\s*[-–]\s*\d{4}/.test(rest)) continue;
    codes.add(`${prefix} ${match[2].toUpperCase()}`);
    let tail = rest;
    while (true) {
      const next = tail.match(/^\s*(?:\/|,\s*(?:(?:and|or)\s+)?|(?:and|or)\s+)(\d{4}[A-Za-z]?)(?![\w]|\s*[-–]\s*\d)/i);
      if (!next) break;
      codes.add(`${prefix} ${next[1].toUpperCase()}`);
      tail = tail.slice(next[0].length);
    }
  }
  return [...codes];
}
