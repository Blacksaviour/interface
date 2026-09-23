import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"
import type { VariantProps } from "class-variance-authority"

// ---------------------------------------------------------------------------
// Two call styles, one component
//
// 1. Composition (legacy, `variant`):
//      <Alert variant="warning"><AlertDescription>…</AlertDescription></Alert>
//    Children are laid out as direct flex children so a caller-supplied icon
//    sits beside the copy. No icon is injected.
//
// 2. Props (`severity` + title/description/icon/action/onDismiss):
//      <Alert severity="error" title="Failed" description="…" onDismiss={fn} />
//    Content is wrapped in a body slot and a severity icon is supplied by
//    default.
//
// `variant` maps onto `severity` for colour ("danger" → "error"), so both
// styles resolve to the same token-backed surface.
// ---------------------------------------------------------------------------

type Severity = "info" | "success" | "warning" | "error"

/** Legacy colour names kept for existing `variant` callsites. */
type AlertVariant = "info" | "success" | "warning" | "danger" | "muted"

const VARIANT_SEVERITY: Record<AlertVariant, Severity | "muted"> = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "error",
  muted: "muted",
}

// ---------------------------------------------------------------------------
// ARIA live-region semantics (severity API)
//
//  severity  | role    | aria-live  | aria-atomic
//  ----------|---------|------------|------------
//  info      | status  | polite     | false   – supplemental, non-urgent
//  success   | status  | polite     | false
//  warning   | alert   | assertive  | true    – demands attention
//  error     | alert   | assertive  | true    – must be announced immediately
//
// The `variant` API predates this table and only escalates for "danger", so
// it keeps its own mapping rather than silently making every existing
// `variant="warning"` callsite assertive.
// ---------------------------------------------------------------------------

const SEVERITY_ROLE: Record<Severity, "status" | "alert"> = {
  info: "status",
  success: "status",
  warning: "alert",
  error: "alert",
}

const alertVariants = cva(
  "relative flex w-full gap-3 border transition-colors [&>svg]:mt-px [&_svg]:shrink-0",
  {
    variants: {
      severity: {
        info: "border-info/20 bg-info/[0.07] text-info",
        success: "border-success/20 bg-success/[0.07] text-success",
        warning: "border-warning/30 bg-warning/10 text-warning",
        error: "border-destructive/30 bg-destructive/10 text-destructive",
        muted: "border-border bg-muted/30 text-muted-foreground",
      },
      layout: {
        /** Sits inline inside a form, card, or section. */
        inline: "items-start rounded-lg px-4 py-3",
        /** Stretches edge-to-edge as an application-level banner. */
        banner: "items-center rounded-none border-x-0 px-4 py-3",
      },
    },
    defaultVariants: {
      severity: "info",
      layout: "inline",
    },
  }
)

interface AlertProps
  extends Omit<React.ComponentProps<"div">, "title">,
    Omit<VariantProps<typeof alertVariants>, "severity"> {
  /** Severity level – controls colour, icon defaults, and ARIA semantics. */
  severity?: Severity
  /** Legacy colour alias for `severity` ("danger" → "error"). */
  variant?: AlertVariant
  /** Leading icon. Pass any SVG or icon component, or `null` to suppress. */
  icon?: React.ReactNode
  /** Bold label / headline rendered before the message. */
  title?: React.ReactNode
  /** Main message content. */
  description?: React.ReactNode
  /**
   * Action element(s) – a button or link rendered at the end of the content
   * area. Pass your own styled `<button>` or `<a>`.
   */
  action?: React.ReactNode
  /**
   * Dismiss callback. When provided a close button is rendered. The caller
   * is responsible for removing/hiding the alert from the tree.
   */
  onDismiss?: () => void
  /** Accessible label for the dismiss button (defaults to "Dismiss"). */
  dismissLabel?: string
}

