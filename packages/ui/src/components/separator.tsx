import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"
import type { VariantProps } from "class-variance-authority"

// ---------------------------------------------------------------------------
// Separator / Divider (DS-080)
// ---------------------------------------------------------------------------

/**
 * A separator earns its place only when two adjacent blocks are genuinely
 * different kinds of thing and spacing alone leaves that ambiguous. Reach for
 * space or a surface change first — see DESIGN.md, "Separators and dividers".
 *
 * - `subtle` — inside a card or a form, where the surface already groups things
 *   and the line is only a hint.
 * - `default` — between sections of a page or rows of a list.
 * - `strong` — the rare structural cut between two regions that belong to
 *   different tasks (a panel and its footer of destructive actions).
 */
const separatorVariants = cva("shrink-0", {
  variants: {
    tone: {
      subtle: "bg-border/50",
      default: "bg-border",
      strong: "bg-text-tertiary",
    },
    orientation: {
      horizontal: "h-px w-full",
      // `self-stretch` handles the common flex row; `min-h-4` keeps the line
      // visible when the parent has no height of its own and stretch does not
      // apply (align-items other than stretch, or a grid cell).
      vertical: "w-px min-h-4 self-stretch",
    },
  },
  defaultVariants: {
    tone: "default",
    orientation: "horizontal",
  },
})

/** Label styling for {@link Divider}. Contrast-checked in all three themes. */
const dividerLabelClass =
  "shrink-0 text-11 font-medium tracking-wide text-text-secondary uppercase"

type SeparatorOrientation = "horizontal" | "vertical"

export interface SeparatorProps
  extends Omit<React.ComponentProps<"div">, "children">,
    Omit<VariantProps<typeof separatorVariants>, "orientation"> {
  /** @default "horizontal" */
  orientation?: SeparatorOrientation
  /**
   * Hide the separator from assistive technology. Use it whenever the line is
   * purely visual — which is most of the time. A semantic separator is only
   * warranted when the grouping it expresses is not already carried by
   * headings, lists, or landmarks, since every announced separator is one more
   * thing a screen-reader user has to listen past.
   * @default false
   */
  decorative?: boolean
}

/**
 * A one-pixel rule between groups of content.
 *
 * ```tsx
 * <Separator />                                  // semantic, default tone
 * <Separator decorative tone="subtle" />         // visual only
 * <Separator orientation="vertical" />           // in a flex row
 * ```
 *
 * Rendered as a `div` rather than through a primitive: the whole component is
 * its role and its ARIA orientation, and both are worth having stated in one
 * place instead of inherited from a library default.
 */
function Separator({
  className,
  orientation = "horizontal",
  tone = "default",
  decorative = false,
  ...props
}: SeparatorProps) {
  return (
    <div
      data-slot="separator"
      data-orientation={orientation}
      data-decorative={decorative ? "true" : undefined}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      aria-hidden={decorative ? true : undefined}
      className={cn(separatorVariants({ tone, orientation }), className)}
      {...props}
    />
  )
}

export interface DividerProps
  extends Omit<React.ComponentProps<"div">, "children">,
    Omit<VariantProps<typeof separatorVariants>, "orientation"> {
  /**
   * Text shown in the rule. Without it a `Divider` is just a horizontal
   * decorative `Separator`.
   */
  label?: React.ReactNode
  /**
   * Where the label sits. `center` splits the rule in two; `start` and `end`
   * keep a single rule beside the label.
   * @default "center"
   */
  align?: "start" | "center" | "end"
}

/**
 * A horizontal rule with a label in it — "or", "Advanced", "Yesterday" — for
 * naming a break in a form or a list instead of just drawing one.
 *
 * The rules are decorative and the label is ordinary text, so assistive
 * technology reads the words rather than a pile of separator announcements.
 *
 * ```tsx
 * <Divider label="or" />
 * <Divider label="Advanced" align="start" tone="subtle" />
 * ```
 */
function Divider({
  label,
  align = "center",
  tone = "default",
  className,
  ...props
}: DividerProps) {
  if (label == null) {
    return <Separator decorative tone={tone} className={className} {...props} />
  }

  const rule = <Separator decorative tone={tone} className="flex-1" />

  return (
    <div
      data-slot="divider"
      data-align={align}
      className={cn("flex w-full items-center gap-3", className)}
      {...props}
    >
      {align !== "start" && rule}
      <span data-slot="divider-label" className={dividerLabelClass}>
        {label}
      </span>
      {align !== "end" && rule}
    </div>
  )
}

export { Separator, Divider, separatorVariants, dividerLabelClass }
export type { SeparatorOrientation }
