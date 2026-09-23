import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { axe } from "vitest-axe"
import {
  AddressDisplay,
  HashDisplay,
  explorerUrl,
  isValidIdentifier,
  truncate,
} from "./address-display"

const ACCOUNT = "GCHSTH45PP3LUDHR4PVTXR4GRYF7S24NYTZQONAEPKSOOTWGNV7YAAJM"
const CONTRACT = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF"
const TX_HASH =
  "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"

describe("truncate", () => {
  it("truncates with default 4 chars", () => {
    expect(truncate(ACCOUNT, 4)).toBe("GCHS…AAJM")
  })

  it("supports custom visible chars", () => {
    expect(truncate(ACCOUNT, 6)).toBe("GCHSTH…7YAAJM")
  })

  it("returns full value when too short to truncate", () => {
    expect(truncate("ABCDE", 4)).toBe("ABCDE")
  })
})

describe("isValidIdentifier", () => {
  it("accepts valid account addresses", () => {
    expect(isValidIdentifier(ACCOUNT, "account")).toBe(true)
  })

  it("rejects contract addresses as account", () => {
    expect(isValidIdentifier(CONTRACT, "account")).toBe(false)
  })

  it("accepts valid contract addresses", () => {
    expect(isValidIdentifier(CONTRACT, "contract")).toBe(true)
  })

  it("rejects account addresses as contract", () => {
    expect(isValidIdentifier(ACCOUNT, "contract")).toBe(false)
  })

  it("accepts valid transaction hashes", () => {
    expect(isValidIdentifier(TX_HASH, "transaction")).toBe(true)
  })

  it("rejects invalid transaction hashes", () => {
    expect(isValidIdentifier("short", "transaction")).toBe(false)
  })

  it("rejects empty strings", () => {
    expect(isValidIdentifier("", "account")).toBe(false)
  })
})

describe("explorerUrl", () => {
  it("generates testnet account URL", () => {
    expect(explorerUrl(ACCOUNT, "account", "testnet")).toBe(
      `https://stellar.expert/explorer/testnet/account/${ACCOUNT}`
    )
  })

  it("generates mainnet account URL", () => {
    expect(explorerUrl(ACCOUNT, "account", "mainnet")).toBe(
      `https://stellar.expert/explorer/public/account/${ACCOUNT}`
    )
  })

  it("generates contract URL", () => {
    expect(explorerUrl(CONTRACT, "contract", "testnet")).toBe(
      `https://stellar.expert/explorer/testnet/contract/${CONTRACT}`
    )
  })

  it("generates transaction URL", () => {
    expect(explorerUrl(TX_HASH, "transaction", "testnet")).toBe(
      `https://stellar.expert/explorer/testnet/tx/${TX_HASH}`
    )
  })

  it("returns null for invalid identifiers", () => {
    expect(explorerUrl("bad", "account", "testnet")).toBeNull()
  })

  it("returns null when type mismatches prefix", () => {
    expect(explorerUrl(CONTRACT, "account", "testnet")).toBeNull()
  })
})

describe("AddressDisplay", () => {
  let originalClipboard: PropertyDescriptor | undefined
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard")
    writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllTimers()
    vi.useRealTimers()
    if (originalClipboard) {
      Object.defineProperty(navigator, "clipboard", originalClipboard)
    } else {
      delete (navigator as { clipboard?: Clipboard }).clipboard
    }
    vi.restoreAllMocks()
  })

  it("renders truncated address with monospace font", () => {
    render(<AddressDisplay value={ACCOUNT} />)
    expect(screen.getByText("GCHS…AAJM")).toBeInTheDocument()
  })

  it("has the full value as accessible label", () => {
    render(<AddressDisplay value={ACCOUNT} />)
    expect(screen.getByLabelText(ACCOUNT)).toBeInTheDocument()
  })

  it("renders full address when full prop is true", () => {
    render(<AddressDisplay value={ACCOUNT} full />)
    expect(screen.getByText(ACCOUNT)).toBeInTheDocument()
  })

  it("copies the complete identifier on copy button click", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const clipboardWrite = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined)
    render(<AddressDisplay value={ACCOUNT} />)

    await user.click(screen.getByRole("button", { name: "Copy account" }))
    expect(clipboardWrite).toHaveBeenCalledWith(ACCOUNT)
  })

  it("hides copy button when copyable is false", () => {
    render(<AddressDisplay value={ACCOUNT} copyable={false} />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("renders explorer link for valid identifiers", () => {
    render(
      <AddressDisplay
        value={ACCOUNT}
        explorerLink
        network="testnet"
        copyable={false}
      />
    )
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute(
      "href",
      `https://stellar.expert/explorer/testnet/account/${ACCOUNT}`
    )
    expect(link).toHaveAttribute("target", "_blank")
  })

  it("does not render broken explorer link for invalid values", () => {
    render(<AddressDisplay value="invalid" explorerLink copyable={false} />)
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("supports contract type", () => {
    render(
      <AddressDisplay
        value={CONTRACT}
        type="contract"
        explorerLink
        network="testnet"
        copyable={false}
      />
    )
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute(
      "href",
      `https://stellar.expert/explorer/testnet/contract/${CONTRACT}`
    )
  })

  it("supports custom visible chars", () => {
    render(<AddressDisplay value={ACCOUNT} visibleChars={6} copyable={false} />)
    expect(screen.getByText("GCHSTH…7YAAJM")).toBeInTheDocument()
  })

  it("has no accessibility violations", async () => {
    const { container } = render(<AddressDisplay value={ACCOUNT} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe("HashDisplay", () => {
  let originalClipboard: PropertyDescriptor | undefined

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard")
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllTimers()
    vi.useRealTimers()
    if (originalClipboard) {
      Object.defineProperty(navigator, "clipboard", originalClipboard)
    } else {
      delete (navigator as { clipboard?: Clipboard }).clipboard
    }
    vi.restoreAllMocks()
  })

  it("defaults to transaction type", () => {
    render(
      <HashDisplay
        value={TX_HASH}
        explorerLink
        network="testnet"
        copyable={false}
      />
    )
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute(
      "href",
      `https://stellar.expert/explorer/testnet/tx/${TX_HASH}`
    )
  })

  it("renders truncated hash", () => {
    render(<HashDisplay value={TX_HASH} copyable={false} />)
    expect(screen.getByText("a1b2…a1b2")).toBeInTheDocument()
  })
})
