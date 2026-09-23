import rehypeShiki from "@shikijs/rehype"
import { transformerMetaHighlight } from "@shikijs/transformers"
import type { ShikiTransformer, ThemeRegistration } from "shiki"

const so4Theme: ThemeRegistration = {
  name: "so4",
  type: "light",
  fg: "var(--color-text-primary)",
  bg: "var(--color-surface-sunken)",
  settings: [
    {
      scope: [
        "keyword",
        "storage.type",
        "storage.modifier",
        "entity.name.tag",
        "punctuation.definition.tag",
      ],
      settings: { foreground: "var(--color-primary)" },
    },
    {
      scope: ["string", "string.quoted", "string.template"],
      settings: { foreground: "var(--color-success)" },
    },
    {
      scope: ["entity.name.function", "support.function", "support.class"],
      settings: { foreground: "var(--color-info)" },
    },
    {
      scope: ["variable", "entity.name.type", "support.type"],
      settings: { foreground: "var(--color-text-primary)" },
    },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "var(--color-text-tertiary)", fontStyle: "italic" },
    },
    {
      scope: ["constant.numeric", "constant.language", "constant.character"],
      settings: { foreground: "var(--color-warning)" },
    },
    {
      scope: [
        "punctuation",
        "meta.brace",
        "keyword.operator",
        "punctuation.terminator",
      ],
      settings: { foreground: "var(--color-text-secondary)" },
    },
  ],
}

function transformerDocsFeatures(): ShikiTransformer {
  return {
    pre(node) {
      const meta = this.options.meta?.__raw || ""
      
      const titleMatch = meta.match(/title="([^"]+)"/)
      const title = titleMatch ? titleMatch[1] : null
      
      const showLineNumbers = meta.includes("showLineNumbers")

      if (showLineNumbers) {
        node.properties = node.properties || {}
        const existingClass = node.properties.class || node.properties.className || []
        const classArray = Array.isArray(existingClass) 
          ? existingClass 
          : typeof existingClass === "string" 
            ? existingClass.split(" ") 
            : []
        
        node.properties.className = [...(classArray as string[]), "line-numbers"]
        delete node.properties.class
      }

      const rawSource = this.source
      const sourceLines = rawSource.split("\n")
      const cleanSource = sourceLines
        .map((line) => line.replace(/^[\$>]\s+/, ""))
        .join("\n")

      const children: any[] = []

      if (title) {
        children.push({
          type: "element",
          tagName: "div",
          properties: { className: ["code-block-title"] },
          children: [{ type: "text", value: title }],
        })
      }

      children.push({
        type: "mdxJsxFlowElement",
        name: "CopyButton",
        attributes: [
          {
            type: "mdxJsxAttribute",
            name: "value",
            value: cleanSource.trimEnd(),
          },
        ],
        children: [],
      })

      children.push(node)

      return {
        type: "element",
        tagName: "div",
        properties: { className: ["code-block-wrapper"] },
        children,
      }
    },
  }
}

export const shikiPlugin = [
  rehypeShiki,
  {
    theme: so4Theme,
    langs: ["ts", "tsx", "bash", "json", "css", "html"],
    fallbackLanguage: "txt",
    transformers: [transformerMetaHighlight(), transformerDocsFeatures()],
  },
] as any
