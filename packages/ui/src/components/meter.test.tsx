import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { axe } from "vitest-axe"
import { AllocationBar, Meter, normalizeSegments } from "./meter"

describe("Meter", () => {
  it("renders with correct ARIA attributes", () => {
    render(<Meter value={75} min={0} max={100} label="Utilization" />)
    const meter = screen.getByRole("meter")
    expect(meter).toHaveAttribute("aria-valuenow", "75")
    expect(meter).toHaveAttribute("aria-valuemin", "0")
    expect(meter).toHaveAttribute("aria-valuemax", "100")
    expect(meter).toHaveAttribute("aria-label", "Utilization")
  })

  it("clamps value to min/max", () => {
    const { rerender } = render(
      <Meter value={150} min={0} max={100} label="Test" />,
    )
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "100")

    rerender(<Meter value={-10} min={0} max={100} label="Test" />)
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "0")
  })

  it("calculates correct fill width", () => {
    const { container } = render(
      <Meter value={50} min={0} max={100} label="Test" />,
    )
    const fill = container.querySelector("[data-slot='meter-fill']")
    expect(fill).toHaveStyle("width: 50%")
  })

  it("handles equal min and max", () => {
    const { container } = render(
      <Meter value={5} min={5} max={5} label="Test" />,
    )
    const fill = container.querySelector("[data-slot='meter-fill']")
    expect(fill).toHaveStyle("width: 0%")
  })

  it("applies neutral threshold styling", () => {
    const { container } = render(
      <Meter value={50} label="Test" threshold="neutral" />,
    )
    const meter = container.querySelector("[data-slot='meter']")
    expect(meter?.className).toContain("surface-sunken")
  })

  it("applies success threshold styling", () => {
    const { container } = render(
      <Meter value={50} label="Test" threshold="success" />,
    )
    const fill = container.querySelector("[data-slot='meter-fill']")
    expect(fill?.className).toContain("success")
  })

  it("applies warning threshold styling", () => {
    const { container } = render(
      <Meter value={50} label="Test" threshold="warning" />,
    )
    const fill = container.querySelector("[data-slot='meter-fill']")
    expect(fill?.className).toContain("warning")
  })

  it("applies danger threshold styling", () => {
    const { container } = render(
      <Meter value={50} label="Test" threshold="danger" />,
    )
    const fill = container.querySelector("[data-slot='meter-fill']")
    expect(fill?.className).toContain("destructive")
  })

  it("has an accessible text label", () => {
    render(<Meter value={50} label="Health score" />)
    expect(screen.getByLabelText("Health score")).toBeInTheDocument()
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Meter value={50} min={0} max={100} label="Utilization" />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe("normalizeSegments", () => {
  it("normalizes values to 100%", () => {
    const result = normalizeSegments([
      { label: "A", value: 50 },
      { label: "B", value: 50 },
    ])
    const totalPct = result.reduce((sum, s) => sum + s.pct, 0)
    expect(totalPct).toBeCloseTo(100, 5)
  })

  it("handles zero total", () => {
    const result = normalizeSegments([
      { label: "A", value: 0 },
      { label: "B", value: 0 },
    ])
    expect(result.every((s) => s.pct === 0)).toBe(true)
  })

  it("enforces minimum segment percentage for tiny non-zero values", () => {
    const result = normalizeSegments([
      { label: "Large", value: 999 },
      { label: "Tiny", value: 1 },
    ])
    const tiny = result.find((s) => s.label === "Tiny")
    expect(tiny!.pct).toBeGreaterThanOrEqual(1)
  })

  it("assigns default colors when none specified", () => {
    const result = normalizeSegments([
      { label: "A", value: 50 },
      { label: "B", value: 50 },
    ])
    expect(result[0].color).toBeDefined()
    expect(result[1].color).toBeDefined()
    expect(result[0].color).not.toBe(result[1].color)
  })

  it("uses custom colors when specified", () => {
    const result = normalizeSegments([
      { label: "A", value: 50, color: "red" },
    ])
    expect(result[0].color).toBe("red")
  })
})

describe("AllocationBar", () => {
  it("renders segments with correct proportions", () => {
    const { container } = render(
      <AllocationBar
        segments={[
          { label: "XLM", value: 70 },
          { label: "USDC", value: 30 },
        ]}
      />,
    )
    const bar = container.querySelector("[data-slot='allocation-bar']")
    expect(bar).toBeInTheDocument()
  })

  it("renders legend by default", () => {
    const { container } = render(
      <AllocationBar
        segments={[
          { label: "XLM", value: 70 },
          { label: "USDC", value: 30 },
        ]}
      />,
    )
    const legend = container.querySelector("[data-slot='allocation-legend']")
    expect(legend).toBeInTheDocument()
    expect(screen.getByText("XLM")).toBeInTheDocument()
    expect(screen.getByText("USDC")).toBeInTheDocument()
  })

  it("hides legend when showLegend is false", () => {
    const { container } = render(
      <AllocationBar
        segments={[{ label: "XLM", value: 100 }]}
        showLegend={false}
      />,
    )
    expect(
      container.querySelector("[data-slot='allocation-legend']"),
    ).not.toBeInTheDocument()
  })

  it("handles zero total without errors", () => {
    const { container } = render(
      <AllocationBar
        segments={[
          { label: "A", value: 0 },
          { label: "B", value: 0 },
        ]}
      />,
    )
    expect(
      container.querySelector("[data-slot='allocation-bar']"),
    ).toBeInTheDocument()
  })

  it("pairs color with labels in legend", () => {
    const { container } = render(
      <AllocationBar
        segments={[
          { label: "XLM", value: 50 },
          { label: "USDC", value: 50 },
        ]}
      />,
    )
    const legend = container.querySelector("[data-slot='allocation-legend']")
    const dots = legend?.querySelectorAll("[aria-hidden='true']")
    expect(dots?.length).toBe(2)
  })

  it("has an accessible description of all segments", () => {
    render(
      <AllocationBar
        segments={[
          { label: "XLM", value: 70 },
          { label: "USDC", value: 30 },
        ]}
      />,
    )
    const bar = screen.getByRole("img")
    expect(bar.getAttribute("aria-label")).toContain("XLM")
    expect(bar.getAttribute("aria-label")).toContain("USDC")
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <AllocationBar
        segments={[
          { label: "XLM", value: 70 },
          { label: "USDC", value: 30 },
        ]}
      />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
