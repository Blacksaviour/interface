import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "@workspace/ui/lib/utils"
import type * as React from "react"

// ---------------------------------------------------------------------------
// VisuallyHidden (DS-077) — screen-reader-only content
// ---------------------------------------------------------------------------

/**
 * Renders content for assistive technology only.
 *
 * Use it for the parts of a label that a sighted user gets from context but a
 * screen-reader user does not — table column meaning, an icon-only control's
 * verb, the unit behind a bare number:
 *
 * ```tsx
 * <button>
 *   <IconTrash aria-hidden="true" />
 *   <VisuallyHidden>Delete position</VisuallyHidden>
 * </button>
 * ```
 *
 * Semantic elements survive the wrapper via `render`, so a hidden heading
 * still lands in the document outline:
 *
 * ```tsx
 * <VisuallyHidden render={<h2 />}>Open positions</VisuallyHidden>
 * ```
 *
 * **When visible text is still required**
 * - Anything the user must act on: form labels, error text, prices, balances,
 *   confirmation copy. Hiding those hurts low-vision, cognitive-load, and
 *   translation users while only helping screen readers.
 * - Any label whose absence would leave a control ambiguous on screen. A
 *   hidden label is a supplement to visible context, never a replacement for
 *   it — see `aria-label` on the control itself if there is genuinely no text.
 * - Anything that needs to be pointer-clickable: hidden content is 1×1px, so
 *   only keyboard focus can reach it (that is what `focusable` is for).
 *
 * @param focusable - Reveal the content while focus is inside it. Required for
 * hidden interactive content (skip links, "jump to" affordances) so keyboard
 * users can see what they are about to activate. Revealing keeps the element
 * absolutely positioned, so surrounding layout never moves.
 */
function VisuallyHidden({
  className,
  focusable = false,
  render,
  ...props
}: useRender.ComponentProps<"span"> & { focusable?: boolean }) {
  // `sr-only` is already `position: absolute`, so revealing only has to undo
  // the size/clip resets — the element stays out of normal flow either way and
  // can never shift the layout around it.
  const ownProps = {
    "data-slot": "visually-hidden",
    ...(focusable ? { "data-focusable": "true" } : {}),
    className: cn(
      "sr-only",
      focusable && [
        "focus-within:z-50 focus-within:rounded-md focus-within:border focus-within:border-border focus-within:bg-surface-raised focus-within:px-2 focus-within:py-1 focus-within:text-sm focus-within:text-foreground focus-within:shadow-md",
        "focus-within:m-0 focus-within:size-auto focus-within:overflow-visible focus-within:whitespace-normal focus-within:[clip:auto] focus-within:[clip-path:none]",
      ],
      className
    ),
  } as React.ComponentProps<"span">

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(ownProps, props),
    render,
    state: { slot: "visually-hidden", focusable },
  })
}

export { VisuallyHidden }
