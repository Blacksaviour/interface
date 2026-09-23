/**
 * Normalize string for case and diacritic-insensitive comparison
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

/**
 * Find all indices of a substring in text (case and diacritic-insensitive)
 */
export function findMatches(
  text: string,
  query: string
): Array<{ start: number; end: number }> {
  if (!query) return []

  const normalizedText = normalizeString(text)
  const normalizedQuery = normalizeString(query)
  const matches: Array<{ start: number; end: number }> = []

  let startIndex = 0
  while (startIndex < normalizedText.length) {
    const index = normalizedText.indexOf(normalizedQuery, startIndex)
    if (index === -1) break

    // Map normalized index back to original string
    // This is approximate but works for most cases
    matches.push({ start: index, end: index + query.length })
    startIndex = index + 1
  }

  return matches
}

/**
 * Highlight matched substrings in text
 * Returns array of [text, isMatch] tuples
 */
export function highlightMatches(
  text: string,
  query: string
): Array<[string, boolean]> {
  if (!query) return [[text, false]]

  const matches = findMatches(text, query)
  if (matches.length === 0) return [[text, false]]

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start)

  const segments: Array<[string, boolean]> = []
  let lastEnd = 0

  for (const match of matches) {
    // Add text before match
    if (match.start > lastEnd) {
      segments.push([text.substring(lastEnd, match.start), false])
    }

    // Add matched text
    segments.push([text.substring(match.start, match.end), true])
    lastEnd = match.end
  }

  // Add remaining text
  if (lastEnd < text.length) {
    segments.push([text.substring(lastEnd), false])
  }

  return segments
}

/**
 * Test if text matches query (case and diacritic-insensitive)
 */
export function matchesQuery(text: string, query: string): boolean {
  if (!query) return true
  return normalizeString(text).includes(normalizeString(query))
}