// ---------------------------------------------------------------------------
// Default icons (simple inline SVGs – no extra dep required)
// ---------------------------------------------------------------------------

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
    >
      <path
        fillRule="evenodd"
        d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8-2a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 018 6zm0-2.5a1 1 0 110 2 1 1 0 010-2z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function SuccessIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
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
      className={cn("size-4", className)}
    >
      <path
        fillRule="evenodd"
        d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575zM8 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 5zm0 7.5a1 1 0 110-2 1 1 0 010 2z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
    >
      <path
        fillRule="evenodd"
        d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm5.22-2.78a.75.75 0 011.06 0L8 6.94l1.72-1.72a.75.75 0 111.06 1.06L9.06 8l1.72 1.72a.75.75 0 11-1.06 1.06L8 9.06l-1.72 1.72a.75.75 0 01-1.06-1.06L6.94 8 5.22 6.28a.75.75 0 010-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

const DEFAULT_ICONS: Record<Severity | "muted", React.ReactElement | null> = {
  info: <InfoIcon />,
  success: <SuccessIcon />,
  warning: <WarningIcon />,
  error: <ErrorIcon />,
  muted: null,
}

// Small ✕ used for the dismiss button
function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3.5"
    >
      <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
    </svg>
  )
}

function Alert({
  severity,
  variant,
  layout = "inline",
  icon,
  title,
  description,
  action,
  onDismiss,
  dismissLabel = "Dismiss",
  className,
  children,
  role,
  ...props
}: AlertProps) {
  const resolvedSeverity =
    severity ?? (variant != null ? VARIANT_SEVERITY[variant] : "info")

  // `severity` opts into the live-region table above; the legacy `variant`
  // path only escalates for "danger".
  const resolvedRole =
    role ??
    (severity != null
      ? SEVERITY_ROLE[severity]
      : variant === "danger"
        ? "alert"
        : "status")

  const isAssertive = resolvedRole === "alert"

  // Content: prefer explicit title/description props; fall back to children.
  const hasStructured = title != null || description != null

  // Only the props API injects an icon — legacy children lay themselves out
  // as direct flex children and supply their own.
  const resolvedIcon =
    icon !== undefined
      ? icon
      : hasStructured
        ? DEFAULT_ICONS[resolvedSeverity]
        : null

  const usesBody = hasStructured || action != null || onDismiss != null

  const body = hasStructured ? (
    <>
      {title != null && <AlertTitle>{title}</AlertTitle>}
      {description != null && (
        <AlertDescription className={cn(title != null && "mt-0.5")}>
          {description}
        </AlertDescription>
      )}
    </>
  ) : (
    children
  )

  return (
    <div
      data-slot="alert"
      data-severity={resolvedSeverity}
      data-layout={layout}
      role={resolvedRole}
      aria-live={isAssertive ? "assertive" : "polite"}
      aria-atomic={isAssertive}
      className={cn(alertVariants({ severity: resolvedSeverity, layout }), className)}
      {...props}
    >
      {resolvedIcon != null && (
        <span data-slot="alert-icon" className="mt-0.5 shrink-0">
          {resolvedIcon}
        </span>
      )}

      {usesBody ? (
        <div data-slot="alert-body" className="min-w-0 flex-1">
          {body}

          {action != null && (
            <div data-slot="alert-action" className="mt-2">
              {action}
            </div>
          )}
        </div>
      ) : (
        body
      )}

      {onDismiss != null && (
        <button
          type="button"
          data-slot="alert-dismiss"
          aria-label={dismissLabel}
          onClick={onDismiss}
          className={cn(
            "ms-auto shrink-0 self-start rounded-sm p-0.5 opacity-60",
            "transition-opacity hover:opacity-100",
            "focus-visible:ring-2 focus-visible:ring-current/40 focus-visible:outline-none"
          )}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="alert-title"
      className={cn("text-13 leading-snug font-semibold", className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="alert-description"
      className={cn("text-xs leading-relaxed opacity-90", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, alertVariants }
export type { AlertProps, Severity as AlertSeverity, AlertVariant }
