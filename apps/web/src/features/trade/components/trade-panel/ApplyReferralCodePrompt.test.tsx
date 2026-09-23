import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ApplyReferralCodePrompt } from "./ApplyReferralCodePrompt"
import * as referralLib from "@/features/referrals/lib/referrals"
import * as contractLib from "@/lib/contracts"

vi.mock("@/features/referrals/lib/referrals")
vi.mock("@/lib/contracts")

describe("ApplyReferralCodePrompt", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  const renderComponent = (account: string | null = "GTEST") => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ApplyReferralCodePrompt account={account} />
      </QueryClientProvider>,
    )
  }

  it("renders nothing when no account provided", () => {
    const { container } = renderComponent(null)
    expect(container.firstChild).toBeNull()
  })

  it("renders nothing when account is loading", () => {
    vi.mocked(contractLib.getTraderReferralCode).mockImplementationOnce(() => new Promise(() => {}))
    vi.mocked(referralLib.hasCompletedReferralPrompt).mockReturnValueOnce(false)
    vi.mocked(contractLib.readStoredReferralCode).mockReturnValueOnce(null)

    const { container } = renderComponent("GTEST")
    expect(container.querySelector("input")).not.toBeInTheDocument()
  })

  it("renders prompt when account exists and no referral applied", () => {
    vi.mocked(contractLib.getTraderReferralCode).mockResolvedValueOnce(null)
    vi.mocked(referralLib.hasCompletedReferralPrompt).mockReturnValueOnce(false)
    vi.mocked(contractLib.readStoredReferralCode).mockReturnValueOnce(null)

    renderComponent("GTEST")
    expect(screen.getByText(/I have a referral code/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText("e.g. MYCODE123")).toBeInTheDocument()
  })

  it("renders nothing when referral already applied", () => {
    vi.mocked(contractLib.getTraderReferralCode).mockResolvedValueOnce("EXISTING")
    vi.mocked(referralLib.hasCompletedReferralPrompt).mockReturnValueOnce(false)
    vi.mocked(contractLib.readStoredReferralCode).mockReturnValueOnce(null)

    const { container } = renderComponent("GTEST")
    expect(container.querySelector("input")).not.toBeInTheDocument()
  })

  it("renders nothing when prompt already completed", () => {
    vi.mocked(contractLib.getTraderReferralCode).mockResolvedValueOnce(null)
    vi.mocked(referralLib.hasCompletedReferralPrompt).mockReturnValueOnce(true)
    vi.mocked(contractLib.readStoredReferralCode).mockReturnValueOnce(null)

    const { container } = renderComponent("GTEST")
    expect(container.querySelector("input")).not.toBeInTheDocument()
  })

  it("normalizes code to uppercase on input", async () => {
    vi.mocked(contractLib.getTraderReferralCode).mockResolvedValueOnce(null)
    vi.mocked(referralLib.hasCompletedReferralPrompt).mockReturnValueOnce(false)
    vi.mocked(contractLib.readStoredReferralCode).mockReturnValueOnce(null)

    renderComponent("GTEST")
    const input = screen.getByPlaceholderText<HTMLInputElement>("e.g. MYCODE123")
    fireEvent.change(input, { target: { value: "mycode" } })
    expect(input.value).toBe("MYCODE")
  })

  it("submits normalized code and dismisses on success", async () => {
    vi.mocked(contractLib.getTraderReferralCode).mockResolvedValueOnce(null)
    vi.mocked(referralLib.hasCompletedReferralPrompt).mockReturnValueOnce(false)
    vi.mocked(contractLib.readStoredReferralCode).mockReturnValueOnce(null)
    vi.mocked(referralLib.validateReferralCode).mockReturnValueOnce(null)
    vi.mocked(referralLib.applyReferralCode).mockResolvedValueOnce("txhash")
    vi.mocked(referralLib.markReferralPromptComplete).mockReturnValueOnce(undefined)

    renderComponent("GTEST")
    const input = screen.getByPlaceholderText<HTMLInputElement>("e.g. MYCODE123")
    const button = screen.getByRole("button", { name: /Apply/ })

    fireEvent.change(input, { target: { value: "  mycode  " } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(referralLib.applyReferralCode).toHaveBeenCalledWith("GTEST", "MYCODE")
    })
    expect(referralLib.markReferralPromptComplete).toHaveBeenCalledWith("GTEST")
  })

  it("shows validation error without submitting", async () => {
    vi.mocked(contractLib.getTraderReferralCode).mockResolvedValueOnce(null)
    vi.mocked(referralLib.hasCompletedReferralPrompt).mockReturnValueOnce(false)
    vi.mocked(contractLib.readStoredReferralCode).mockReturnValueOnce(null)
    vi.mocked(referralLib.validateReferralCode).mockReturnValueOnce("Invalid code format")

    renderComponent("GTEST")
    const input = screen.getByPlaceholderText<HTMLInputElement>("e.g. MYCODE123")
    const button = screen.getByRole("button", { name: /Apply/ })

    fireEvent.change(input, { target: { value: "BAD" } })
    fireEvent.click(button)

    expect(screen.getByText("Invalid code format")).toBeInTheDocument()
    expect(referralLib.applyReferralCode).not.toHaveBeenCalled()
  })

  it("shows error message on apply failure", async () => {
    vi.mocked(contractLib.getTraderReferralCode).mockResolvedValueOnce(null)
    vi.mocked(referralLib.hasCompletedReferralPrompt).mockReturnValueOnce(false)
    vi.mocked(contractLib.readStoredReferralCode).mockReturnValueOnce(null)
    vi.mocked(referralLib.validateReferralCode).mockReturnValueOnce(null)
    vi.mocked(referralLib.applyReferralCode).mockRejectedValueOnce(new Error("Code not found"))

    renderComponent("GTEST")
    const input = screen.getByPlaceholderText<HTMLInputElement>("e.g. MYCODE123")
    const button = screen.getByRole("button", { name: /Apply/ })

    fireEvent.change(input, { target: { value: "BADCODE" } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText("Code not found")).toBeInTheDocument()
    })
  })

  it("disables apply button when pending", async () => {
    vi.mocked(contractLib.getTraderReferralCode).mockResolvedValueOnce(null)
    vi.mocked(referralLib.hasCompletedReferralPrompt).mockReturnValueOnce(false)
    vi.mocked(contractLib.readStoredReferralCode).mockReturnValueOnce(null)
    vi.mocked(referralLib.validateReferralCode).mockReturnValueOnce(null)
    vi.mocked(referralLib.applyReferralCode).mockImplementationOnce(() => new Promise(() => {}))

    renderComponent("GTEST")
    const input = screen.getByPlaceholderText<HTMLInputElement>("e.g. MYCODE123")
    const button = screen.getByRole("button", { name: /Apply/ })

    fireEvent.change(input, { target: { value: "CODE" } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(button).toHaveTextContent("…")
    })
  })

  it("disables apply button when code is empty", () => {
    vi.mocked(contractLib.getTraderReferralCode).mockResolvedValueOnce(null)
    vi.mocked(referralLib.hasCompletedReferralPrompt).mockReturnValueOnce(false)
    vi.mocked(contractLib.readStoredReferralCode).mockReturnValueOnce(null)

    renderComponent("GTEST")
    const button = screen.getByRole("button", { name: /Apply/ })
    expect(button).toBeDisabled()
  })

  it("clears error when user edits code", async () => {
    vi.mocked(contractLib.getTraderReferralCode).mockResolvedValueOnce(null)
    vi.mocked(referralLib.hasCompletedReferralPrompt).mockReturnValueOnce(false)
    vi.mocked(contractLib.readStoredReferralCode).mockReturnValueOnce(null)
    vi.mocked(referralLib.validateReferralCode).mockReturnValueOnce("Invalid format")

    renderComponent("GTEST")
    const input = screen.getByPlaceholderText<HTMLInputElement>("e.g. MYCODE123")
    const button = screen.getByRole("button", { name: /Apply/ })

    fireEvent.change(input, { target: { value: "BAD" } })
    fireEvent.click(button)

    expect(screen.getByText("Invalid format")).toBeInTheDocument()

    fireEvent.change(input, { target: { value: "GOOD" } })
    expect(screen.queryByText("Invalid format")).not.toBeInTheDocument()
  })

  it("skips prompt and dismisses", async () => {
    vi.mocked(contractLib.getTraderReferralCode).mockResolvedValueOnce(null)
    vi.mocked(referralLib.hasCompletedReferralPrompt).mockReturnValueOnce(false)
    vi.mocked(contractLib.readStoredReferralCode).mockReturnValueOnce(null)
    vi.mocked(referralLib.markReferralPromptComplete).mockReturnValueOnce(undefined)

    renderComponent("GTEST")
    const skipButton = screen.getByRole("button", { name: /Skip for now/ })
    fireEvent.click(skipButton)

    expect(referralLib.markReferralPromptComplete).toHaveBeenCalledWith("GTEST")
    await waitFor(() => {
      expect(screen.queryByText(/I have a referral code/)).not.toBeInTheDocument()
    })
  })

  it("reads stored referral code on mount", () => {
    vi.mocked(contractLib.readStoredReferralCode).mockReturnValueOnce("STORED")
    vi.mocked(contractLib.getTraderReferralCode).mockResolvedValueOnce(null)
    vi.mocked(referralLib.hasCompletedReferralPrompt).mockReturnValueOnce(false)

    renderComponent("GTEST")
    const input = screen.getByPlaceholderText<HTMLInputElement>("e.g. MYCODE123")
    expect(input.value).toBe("STORED")
  })
})
