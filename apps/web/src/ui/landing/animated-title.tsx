import { useEffect, useRef, useState } from "react"

// SO4 markets: the hero sentence is the fixed "Trade [word] from your
// wallet" — every rotating word needs to read naturally in that slot. GMX's
// own list ("with 100x leverage" / "100+ crypto tokens" / "from 7
// blockchains") makes claims that would be false for SO4 today (a
// Stellar-native, still-in-development protocol per README.md), so the
// middle words are swapped for what SO4 actually offers.
const ROTATING_WORDS = [
  "with up to 50x leverage",
  "BTC, ETH and XLM perps",
  "with self-custodied risk",
  "on Stellar Soroban",
  "with deep liquid markets",
]

const HOLD_MS = 2500
const TRANSITION_MS = 250

export function AnimatedTitle() {
  const [index, setIndex] = useState(0)
  // "in" plays on every word change except the very first mount (no
  // entrance animation needed before the reader has seen anything yet —
  // this also keeps first paint deterministic for visual-regression tests,
  // since Playwright's animation freeze can't reliably override an inline
  // `style.animation` referencing a custom property).
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle")
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])

  useEffect(() => {
    if (reducedMotionRef.current) return

    const holdTimer = setInterval(() => {
      setPhase("out")
      const outTimer = setTimeout(() => {
        setIndex((i) => (i + 1) % ROTATING_WORDS.length)
        setPhase("in")
      }, TRANSITION_MS)
      return () => clearTimeout(outTimer)
    }, HOLD_MS)

    return () => clearInterval(holdTimer)
  }, [])

  return (
    <span className="relative inline-block h-[1em] overflow-hidden align-bottom">
      <span
        key={index}
        className="inline-block text-gmx-blue-400"
        style={{
          animation:
            reducedMotionRef.current || phase === "idle"
              ? "none"
              : phase === "in"
                ? "var(--animate-title-in)"
                : "var(--animate-title-out)",
        }}
      >
        {ROTATING_WORDS[index]}
      </span>
    </span>
  )
}
