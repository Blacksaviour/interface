// Inline markdown tokenizer shared by the /changelog renderer (DX-007) and
// the Atom feed generator (DX-014).
//
// Scope is deliberately inline-only — links, code spans, bold, emphasis —
// because entry text is a single sentence. There is no HTML passthrough: the
// tokenizer only ever emits these node kinds, so `<img onerror=…>` in an
// entry surfaces as plain text and each consumer escapes it for its medium.

export type InlineNode =
  | { kind: "text"; value: string }
  | { kind: "code"; value: string }
  | { kind: "bold"; children: InlineNode[] }
  | { kind: "em"; children: InlineNode[] }
  // href is already sanity-checked here: only http(s), mailto and same-site
  // relative URLs survive; anything else degrades to plain text.
  | { kind: "link"; href: string; children: InlineNode[] }

const SAFE_HREF = /^(https?:\/\/|mailto:|\/|#)/i

/** Tokenize a single-line inline-markdown string. Never throws. */
export function tokenizeInline(input: string): InlineNode[] {
  const nodes: InlineNode[] = []
  let buffer = ""
  let i = 0

  const flush = () => {
    if (buffer) {
      nodes.push({ kind: "text", value: buffer })
      buffer = ""
    }
  }

  while (i < input.length) {
    const rest = input.slice(i)

    const code = rest.match(/^`([^`]+)`/)
    if (code) {
      flush()
      nodes.push({ kind: "code", value: code[1] })
      i += code[0].length
      continue
    }

    const link = rest.match(/^\[([^\]]+)\]\(([^)\s]+)\)/)
    if (link) {
      flush()
      if (SAFE_HREF.test(link[2])) {
        nodes.push({
          kind: "link",
          href: link[2],
          children: tokenizeInline(link[1]),
        })
      } else {
        buffer += link[1]
      }
      i += link[0].length
      continue
    }

    const bold = rest.match(/^\*\*([^*]+)\*\*/)
    if (bold) {
      flush()
      nodes.push({ kind: "bold", children: tokenizeInline(bold[1]) })
      i += bold[0].length
      continue
    }

    const em = rest.match(/^\*([^*]+)\*/)
    if (em) {
      flush()
      nodes.push({ kind: "em", children: tokenizeInline(em[1]) })
      i += em[0].length
      continue
    }

    buffer += input[i]
    i++
  }

  flush()
  return nodes
}

/** XML/XHTML escaping for feed output. */
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
