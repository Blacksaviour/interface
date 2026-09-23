/**
 * Minimal, dependency-free inline-markdown → HTML conversion shared by every
 * feed generator (Atom today, JSON Feed). Entries in CHANGELOG.md use inline
 * markdown only — no block elements — so this covers the whole surface:
 * links, bold, italic, and inline code.
 */

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ENTITIES[char]);
}

/**
 * Convert one line of inline markdown to safe HTML.
 *
 * The input is escaped *first*, so no attribute-injection is possible through
 * entry text; link targets are additionally checked to be http(s), mailto, or
 * a relative path before being emitted.
 */
export function renderInlineMarkdown(text: string): string {
  let html = escapeHtml(text);

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label, href) => {
    if (!isSafeHref(href)) return label;
    return `<a href="${href}">${label}</a>`;
  });

  return html;
}

function isSafeHref(href: string): boolean {
  return /^(https?:\/\/|mailto:|\/|#)/i.test(href);
}
