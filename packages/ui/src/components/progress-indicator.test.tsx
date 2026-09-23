import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { axe } from "vitest-axe"
import { ProgressIndicator } from "./progress-indicator"

describe("ProgressIndicator", () => {
  it("renders with default props", () => {
    const { container } = render(<ProgressIndicator value={50} />)
    const progressIndicator = container.querySelector(
      "[data-slot='progress-indicator']"
    )
    expect(progressIndicator).toBeInTheDocument()
  })

  it("exposes correct ARIA value attributes", () => {
    const { container } = render(
      <ProgressIndicator value={75} max={100} min={0} />
    )
    const progressIndicator = container.querySelector(
      "[data-slot='progress-indicator']"
    )
    expect(progressIndicator).toHaveAttribute("role", "progressbar")
    expect(progressIndicator).toHaveAttribute("aria-valuenow", "75")
    expect(progressIndicator).toHaveAttribute("aria-valuemin", "0")
    expect(progressIndicator).toHaveAttribute("aria-valuemax", "100")
  })

  it("clamps value between min and max", () => {
    const { rerender, container } = render(
      <ProgressIndicator value={150} max={100} />
    )
    let progressIndicator = container.querySelector(
      "[data-slot='progress-indicator']"
    )
    expect(progressIndicator).toHaveAttribute("aria-valuenow", "100")

    rerender(<ProgressIndicator value={-10} min={0} />)
    progressIndicator = container.querySelector(
      "[data-slot='progress-indicator']"
    )
    expect(progressIndicator).toHaveAttribute("aria-valuenow", "0")
  })

  it("calculates correct width percentage", () => {
    const { container } = render(<ProgressIndicator value={50} max={100} />)
    const progressBar = container.querySelector("[data-slot='progress-bar']")
    const style = window.getComputedStyle(progressBar as Element)
    expect(progressBar).toHaveStyle("width: 50%")
  })

  it("supports all size variants", () => {
    const { rerender, container } = render(
      <ProgressIndicator value={50} size="sm" />
    )
    let progressIndicator = container.querySelector(
      "[data-slot='progress-indicator']"
    )
    expect(progressIndicator?.className).toContain("h-1")

    rerender(<ProgressIndicator value={50} size="md" />)
    progressIndicator = container.querySelector(
      "[data-slot='progress-indicator']"
    )
    expect(progressIndicator?.className).toContain("h-2")

    rerender(<ProgressIndicator value={50} size="lg" />)
    progressIndicator = container.querySelector(
      "[data-slot='progress-indicator']"
    )
    expect(progressIndicator?.className).toContain("h-3")
  })

  it("supports all tone variants", () => {
    const tones = ["neutral", "accent", "success", "danger"] as const
    for (const tone of tones) {
      const { container } = render(<ProgressIndicator value={50} tone={tone} />)
      const progressIndicator = container.querySelector(
        "[data-slot='progress-indicator']"
      )
      expect(progressIndicator).toHaveAttribute("data-tone", tone)
    }
  })

  it("supports custom labels", () => {
    const { container } = render(
      <ProgressIndicator value={50} label="Loading" />
    )
    const progressIndicator = container.querySelector(
      "[data-slot='progress-indicator']"
    )
    expect(progressIndicator).toHaveAttribute("aria-label", "Loading")
  })

  it("forwards ref properly", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<ProgressIndicator ref={ref} value={50} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ProgressIndicator value={50} label="Download progress" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("handles custom min and max values", () => {
    const { container } = render(
      <ProgressIndicator value={150} min={0} max={200} />
    )
    const progressIndicator = container.querySelector(
      "[data-slot='progress-indicator']"
    )
    expect(progressIndicator).toHaveAttribute("aria-valuenow", "150")
    expect(progressIndicator).toHaveAttribute("aria-valuemax", "200")
    const progressBar = container.querySelector("[data-slot='progress-bar']")
    expect(progressBar).toHaveStyle("width: 75%")
  })

  it("shows zero width when value equals min", () => {
    const { container } = render(
      <ProgressIndicator value={0} min={0} max={100} />
    )
    const progressBar = container.querySelector("[data-slot='progress-bar']")
    expect(progressBar).toHaveStyle("width: 0%")
  })

  it("shows full width when value equals max", () => {
    const { container } = render(
      <ProgressIndicator value={100} min={0} max={100} />
    )
    const progressBar = container.querySelector("[data-slot='progress-bar']")
    expect(progressBar).toHaveStyle("width: 100%")
  })
})
