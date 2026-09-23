import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"
import type { VariantProps } from "class-variance-authority"

// ---------------------------------------------------------------------------
// Callout — admonition component for documentation pages.
//
// Four variants: note, tip, warning, caution.
// Built on design-system tokens; icons are decorative — the variant is
// conveyed to assistive technology by a visible label, not by colour alone.
// ---------------------------------------------------------------------------

const CALLOUT_VARIANTS = ["note", "tip", "warning", "caution"] as const
type CalloutVariant = (typeof CALLOUT_VARIANTS)[number]

const calloutVariants = cva(
  "relative flex w-full gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed",
  {
    variants: {
      variant: {
        note: "border-info/20 bg-info/[0.07] text-info",
        tip: "border-success/20 bg-success/[0.07] text-success",
        warning: "border-warning/30 bg-warning/10 text-warning",
        caution: "border-destructive/30 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "note",
    },
  },
)

// ---------------------------------------------------------------------------
// Decorative icons — one per variant. Purely visual; the visible label
// communicates the variant to assistive technology.
// ---------------------------------------------------------------------------

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4 shrink-0 mt-px", className)}
    >
      <path
        fillRule="evenodd"
        d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8-2a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 018 6zm0-2.5a1 1 0 110 2 1 1 0 010-2z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function TipIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4 shrink-0 mt-px", className)}
    >
      <path
        fillRule="evenodd"
        d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm11.03-2.22a.75.75 0 010 1.06l-4 4a.75.75 0 01-1.06 0l-2-2a.75.75 0 011.06-1.06l1.47 1.47 3.47-3.47a.75.75 0 011.06 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4 shrink-0 mt-px", className)}
    >
      <path
        fillRule="evenodd"
        d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575zM8 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 5zm0 7.5a1 1 0 110-2 1 1 0 010 2z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function CautionIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4 shrink-0 mt-px", className)}
    >
      <path
        fillRule="evenodd"
        d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm5.22-2.78a.75.75 0 011.06 0L8 6.94l1.72-1.72a.75.75 0 111.06 1.06L9.06 8l1.72 1.72a.75.75 0 11-1.06 1.06L8 9.06l-1.72 1.72a.75.75 0 01-1.06-1.06L6.94 8 5.22 6.28a.75.75 0 010-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

const VARIANT_ICONS: Record<CalloutVariant, React.ComponentType<{ className?: string }>> = {
  note: NoteIcon,
  tip: TipIcon,
  warning: WarningIcon,
  caution: CautionIcon,
}

const VARIANT_LABELS: Record<CalloutVariant, string> = {
  note: "Note",
  tip: "Tip",
  warning: "Warning",
  caution: "Caution",
}

// ---------------------------------------------------------------------------
// ARIA: note/tip → polite; warning/caution → assertive
// ---------------------------------------------------------------------------

const VARIANT_LIVE: Record<CalloutVariant, "polite" | "assertive"> = {
  note: "polite",
  tip: "polite",
  warning: "assertive",
  caution: "assertive",
}

interface CalloutProps
  extends Omit<React.ComponentProps<"div">, "title">,
    VariantProps<typeof calloutVariants> {
  /** Admonition variant — controls colour, icon, and default label. */
  variant?: CalloutVariant
  /** Optional title rendered above the children. */
  title?: React.ReactNode
}

function Callout({
  variant = "note",
  title,
  className,
  children,
  ...props
}: CalloutProps) {
  const Icon = VARIANT_ICONS[variant]
  const label = VARIANT_LABELS[variant]
  const live = VARIANT_LIVE[variant]

  return (
    <div
      role={live === "assertive" ? "alert" : "status"}
      aria-live={live}
      className={cn(calloutVariants({ variant }), className)}
      {...props}
    >
      <Icon />
      <div className="min-w-0 flex-1">
        <span className="sr-only">{label}</span>
        {title != null && (
          <p className="mb-1 text-sm font-semibold leading-snug">{title}</p>
        )}
        <div className="[&>p]:m-0 [&>pre]:mt-2 [&>ul]:mt-2">{children}</div>
      </div>
    </div>
  )
}

export { Callout, CALLOUT_VARIANTS, calloutVariants }
export type { CalloutProps, CalloutVariant }
