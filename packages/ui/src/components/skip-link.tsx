"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

// ---------------------------------------------------------------------------
// SkipLink (DS-078) — bypass repeated navigation chrome
// ---------------------------------------------------------------------------

/** Shell-wide id of the page's main region. Kept in one place so the link and
 * the landmark can never drift apart. */
const MAIN_CONTENT_ID = "main-content"

export interface SkipLinkProps extends React.ComponentProps<"a"> {
  /**
   * Id of the element to jump to.
   * @default "main-content"
   */
  targetId?: string
  /** @default "Skip to main content" */
  children?: React.ReactNode
}

/**
 * The first focusable element on the page: hidden until focused, then pinned to
 * the top-left corner above the sticky navigation.
 *
 * Render it before the navbar — `AppShell` already does. Activating it moves
 * focus into the main region instead of navigating to `#main-content`, so the
 * URL is left alone (a hash would otherwise become part of the history entry
 * and break back-button behaviour on client-side routes).
 *
 * The target does not need `tabindex` up front; the link adds `tabindex="-1"`
 * on demand so the region can hold focus without becoming a tab stop.
 */
function SkipLink({
  targetId = MAIN_CONTENT_ID,
  className,
  children = "Skip to main content",
  onClick,
  ...props
}: SkipLinkProps) {
  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (event.defaultPrevented) return

    const target = document.getElementById(targetId)
    // No target on this page — fall through to the browser's own hash jump.
    if (!target) return

    event.preventDefault()

    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1")
    }
    target.focus()

    // Guarded: jsdom (and older Safari) has no scrollIntoView options support.
    if (typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ block: "start" })
    }
  }

  return (
    <a
      data-slot="skip-link"
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        "sr-only rounded-md border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-foreground shadow-md",
        // `sr-only` is already absolute; focus only has to undo the clipping
        // and pin the link somewhere visible above the sticky navbar.
        "focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:m-0 focus:size-auto focus:overflow-visible focus:whitespace-nowrap focus:[clip:auto] focus:[clip-path:none]",
        "focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
}

export { SkipLink, MAIN_CONTENT_ID }
