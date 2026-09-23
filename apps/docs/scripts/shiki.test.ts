import { test, expect } from "bun:test"
import { compile } from "@mdx-js/mdx"
import { shikiPlugin } from "../src/lib/rehype-shiki"

test("Shiki rehype integration", async () => {
  const mdx = `
\`\`\`ts title="src/foo.ts" {2} showLineNumbers
const a = 1
console.log(a)
\`\`\`

\`\`\`bash
$ npm install
\`\`\`

\`\`\`rust
fn main() {}
\`\`\`
`

  const result = await compile(mdx, {
    rehypePlugins: [shikiPlugin],
    jsx: true,
  })

  const output = String(result)

  // Verify unknown language gracefully falls back to txt without crashing
  expect(output).toContain("fn main() {}")

  // Verify custom Shiki theme maps to CSS variables
  expect(output).toContain("var(--color-primary)")
  expect(output).toContain("var(--color-info)")

  // Verify <CopyButton> injected
  expect(output).toContain("<CopyButton")
  
  // Verify prompt characters stripped in CopyButton source
  expect(output).toContain('value="npm install"')

  // Verify line numbers class added
  expect(output).toContain("line-numbers")

  // Verify title block injected
  expect(output).toContain('className="code-block-title"')
  expect(output).toContain("src/foo.ts")

  // Verify no client scripts injected (it's pure MDX AST)
  expect(output).not.toContain("<script")
})
