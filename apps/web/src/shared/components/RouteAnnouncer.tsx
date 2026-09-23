"use client"

import * as React from "react"
import { useLocation } from "@tanstack/react-router"
import { LiveRegion, useAnnouncer } from "@workspace/ui/components/live-region"
import { MAIN_CONTENT_ID } from "@workspace/ui/components/skip-link"

// ---------------------------------------------------------------------------
// RouteAnnouncer (DS-078) — focus + announcement handoff after navigation
// ---------------------------------------------------------------------------

export interface RouteAnnouncerProps {
  /**
   * Id of the shell's main region.
   * @default "main-content"
   */
  targetId?: string
}

/**
 * Client-side navigation replaces the page without the browser's own "new
 * document" handling: focus stays on whatever link was clicked, and nothing
 * tells a screen reader that the page changed. This restores both.
 *
 * Mounted once, at the root route. On every *pathname* change it moves focus to
 * the new page's heading (falling back to the main region) and announces the
 * page name in a polite live region.
 *
 * Search-param and hash changes are deliberately ignored — filters, tab state,
 * and sort order all live in the query string, and yanking focus out of a
 * control the user is still operating would be far worse than saying nothing.
 * `useLocation`'s selector means those updates do not even re-render this
 * component.
 */
export function RouteAnnouncer({
  targetId = MAIN_CONTENT_ID,
}: RouteAnnouncerProps) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { message, announcementKey, announce } = useAnnouncer()
  const isInitialRender = React.useRef(true)

  React.useEffect(() => {
    // The first paint is a real document load — the browser already announced
    // the title, and stealing focus on arrival is hostile.
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }

    // The heading and <title> for the new route commit after this effect, so
    // read them a frame later or the announcement describes the old page.
    return afterNextFrame(() => {
      const label = focusMainRegion(targetId)
      announce(label)
    })
  }, [pathname, targetId, announce])

  return <LiveRegion message={message} announcementKey={announcementKey} />
}

/**
 * Moves focus into the new page's content and returns the label that describes
 * it. Prefers the page heading so a screen reader starts reading where a
 * sighted user starts looking.
 */
function focusMainRegion(targetId: string): string {
  const main = document.getElementById(targetId)
  const heading = main?.querySelector<HTMLElement>("h1") ?? null
  const target = heading ?? main

  if (target) {
    // Focusable on demand only — the region must not become a tab stop.
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1")
    }
    // preventScroll: the router owns scroll restoration, and a pointer user
    // clicking a nav link should not be jerked around. Programmatic focus also
    // does not match :focus-visible, so no ring is drawn.
    target.focus({ preventScroll: true })
  }

  return (
    heading?.textContent.trim() ||
    document.title.trim() ||
    "New page"
  )
}

/** rAF where it exists (browsers, jsdom in visual mode), a task otherwise. */
function afterNextFrame(run: () => void): () => void {
  if (typeof requestAnimationFrame === "function") {
    const frame = requestAnimationFrame(run)
    return () => cancelAnimationFrame(frame)
  }
  const timeout = setTimeout(run, 0)
  return () => clearTimeout(timeout)
}
