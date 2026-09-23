import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import * as circuitBreakerHook from "../hooks/useCircuitBreaker"
import { CircuitBreakerBanner } from "./CircuitBreakerBanner"

vi.mock("../hooks/useCircuitBreaker")

describe("CircuitBreakerBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders nothing when status is not active", () => {
    vi.mocked(circuitBreakerHook.useCircuitBreaker).mockReturnValueOnce({
      data: { active: false, message: "" },
      isLoading: false,
      error: null,
    } as never)

    const { container } = render(<CircuitBreakerBanner symbol="ETH" />)
    expect(container.firstChild).toBeNull()
  })

  it("renders nothing when status is undefined", () => {
    vi.mocked(circuitBreakerHook.useCircuitBreaker).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      error: null,
    } as never)

    const { container } = render(<CircuitBreakerBanner symbol="ETH" />)
    expect(container.firstChild).toBeNull()
  })

  it("renders banner when status is active", () => {
    vi.mocked(circuitBreakerHook.useCircuitBreaker).mockReturnValueOnce({
      data: {
        active: true,
        message: "Market frozen due to circuit breaker",
      },
      isLoading: false,
      error: null,
    } as never)

    render(<CircuitBreakerBanner symbol="ETH" />)
    expect(screen.getByText("Market frozen due to circuit breaker")).toBeInTheDocument()
  })

  it("has alert role for accessibility", () => {
    vi.mocked(circuitBreakerHook.useCircuitBreaker).mockReturnValueOnce({
      data: {
        active: true,
        message: "Execution frozen",
      },
      isLoading: false,
      error: null,
    } as never)

    render(<CircuitBreakerBanner symbol="BTC" />)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("displays amber styling for warning severity", () => {
    vi.mocked(circuitBreakerHook.useCircuitBreaker).mockReturnValueOnce({
      data: {
        active: true,
        message: "Caution: market freeze active",
      },
      isLoading: false,
      error: null,
    } as never)

    const { container } = render(<CircuitBreakerBanner symbol="SOL" />)
    const banner = container.querySelector("[role='alert']")
    expect(banner?.className).toContain("bg-amber-500/10")
    expect(banner?.className).toContain("border-amber-500/40")
    expect(banner?.className).toContain("text-amber-200")
  })

  it("shows dismiss button with correct styling", () => {
    vi.mocked(circuitBreakerHook.useCircuitBreaker).mockReturnValueOnce({
      data: {
        active: true,
        message: "Circuit breaker engaged",
      },
      isLoading: false,
      error: null,
    } as never)

    const { container } = render(<CircuitBreakerBanner symbol="USDC" />)
    const dismissBtn = container.querySelector("button")
    expect(dismissBtn).toHaveTextContent("Dismiss")
    expect(dismissBtn?.className).toContain("text-amber-300")
  })

  it("dismisses banner when dismiss button clicked", () => {
    vi.mocked(circuitBreakerHook.useCircuitBreaker).mockReturnValueOnce({
      data: {
        active: true,
        message: "Execution frozen",
      },
      isLoading: false,
      error: null,
    } as never)

    const { container } = render(<CircuitBreakerBanner symbol="ETH" />)
    expect(screen.getByText("Execution frozen")).toBeInTheDocument()

    const dismissBtn = screen.getByRole("button", { name: /Dismiss/ })
    fireEvent.click(dismissBtn)

    expect(container.querySelector("[role='alert']")).not.toBeInTheDocument()
  })

  it("hides banner after dismissal even if status remains active", () => {
    const useCircuitBreakerMock = vi.mocked(circuitBreakerHook.useCircuitBreaker)
    useCircuitBreakerMock.mockReturnValueOnce({
      data: {
        active: true,
        message: "Market frozen",
      },
      isLoading: false,
      error: null,
    } as never)

    const { container } = render(<CircuitBreakerBanner symbol="ETH" />)
    expect(screen.getByText("Market frozen")).toBeInTheDocument()

    const dismissBtn = screen.getByRole("button", { name: /Dismiss/ })
    fireEvent.click(dismissBtn)

    expect(container.querySelector("[role='alert']")).not.toBeInTheDocument()
  })

  it("uses symbol from props in hook", () => {
    vi.mocked(circuitBreakerHook.useCircuitBreaker).mockReturnValueOnce({
      data: { active: false, message: "" },
      isLoading: false,
      error: null,
    } as never)

    render(<CircuitBreakerBanner symbol="TSLA" />)
    expect(circuitBreakerHook.useCircuitBreaker).toHaveBeenCalledWith("TSLA")
  })

  it("handles undefined symbol", () => {
    vi.mocked(circuitBreakerHook.useCircuitBreaker).mockReturnValueOnce({
      data: { active: false, message: "" },
      isLoading: false,
      error: null,
    } as never)

    render(<CircuitBreakerBanner symbol={undefined} />)
    expect(circuitBreakerHook.useCircuitBreaker).toHaveBeenCalledWith(undefined)
  })

  it("displays explanatory copy with accessible text", () => {
    vi.mocked(circuitBreakerHook.useCircuitBreaker).mockReturnValueOnce({
      data: {
        active: true,
        message: "Trading is frozen: volatility limit exceeded",
      },
      isLoading: false,
      error: null,
    } as never)

    render(<CircuitBreakerBanner symbol="VIX" />)
    const banner = screen.getByRole("alert")
    expect(banner).toHaveTextContent("Trading is frozen: volatility limit exceeded")
  })
})
