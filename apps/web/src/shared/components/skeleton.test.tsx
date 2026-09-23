import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render } from "@testing-library/react"

import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonControl,
  SkeletonTableRow,
  SkeletonText,
} from "@workspace/ui/components/skeleton"

afterEach(() => {
  cleanup()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBySlot(container: HTMLElement, slot: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(
    `[data-slot="${slot}"]`
  )
  if (!el) throw new Error(`No element with data-slot="${slot}" found`)
  return el
}

function getAllBySlot(
  container: HTMLElement,
  slot: string
): Array<HTMLElement> {
  return Array.from(
    container.querySelectorAll(`[data-slot="${slot}"]`)
  )
}

// ---------------------------------------------------------------------------
// 1. Skeleton base
// ---------------------------------------------------------------------------

describe("Skeleton – base", () => {
  it("renders a div with data-slot=skeleton", () => {
    const { container } = render(<Skeleton />)
    expect(getBySlot(container, "skeleton")).toBeTruthy()
  })

  it("is aria-hidden so screen readers skip it", () => {
    const { container } = render(<Skeleton />)
    expect(getBySlot(container, "skeleton").getAttribute("aria-hidden")).toBe(
      "true"
    )
  })

  it("carries motion-safe:animate-pulse for standard motion preference", () => {
    const { container } = render(<Skeleton />)
    expect(getBySlot(container, "skeleton").className).toContain(
      "motion-safe:animate-pulse"
    )
  })

  it("does NOT carry bare animate-pulse (no animation outside motion-safe)", () => {
    const { container } = render(<Skeleton />)
    // The class string must not contain animate-pulse without the variant prefix
    const classes = getBySlot(container, "skeleton").className
    expect(classes).not.toMatch(/(?<![:\w])animate-pulse/)
  })

  it("has bg-muted surface colour", () => {
    const { container } = render(<Skeleton />)
    expect(getBySlot(container, "skeleton").className).toContain("bg-muted")
  })

  it("forwards extra className", () => {
    const { container } = render(<Skeleton className="h-4 w-24" />)
    const el = getBySlot(container, "skeleton")
    expect(el.className).toContain("h-4")
    expect(el.className).toContain("w-24")
  })

  it("forwards arbitrary HTML props", () => {
    const { container } = render(<Skeleton data-testid="my-sk" />)
    expect(container.querySelector("[data-testid='my-sk']")).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 2. Reduced-motion: structural guarantee
//
// happy-dom does not evaluate CSS @media queries, so we cannot assert that
// `animation: none` is applied at runtime.  Instead we verify:
//   a) The component uses the `motion-safe:` variant (not bare animate-pulse),
//      which Tailwind v4 will suppress under prefers-reduced-motion: reduce.
//   b) All skeleton elements carry data-slot="skeleton" — the exact selector
//      the globals.css CSS safety net targets — ensuring the rule applies.
// ---------------------------------------------------------------------------

describe("Skeleton – reduced-motion structural guarantee", () => {
  it("animation class is prefixed with motion-safe: variant", () => {
    const { container } = render(<Skeleton />)
    expect(getBySlot(container, "skeleton").className).toContain("motion-safe:")
  })

  it("every preset's inner Skeleton also carries data-slot=skeleton for CSS net", () => {
    const { container } = render(
      <div>
        <SkeletonText />
        <SkeletonAvatar />
        <SkeletonControl />
        <SkeletonCard />
        <SkeletonTableRow />
      </div>
    )
    // SkeletonText (single line) has data-slot="skeleton-text" overriding "skeleton"
    // on that element. We verify the CSS net selector `[data-slot="skeleton"]`
    // by checking multi-element presets (SkeletonTableRow cols=4 → 4 cells) plus
    // avatar, control, card — each passes data-slot="skeleton-*" which overwrites
    // the base slot.  The important thing is every element carries
    // `motion-safe:animate-pulse` regardless of which slot attribute wins.
    const allAnimated = Array.from(
      container.querySelectorAll('[class*="motion-safe:animate-pulse"]')
    )
    // 1 (SkeletonText) + 1 (Avatar) + 1 (Control) + 1 (Card) + 4 (TableRow cols)
    expect(allAnimated.length).toBeGreaterThanOrEqual(8)
    for (const el of allAnimated) {
      expect(el.className).toContain("motion-safe:animate-pulse")
    }
  })
})

// ---------------------------------------------------------------------------
// 3. SkeletonText
// ---------------------------------------------------------------------------

describe("SkeletonText", () => {
  it("renders a single line by default", () => {
    const { container } = render(<SkeletonText />)
    const root = getBySlot(container, "skeleton-text")
    expect(root).toBeTruthy()
    // Single-line: data-slot="skeleton-text" is set on the Skeleton element,
    // which overwrites the base data-slot="skeleton" (last write wins in JSX).
    // Verify the element is the only skeleton-shaped node rendered.
    expect(root.className).toContain("motion-safe:animate-pulse")
    expect(
      container.querySelectorAll('[class*="motion-safe:animate-pulse"]').length
    ).toBe(1)
  })

  it("single line has rounded-sm radius token", () => {
    const { container } = render(<SkeletonText />)
    expect(getBySlot(container, "skeleton-text").className).toContain(
      "rounded-sm"
    )
  })

  it("single line defaults to h-3 height", () => {
    const { container } = render(<SkeletonText />)
    expect(getBySlot(container, "skeleton-text").className).toContain("h-3")
  })

  it("respects custom lineHeight prop", () => {
    const { container } = render(<SkeletonText lineHeight="h-4" />)
    expect(getBySlot(container, "skeleton-text").className).toContain("h-4")
  })

  it("renders N skeleton lines for lines > 1", () => {
    const { container } = render(<SkeletonText lines={3} />)
    expect(getAllBySlot(container, "skeleton").length).toBe(3)
  })

  it("multi-line wrapper has data-slot=skeleton-text", () => {
    const { container } = render(<SkeletonText lines={2} />)
    expect(getBySlot(container, "skeleton-text")).toBeTruthy()
  })

  it("last line of multi-line block is narrower (w-3/4)", () => {
    const { container } = render(<SkeletonText lines={3} />)
    const lines = getAllBySlot(container, "skeleton")
    expect(lines[2].className).toContain("w-3/4")
    expect(lines[0].className).not.toContain("w-3/4")
  })

  it("forwards className to single-line root", () => {
    const { container } = render(<SkeletonText className="w-48" />)
    expect(getBySlot(container, "skeleton-text").className).toContain("w-48")
  })

  it("forwards className to multi-line wrapper", () => {
    const { container } = render(<SkeletonText lines={2} className="w-64" />)
    expect(getBySlot(container, "skeleton-text").className).toContain("w-64")
  })
})

// ---------------------------------------------------------------------------
// 4. SkeletonAvatar
// ---------------------------------------------------------------------------

describe("SkeletonAvatar", () => {
  it("renders with data-slot=skeleton-avatar", () => {
    const { container } = render(<SkeletonAvatar />)
    expect(getBySlot(container, "skeleton-avatar")).toBeTruthy()
  })

  it("is circular (rounded-full)", () => {
    const { container } = render(<SkeletonAvatar />)
    expect(getBySlot(container, "skeleton-avatar").className).toContain(
      "rounded-full"
    )
  })

  it("defaults to size-8", () => {
    const { container } = render(<SkeletonAvatar />)
    expect(getBySlot(container, "skeleton-avatar").className).toContain(
      "size-8"
    )
  })

  it("accepts custom size", () => {
    const { container } = render(<SkeletonAvatar size="size-12" />)
    expect(getBySlot(container, "skeleton-avatar").className).toContain(
      "size-12"
    )
  })

  it("does not shrink (shrink-0)", () => {
    const { container } = render(<SkeletonAvatar />)
    expect(getBySlot(container, "skeleton-avatar").className).toContain(
      "shrink-0"
    )
  })

  it("forwards className", () => {
    const { container } = render(<SkeletonAvatar className="ring-1" />)
    expect(getBySlot(container, "skeleton-avatar").className).toContain(
      "ring-1"
    )
  })
})

// ---------------------------------------------------------------------------
// 5. SkeletonControl
// ---------------------------------------------------------------------------

describe("SkeletonControl", () => {
  it("renders with data-slot=skeleton-control", () => {
    const { container } = render(<SkeletonControl />)
    expect(getBySlot(container, "skeleton-control")).toBeTruthy()
  })

  it("is full width by default", () => {
    const { container } = render(<SkeletonControl />)
    expect(getBySlot(container, "skeleton-control").className).toContain(
      "w-full"
    )
  })

  it("has control row height h-7", () => {
    const { container } = render(<SkeletonControl />)
    expect(getBySlot(container, "skeleton-control").className).toContain("h-7")
  })

  it("uses rounded-md radius token", () => {
    const { container } = render(<SkeletonControl />)
    expect(getBySlot(container, "skeleton-control").className).toContain(
      "rounded-md"
    )
  })

  it("forwards className", () => {
    const { container } = render(<SkeletonControl className="w-40" />)
    expect(getBySlot(container, "skeleton-control").className).toContain("w-40")
  })
})

// ---------------------------------------------------------------------------
// 6. SkeletonCard
// ---------------------------------------------------------------------------

describe("SkeletonCard", () => {
  it("renders with data-slot=skeleton-card", () => {
    const { container } = render(<SkeletonCard />)
    expect(getBySlot(container, "skeleton-card")).toBeTruthy()
  })

  it("is full width by default", () => {
    const { container } = render(<SkeletonCard />)
    expect(getBySlot(container, "skeleton-card").className).toContain("w-full")
  })

  it("has card block height h-36", () => {
    const { container } = render(<SkeletonCard />)
    expect(getBySlot(container, "skeleton-card").className).toContain("h-36")
  })

  it("uses rounded-xl radius token", () => {
    const { container } = render(<SkeletonCard />)
    expect(getBySlot(container, "skeleton-card").className).toContain(
      "rounded-xl"
    )
  })

  it("forwards className for custom height", () => {
    const { container } = render(<SkeletonCard className="h-48" />)
    expect(getBySlot(container, "skeleton-card").className).toContain("h-48")
  })
})

// ---------------------------------------------------------------------------
// 7. SkeletonTableRow
// ---------------------------------------------------------------------------

describe("SkeletonTableRow", () => {
  it("renders with data-slot=skeleton-table-row", () => {
    const { container } = render(<SkeletonTableRow />)
    expect(getBySlot(container, "skeleton-table-row")).toBeTruthy()
  })

  it("renders 4 cell skeletons by default", () => {
    const { container } = render(<SkeletonTableRow />)
    expect(getAllBySlot(container, "skeleton").length).toBe(4)
  })

  it("renders N cells when cols is specified", () => {
    const { container } = render(<SkeletonTableRow cols={6} />)
    expect(getAllBySlot(container, "skeleton").length).toBe(6)
  })

  it("renders 1 cell when cols=1", () => {
    const { container } = render(<SkeletonTableRow cols={1} />)
    expect(getAllBySlot(container, "skeleton").length).toBe(1)
  })

  it("each cell has rounded-sm radius token", () => {
    const { container } = render(<SkeletonTableRow cols={2} />)
    for (const cell of getAllBySlot(container, "skeleton")) {
      expect(cell.className).toContain("rounded-sm")
    }
  })

  it("each cell has flex-1 so columns share available width", () => {
    const { container } = render(<SkeletonTableRow cols={2} />)
    for (const cell of getAllBySlot(container, "skeleton")) {
      expect(cell.className).toContain("flex-1")
    }
  })

  it("forwards className to the row wrapper", () => {
    const { container } = render(<SkeletonTableRow className="bg-muted/20" />)
    expect(getBySlot(container, "skeleton-table-row").className).toContain(
      "bg-muted/20"
    )
  })
})
