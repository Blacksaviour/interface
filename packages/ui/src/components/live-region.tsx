"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

// ---------------------------------------------------------------------------
// LiveRegion (DS-077) — non-disruptive status announcements
// ---------------------------------------------------------------------------

/**
 * `polite` waits for the screen reader to finish what it is saying, `assertive`
 * interrupts immediately, `off` keeps the node mounted but silent.
 *
 * Reach for `assertive` only when ignoring the message costs the user money or
 * data (order rejected, transaction failed, session expired). Everything else
 * — "copied", "filters applied", "3 results" — is `polite`.
 */
type LiveRegionMode = "polite" | "assertive" | "off"

/**
 * A zero-width space is appended to force a text-node change when the same
 * message is announced twice. It is invisible, adds no layout, and is skipped
 * by every mainstream screen reader — but it makes the region's text differ
 * from its previous value, which is what actually triggers re-announcement.
 */
const ZERO_WIDTH_SPACE = "\u200B"

const ROLE_FOR_MODE: Record<LiveRegionMode, "status" | "alert" | undefined> = {
  polite: "status",
  assertive: "alert",
  off: undefined,
}

interface LiveRegionProps extends React.ComponentProps<"div"> {
  /**
   * The text to announce. Prefer this over `children` — it is a plain string,
   * so the region can guarantee a real text-node change on re-announcement.
   */
  message?: string
  /** @default "polite" */
  mode?: LiveRegionMode
  /**
   * Announce the region as a whole rather than just the changed words.
   * Keep this on for short status sentences; turn it off for append-only logs.
   * @default true
   */
  atomic?: boolean
  /** Which mutations are announced. Maps to `aria-relevant`. */
  relevant?: React.AriaAttributes["aria-relevant"]
  /**
   * Also render the message on screen. Off by default — a live region is a
   * companion to visible UI, not a substitute for it. Turn it on when the
   * region *is* the visible status text (a form's "Saving…" line, say), so
   * sighted and screen-reader users read the same string.
   * @default false
   */
  visible?: boolean
  /**
   * Change this to re-announce the current `message` even when the text is
   * identical to what was announced before. Screen readers only speak a live
   * region when its content changes, so "3 results" after "3 results" is
   * silent unless the announcement is explicitly re-keyed.
   *
   * Pass a counter you bump per event, or use {@link useAnnouncer} which keeps
   * one for you.
   */
  announcementKey?: number | string
}

/**
 * An ARIA live region for status text that must reach screen readers without
 * stealing focus.
 *
 * ```tsx
 * <LiveRegion message={`${rows.length} positions`} />
 * <LiveRegion mode="assertive" message={submitError} />
 * ```
 *
 * Mount the region *before* the message exists (empty string is fine) and then
 * fill it in. A region that is inserted into the DOM together with its text is
 * frequently missed, because the assistive technology never observed a change.
 *
 * The node is never a focus target and, unless `visible` is set, occupies no
 * space, so it cannot affect the layout it sits in.
 */
function LiveRegion({
  message,
  mode = "polite",
  atomic = true,
  relevant,
  visible = false,
  announcementKey,
  className,
  children,
  role,
  ...props
}: LiveRegionProps) {
  const repeats = useRepeatCount(announcementKey)

  // Only the string form can be safely re-keyed; arbitrary children are
  // rendered as-is and re-announce on their own DOM changes.
  const content =
    message == null
      ? children
      : repeats % 2 === 1
        ? `${message}${ZERO_WIDTH_SPACE}`
        : message

  return (
    <div
      data-slot="live-region"
      data-mode={mode}
      role={role ?? ROLE_FOR_MODE[mode]}
      aria-live={mode}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn(!visible && "sr-only", className)}
      {...props}
    >
      {content}
    </div>
  )
}

/**
 * Counts how many times `key` has changed. Derived during render (rather than
 * in an effect) so the re-announcement lands in the same commit as the message
 * it belongs to.
 */
function useRepeatCount(key: number | string | undefined) {
  const [count, setCount] = React.useState(0)
  const [seen, setSeen] = React.useState(key)

  if (key !== seen) {
    setSeen(key)
    setCount((current) => current + 1)
  }

  return count
}

interface Announcer {
  /** Current message. Spread into `<LiveRegion message={…} />`. */
  message: string
  /** Spread into `<LiveRegion announcementKey={…} />`. */
  announcementKey: number
  /** Announce `message`, re-announcing it even if the text is unchanged. */
  announce: (message: string) => void
  /** Empty the region so a later identical message reads as new. */
  clear: () => void
}

/**
 * Message state for a {@link LiveRegion}, with re-announcement handled.
 *
 * ```tsx
 * const { message, announcementKey, announce } = useAnnouncer()
 * // …
 * <LiveRegion message={message} announcementKey={announcementKey} />
 * <button onClick={() => announce("Order submitted")}>Submit</button>
 * ```
 *
 * Calling `announce` with the same string twice announces it twice — that is
 * the documented way to repeat an identical message.
 */
function useAnnouncer(initialMessage = ""): Announcer {
  const [state, setState] = React.useState({
    message: initialMessage,
    announcementKey: 0,
  })

  const announce = React.useCallback((message: string) => {
    setState((current) => ({
      message,
      announcementKey: current.announcementKey + 1,
    }))
  }, [])

  const clear = React.useCallback(() => {
    setState((current) => ({
      message: "",
      announcementKey: current.announcementKey + 1,
    }))
  }, [])

  return { ...state, announce, clear }
}

export { LiveRegion, useAnnouncer, ZERO_WIDTH_SPACE }
export type { LiveRegionMode, LiveRegionProps, Announcer }
