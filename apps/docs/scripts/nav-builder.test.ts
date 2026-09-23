import { describe, expect, test } from "bun:test"

interface MetaSection {
  label: string
  icon?: string
  pages: string[]
}

interface MetaConfig {
  sections: MetaSection[]
}

function buildNavTree(meta: MetaConfig, availableRoutes: Set<string>) {
  const errors: string[] = []
  const tree = meta.sections.map((section) => {
    const validPages = section.pages.map((p) => {
      const route = `/${p}`
      if (!availableRoutes.has(route)) {
        errors.push(`missing route for sidebar entry: ${route}`)
      }
      return { route, slug: p }
    })
    return { label: section.label, icon: section.icon, pages: validPages }
  })

  return { tree, errors }
}

describe("nav-builder — section tree builder", () => {
  test("builds navigation tree from valid manifest", () => {
    const manifest: MetaConfig = {
      sections: [
        {
          label: "Get Started",
          pages: ["get-started/introduction", "get-started/quickstart"],
        },
        {
          label: "Concepts",
          pages: ["concepts/risk"],
        },
      ],
    }
    const routes = new Set([
      "/get-started/introduction",
      "/get-started/quickstart",
      "/concepts/risk",
    ])

    const { tree, errors } = buildNavTree(manifest, routes)
    expect(errors).toHaveLength(0)
    expect(tree).toHaveLength(2)
    expect(tree[0].label).toBe("Get Started")
    expect(tree[0].pages).toHaveLength(2)
  })

  test("reports missing pages referenced in manifest", () => {
    const manifest: MetaConfig = {
      sections: [
        {
          label: "Get Started",
          pages: ["get-started/nonexistent"],
        },
      ],
    }
    const routes = new Set(["/get-started/introduction"])

    const { errors } = buildNavTree(manifest, routes)
    expect(errors).toContain("missing route for sidebar entry: /get-started/nonexistent")
  })

  test("handles empty sections gracefully", () => {
    const manifest: MetaConfig = {
      sections: [
        {
          label: "Empty Section",
          pages: [],
        },
      ],
    }
    const { tree, errors } = buildNavTree(manifest, new Set())
    expect(errors).toHaveLength(0)
    expect(tree[0].pages).toHaveLength(0)
  })
})
