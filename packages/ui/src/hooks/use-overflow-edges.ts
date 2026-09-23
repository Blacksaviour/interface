"use client"

import * as React from "react"

// ---------------------------------------------------------------------------
// useOverflowEdges (DS-079) — scroll-position affordances without re-renders
// ---------------------------------------------------------------------------

type ScrollAxis = "vertical" | "horizontal" | "both"

/** Which directions still have content the user has not scrolled to. */
interface OverflowEdges {
  top: boolean
  bottom: boolean
  left: boolean
  right: boolean
}

const EDGES = ["top", "bottom", "left", "right"] as const

const EDGE_ATTRIBUTE: Record<keyof OverflowEdges, string> = {
  top: "data-overflow-top",
  bottom: "data-overflow-bottom",
  left: "data-overflow-left",
  right: "data-overflow-right",
}

/**
 * Fractional scroll offsets are normal (zoom levels, HiDPI, sub-pixel layout),
 * so comparing against an exact 0 makes the end-of-scroll state flicker.
 */
const EDGE_TOLERANCE = 1

/**
 * Tracks whether a scroll container has content beyond each of its edges and
 * publishes the result as `data-overflow-*` attributes on the outer element.
 *
 * The attributes are written straight to the DOM instead of going through
 * state: scrolling a dense table fires scroll events at display rate, and
 * re-rendering the subtree on each one is exactly the cost this avoids. Edge
 * affordances are then pure CSS (`group-data-[overflow-bottom=true]`), so the
 * React tree renders once no matter how far the user scrolls.
 *
 * Updates come from three sources — the scroll event, a `ResizeObserver` on the
 * viewport and its content (rows arriving, panels collapsing), and window
 * resize — all coalesced into one measurement per frame.
 *
 * @param axis - Which axes to report. Edges on an unwatched axis stay `false`.
 * @param onEdgesChange - Optional notification for callers that genuinely need
 * the values in React. Opt-in, because subscribing re-introduces renders.
 */
function useOverflowEdges(
  axis: ScrollAxis = "vertical",
  onEdgesChange?: (edges: OverflowEdges) => void
) {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const onEdgesChangeRef = React.useRef(onEdgesChange)

  React.useEffect(() => {
    onEdgesChangeRef.current = onEdgesChange
  }, [onEdgesChange])

  React.useEffect(() => {
    const root = rootRef.current
    const viewport = viewportRef.current
    if (!root || !viewport) return

    let frame: number | null = null
    let previous: OverflowEdges | null = null

    const measure = () => {
      frame = null

      const watchVertical = axis !== "horizontal"
      const watchHorizontal = axis !== "vertical"
      const edges: OverflowEdges = {
        top: watchVertical && viewport.scrollTop > EDGE_TOLERANCE,
        bottom:
          watchVertical &&
          viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop >
            EDGE_TOLERANCE,
        left: watchHorizontal && viewport.scrollLeft > EDGE_TOLERANCE,
        right:
          watchHorizontal &&
          viewport.scrollWidth - viewport.clientWidth - viewport.scrollLeft >
            EDGE_TOLERANCE,
      }

      const unchanged =
        previous !== null &&
        EDGES.every((edge) => previous?.[edge] === edges[edge])
      if (unchanged) return
      previous = edges

      for (const edge of EDGES) {
        root.setAttribute(EDGE_ATTRIBUTE[edge], edges[edge] ? "true" : "false")
      }
      onEdgesChangeRef.current?.(edges)
    }

    const schedule = () => {
      if (typeof requestAnimationFrame !== "function") {
        measure()
        return
      }
      if (frame !== null) return
      frame = requestAnimationFrame(measure)
    }

    // Initial state, before the user has scrolled anything.
    measure()

    viewport.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)

    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver === "function") {
      observer = new ResizeObserver(schedule)
      observer.observe(viewport)
      // The viewport can keep its size while the content inside it grows.
      for (const child of Array.from(viewport.children)) {
        observer.observe(child)
      }
    }

    return () => {
      if (frame !== null && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(frame)
      }
      viewport.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      observer?.disconnect()
    }
  }, [axis])

  return { rootRef, viewportRef }
}

export { useOverflowEdges, EDGE_ATTRIBUTE, EDGE_TOLERANCE }
export type { OverflowEdges, ScrollAxis }
