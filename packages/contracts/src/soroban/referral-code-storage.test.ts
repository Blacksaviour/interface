/**
 * Storage-helper coverage for referral-code.ts.
 *
 * Each helper guards on `typeof window === "undefined"` so it is safe to call
 * during SSR. Under the node test environment only the SSR branch runs, so the
 * browser branch is exercised here by installing a minimal window/localStorage
 * stub and removing it again.
 */
import { afterEach, describe, expect, it } from "vitest"
import {
  AFFILIATE_CODE_STORAGE_KEY,
  REFERRAL_CODE_STORAGE_KEY,
  REFERRAL_PROMPT_STORAGE_KEY,
  affiliateCodeStorageKey,
  readStoredReferralCode,
  referralPromptStorageKey,
  saveReferralCode,
} from "./referral-code"

const globals = globalThis as Record<string, unknown>

/** Installs a minimal in-memory localStorage and a `window` global. */
function installBrowserGlobals() {
  const store = new Map<string, string>()
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  }
  globals.window = { localStorage }
  globals.localStorage = localStorage
  return store
}

function removeBrowserGlobals() {
  delete globals.window
  delete globals.localStorage
}

afterEach(removeBrowserGlobals)

describe("storage key builders", () => {
  it("namespaces the affiliate code key by account", () => {
    expect(affiliateCodeStorageKey("GABC")).toBe(
      `${AFFILIATE_CODE_STORAGE_KEY}:GABC`
    )
  })

  it("namespaces the referral prompt key by account", () => {
    expect(referralPromptStorageKey("GABC")).toBe(
      `${REFERRAL_PROMPT_STORAGE_KEY}:GABC`
    )
  })
})

describe("referral code storage — server (no window)", () => {
  it("saveReferralCode is a no-op and does not throw", () => {
    expect(() => saveReferralCode("abc")).not.toThrow()
  })

  it("readStoredReferralCode returns null", () => {
    expect(readStoredReferralCode()).toBeNull()
  })
})

describe("referral code storage — browser", () => {
  it("normalizes to upper case and trims before saving", () => {
    const store = installBrowserGlobals()
    saveReferralCode("  myCode  ")
    expect(store.get(REFERRAL_CODE_STORAGE_KEY)).toBe("MYCODE")
  })

  it("reads back a saved code", () => {
    installBrowserGlobals()
    saveReferralCode("abc123")
    expect(readStoredReferralCode()).toBe("ABC123")
  })

  it("returns null when nothing has been saved", () => {
    installBrowserGlobals()
    expect(readStoredReferralCode()).toBeNull()
  })
})
