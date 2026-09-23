import { cva } from "class-variance-authority"

import { NumericText } from "@workspace/ui/components/numeric"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Text } from "@workspace/ui/components/text"
import { cn } from "@workspace/ui/lib/utils"
import type { NumericRole } from "@workspace/ui/components/numeric"
import type { VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

type StatProps = Omit<ComponentProps<"div">, "role"> & {
  label: string
  value: React.ReactNode
  /** Semantic role for the value — drives its colour. */
  role?: NumericRole
  size?: ComponentProps<typeof NumericText>["size"]
  weight?: ComponentProps<typeof NumericText>["weight"]
  isLoading?: boolean
  /** Rendered under the value (e.g. "Performance APY"). */
  hint?: string
  /** Renders the label as a small uppercase caption. */
  uppercase?: boolean
}

function Stat({
  label,
  value,
  role = "neutral",
  size = "base",
  weight = "medium",
  isLoading = false,
  hint,
  uppercase = false,
  className,
  ...props
}: StatProps) {
  return (
    <div
      data-slot="stat"
      className={cn("flex min-w-0 flex-col gap-1", className)}
      {...props}
    >
      <Text
        size="2xs"
        tone="muted"
        weight={uppercase ? "medium" : "normal"}
        variant={uppercase ? "label" : "body"}
        render={<span />}
      >
        {label}
      </Text>
      {isLoading ? (
        <Skeleton className="h-5 w-20" />
      ) : (
        <NumericText role={role ?? undefined} size={size} weight={weight}>
          {value}
        </NumericText>
      )}
      {hint && (
        <Text size="2xs" tone="muted" render={<span />}>
          {hint}
        </Text>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Compound sub-components (DS-062)
// ---------------------------------------------------------------------------

function StatLabel({
  uppercase = false,
  className,
  children,
  ...props
}: Omit<ComponentProps<"span">, "ref"> & { uppercase?: boolean }) {
  return (
    <Text
      size="2xs"
      tone="muted"
      weight={uppercase ? "medium" : "normal"}
      variant={uppercase ? "label" : "body"}
      render={<span />}
      className={className}
      {...props}
    >
      {children}
    </Text>
  )
}

type StatValueProps = Omit<ComponentProps<"span">, "role"> & {
  role?: NumericRole
  size?: ComponentProps<typeof NumericText>["size"]
  weight?: ComponentProps<typeof NumericText>["weight"]
  isLoading?: boolean
  unavailable?: boolean
}

function StatValue({
  role = "neutral",
  size = "base",
  weight = "medium",
  isLoading = false,
  unavailable = false,
  children,
  className,
  ...props
}: StatValueProps) {
  if (isLoading) {
    return <Skeleton className="h-5 w-20" />
  }

  if (unavailable) {
    return (
      <NumericText
        role="muted"
        size={size}
        weight={weight}
        data-slot="stat-value"
        className={className}
        {...props}
      >
        —
      </NumericText>
    )
  }

  return (
    <NumericText
      role={role ?? undefined}
      size={size}
      weight={weight}
      data-slot="stat-value"
      className={className}
      {...props}
    >
      {children}
    </NumericText>
  )
}

type DeltaTone = "positive" | "negative" | "neutral"

const DELTA_PREFIX: Record<DeltaTone, string> = {
  positive: "▲ ",
  negative: "▼ ",
  neutral: "",
}

const DELTA_ROLE: Record<DeltaTone, NumericRole> = {
  positive: "positive",
  negative: "negative",
  neutral: "neutral",
}

type StatDeltaProps = Omit<ComponentProps<"span">, "role"> & {
  tone?: DeltaTone
}

function StatDelta({
  tone = "neutral",
  children,
  className,
  ...props
}: StatDeltaProps) {
  return (
    <NumericText
      role={DELTA_ROLE[tone] ?? undefined}
      size="2xs"
      data-slot="stat-delta"
      className={className}
      aria-label={`${tone === "positive" ? "increase" : tone === "negative" ? "decrease" : "change"}: ${typeof children === "string" ? children : ""}`}
      {...props}
    >
      <span aria-hidden="true">{DELTA_PREFIX[tone]}</span>
      {children}
    </NumericText>
  )
}

// ---------------------------------------------------------------------------
// StatGroup (DS-062)
// ---------------------------------------------------------------------------

const statGroupVariants = cva("flex gap-6", {
  variants: {
    direction: {
      horizontal: "flex-row flex-wrap items-start",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    direction: "horizontal",
  },
})

type StatGroupProps = ComponentProps<"div"> &
  VariantProps<typeof statGroupVariants>

function StatGroup({
  direction = "horizontal",
  className,
  ...props
}: StatGroupProps) {
  return (
    <div
      data-slot="stat-group"
      role="group"
      className={cn(statGroupVariants({ direction }), className)}
      {...props}
    />
  )
}

export { Stat, StatLabel, StatValue, StatDelta, StatGroup, statGroupVariants }
export type {
  StatProps,
  StatValueProps,
  StatDeltaProps,
  StatGroupProps,
  DeltaTone,
}
