import { highlightMatches } from "../utils.search"

interface HighlightedTextProps {
  text: string
  query?: string
  className?: string
}

/**
 * Safely highlights matched substrings without breaking markup.
 * Only highlights plain text segments, not markdown or links.
 */
export function HighlightedText({
  text,
  query,
  className,
}: HighlightedTextProps) {
  if (!query) {
    return <span className={className}>{text}</span>
  }

  const segments = highlightMatches(text, query)

  return (
    <span className={className}>
      {segments.map((segment, idx) => {
        const [content, isMatch] = segment
        if (isMatch) {
          return (
            <mark
              key={idx}
              className="bg-yellow-200 font-medium dark:bg-yellow-700"
            >
              {content}
            </mark>
          )
        }
        return <span key={idx}>{content}</span>
      })}
    </span>
  )
}
