import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { axe } from "vitest-axe"
import {
  Stat,
  StatDelta,
  StatGroup,
  StatLabel,
  StatValue,
} from "./stat"

describe("Stat", () => {
  it("renders label and value", () => {
    render(<Stat label="TVL" value="$1.2M" />)
    expect(screen.getByText("TVL")).toBeInTheDocument()
    expect(screen.getByText("$1.2M")).toBeInTheDocument()
  })

  it("shows skeleton when loading", () => {
    const { container } = render(<Stat label="TVL" value="$1.2M" isLoading />)
    expect(container.querySelector("[data-slot='skeleton']")).toBeInTheDocument()
    expect(screen.queryByText("$1.2M")).not.toBeInTheDocument()
  })

  it("renders hint text", () => {
    render(<Stat label="APY" value="12%" hint="Performance APY" />)
    expect(screen.getByText("Performance APY")).toBeInTheDocument()
  })

  it("renders uppercase label variant", () => {
    render(<Stat label="Volume" value="$500K" uppercase />)
    const label = screen.getByText("Volume")
    expect(label.className).toContain("uppercase")
  })

  it("has no accessibility violations", async () => {
    const { container } = render(<Stat label="TVL" value="$1.2M" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe("StatLabel", () => {
  it("renders children", () => {
    render(<StatLabel>Total Volume</StatLabel>)
    expect(screen.getByText("Total Volume")).toBeInTheDocument()
  })

  it("supports uppercase", () => {
    render(<StatLabel uppercase>APY</StatLabel>)
    const label = screen.getByText("APY")
    expect(label.className).toContain("uppercase")
  })
})

describe("StatValue", () => {
  it("renders value text", () => {
    render(<StatValue>$1,234.56</StatValue>)
    expect(screen.getByText("$1,234.56")).toBeInTheDocument()
  })

  it("shows skeleton when loading", () => {
    const { container } = render(<StatValue isLoading>$1,234.56</StatValue>)
    expect(container.querySelector("[data-slot='skeleton']")).toBeInTheDocument()
  })

  it("shows em dash when unavailable", () => {
    render(<StatValue unavailable />)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("distinguishes unavailable from a real zero", () => {
    const { container } = render(
      <div>
        <StatValue unavailable data-testid="unavailable" />
        <StatValue data-testid="zero">0</StatValue>
      </div>,
    )
    const unavailable = container.querySelector("[data-testid='unavailable']")
    const zero = container.querySelector("[data-testid='zero']")
    expect(unavailable?.textContent).toBe("—")
    expect(zero?.textContent).toBe("0")
  })

  it("applies positive role", () => {
    render(<StatValue role="positive">+5%</StatValue>)
    const el = screen.getByText("+5%")
    expect(el.className).toContain("success")
  })

  it("applies negative role", () => {
    render(<StatValue role="negative">-3%</StatValue>)
    const el = screen.getByText("-3%")
    expect(el.className).toContain("destructive")
  })
})

describe("StatDelta", () => {
  it("renders positive delta with indicator", () => {
    render(<StatDelta tone="positive">+5.2%</StatDelta>)
    expect(screen.getByText("+5.2%")).toBeInTheDocument()
    expect(screen.getByText("▲")).toBeInTheDocument()
  })

  it("renders negative delta with indicator", () => {
    render(<StatDelta tone="negative">-3.1%</StatDelta>)
    expect(screen.getByText("-3.1%")).toBeInTheDocument()
    expect(screen.getByText("▼")).toBeInTheDocument()
  })

  it("renders neutral delta without indicator", () => {
    render(<StatDelta tone="neutral">0%</StatDelta>)
    expect(screen.getByText("0%")).toBeInTheDocument()
  })

  it("does not convey meaning through color alone", () => {
    const { container } = render(
      <StatDelta tone="positive">+5%</StatDelta>,
    )
    const indicator = container.querySelector("[aria-hidden='true']")
    expect(indicator).toBeInTheDocument()
    expect(indicator?.textContent).toBe("▲ ")
  })
})

describe("StatGroup", () => {
  it("renders children in a group", () => {
    render(
      <StatGroup>
        <Stat label="TVL" value="$1M" />
        <Stat label="Volume" value="$500K" />
      </StatGroup>,
    )
    expect(screen.getByRole("group")).toBeInTheDocument()
    expect(screen.getByText("TVL")).toBeInTheDocument()
    expect(screen.getByText("Volume")).toBeInTheDocument()
  })

  it("applies horizontal direction by default", () => {
    const { container } = render(
      <StatGroup>
        <Stat label="A" value="1" />
      </StatGroup>,
    )
    const group = container.querySelector("[data-slot='stat-group']")
    expect(group?.className).toContain("flex-row")
  })

  it("applies vertical direction", () => {
    const { container } = render(
      <StatGroup direction="vertical">
        <Stat label="A" value="1" />
      </StatGroup>,
    )
    const group = container.querySelector("[data-slot='stat-group']")
    expect(group?.className).toContain("flex-col")
  })

  it("wraps at narrow widths (flex-wrap class present)", () => {
    const { container } = render(
      <StatGroup>
        <Stat label="A" value="1" />
        <Stat label="B" value="2" />
      </StatGroup>,
    )
    const group = container.querySelector("[data-slot='stat-group']")
    expect(group?.className).toContain("flex-wrap")
  })

  it("loading state does not cause layout shift (skeleton has fixed dimensions)", () => {
    const { container } = render(
      <StatGroup>
        <Stat label="TVL" value="$1M" isLoading />
      </StatGroup>,
    )
    const skeleton = container.querySelector("[data-slot='skeleton']")
    expect(skeleton?.className).toContain("h-5")
    expect(skeleton?.className).toContain("w-20")
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <StatGroup>
        <Stat label="TVL" value="$1M" />
        <Stat label="Volume" value="$500K" />
      </StatGroup>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
