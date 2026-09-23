import { Fragment } from "react"
import { highlightMatches } from "../utils.search"
import { tokenizeInline } from "../lib/inline-md"
import type { InlineNode } from "../lib/inline-md"
import type { ReactNode } from "react"

interface InlineMarkdownProps {
  text: string
  query?: string
  className?: string
}

/**
 * Renders an entry's inline markdown (links, code, emphasis) as React
 * elements — never via innerHTML, so raw HTML in entry text is inert by
 * construction and surfaces as escaped text.
 */
export function InlineMarkdown({ text, query, className }: InlineMarkdownProps) {
  return (
    <span className={className}>
      {renderNodes(tokenizeInline(text), query)}
    </span>
  )
}

function renderHighlighted(value: string, query?: string): ReactNode {
  if (!query) return <Fragment>{value}</Fragment>
  const segments = highlightMatches(value, query)
  // Highlighting only ever wraps plain-text runs inside a single text node;
  // it never spans element boundaries, so markup stays intact.
  return segments.map(([content, isMatch], idx) =>
    isMatch ? (
      <mark key={idx} className="bg-yellow-200 dark:bg-yellow-700 font-medium">
        {content}
      </mark>
    ) : (
      <Fragment key={idx}>{content}</Fragment>
    ),
  )
}

function renderNodes(nodes: Array<InlineNode>, query?: string): ReactNode {
  return nodes.map((node, idx) => {
    switch (node.kind) {
      case "text":
        return <Fragment key={idx}>{renderHighlighted(node.value, query)}</Fragment>
      case "code":
        return (
          <code key={idx} className="rounded bg-muted px-1 py-0.5 font-mono text-14">
            {node.value}
          </code>
        )
      case "bold":
        return <strong key={idx}>{renderNodes(node.children, query)}</strong>
      case "em":
        return <em key={idx}>{renderNodes(node.children, query)}</em>
      case "link":
        return (
          <a
            key={idx}
            href={node.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-info underline underline-offset-2 hover:text-info/80 transition-colors break-words"
          >
            {renderNodes(node.children, query)}
          </a>
        )
    }
  })
}