import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"
import type { VariantProps } from "class-variance-authority"

/**
 * Typography scale for body copy.
 *
 * ds-allow: the arbitrary value below is quoted as the anti-pattern this
 * component exists to replace, not applied to any element.
 *
 * Feature code should pick a `size`/`tone` pair instead of reaching for
 * arbitrary values like `text-[11px] text-muted-foreground/60`.
 */
const textVariants = cva("", {
  variants: {
    size: {
      "2xs": "text-10 leading-4",
      xs: "text-11 leading-4",
      sm: "text-xs leading-5",
      md: "text-13 leading-5",
      base: "text-sm leading-5",
      lg: "text-base leading-6",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      subtle: "text-muted-foreground/60",
      primary: "text-primary",
      success: "text-success",
      warning: "text-warning",
      info: "text-info",
      danger: "text-destructive",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    /** `label` renders the small uppercase caption used above stat values. */
    variant: {
      body: "",
      label: "uppercase tracking-wider",
      leading: "leading-relaxed",
    },
    truncate: {
      true: "min-w-0 truncate",
      false: "",
    },
  },
  defaultVariants: {
    size: "sm",
    tone: "default",
    weight: "normal",
    variant: "body",
    truncate: false,
  },
})

function Text({
  className,
  size,
  tone,
  weight,
  variant,
  truncate,
  render,
  ...props
}: useRender.ComponentProps<"p"> & VariantProps<typeof textVariants>) {
  return useRender({
    defaultTagName: "p",
    props: mergeProps<"p">(
      {
        className: cn(
          textVariants({ size, tone, weight, variant, truncate }),
          className
        ),
      },
      props
    ),
    render,
    state: { slot: "text", tone },
  })
}

const headingVariants = cva("tracking-tight text-foreground", {
  variants: {
    level: {
      1: "text-22 font-semibold",
      2: "text-15 font-semibold",
      3: "text-13 font-semibold",
      4: "text-xs font-semibold",
    },
  },
  defaultVariants: { level: 2 },
})

type HeadingProps = useRender.ComponentProps<"h2"> &
  VariantProps<typeof headingVariants>

/**
 * Section heading. `level` drives both the rendered tag and the type scale, so
 * a page title is always `level={1}` and a card title `level={3}`.
 */
function Heading({ className, level = 2, render, ...props }: HeadingProps) {
  return useRender({
    defaultTagName: `h${level ?? 2}`,
    props: mergeProps<"h2">(
      { className: cn(headingVariants({ level }), className) },
      props
    ),
    render,
    state: { slot: "heading", level },
  })
}

export { Text, Heading, textVariants, headingVariants }
