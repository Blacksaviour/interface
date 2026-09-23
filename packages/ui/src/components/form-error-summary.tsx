"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Error/alert circle icon (inline SVG).
 */
function ErrorCircleIcon({ className }: { className?: string }) {
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

/**
 * A single validation error reference in a FormErrorSummary.
 */
export interface FormError {
  /** Unique identifier for the field. Must match the field's `id` attribute. */
  id: string
  /** Human-readable error message. */
  message: string
  /** Optional field label for better context (e.g., "Email address"). */
  fieldLabel?: string
}

export interface FormErrorSummaryProps extends Omit<
  React.ComponentProps<"div">,
  "title"
> {
  /**
   * Array of validation errors. Each error must reference a valid field `id`
   * so the summary can link to and focus the corresponding control.
   */
  errors: Array<FormError>
  /**
   * Summary heading. Defaults to "There are {count} errors with your submission".
   */
  title?: React.ReactNode
  /**
   * Optional guidance text rendered below the title to help users correct errors.
   * Example: "Please review and correct the following errors before submitting."
   */
  guidance?: React.ReactNode
  /**
   * When `true`, the summary receives focus after render (typically after a
   * failed form submission). Use a state change to trigger this — do not keep
   * it permanently `true` or it will steal focus on every re-render.
   */
  autoFocus?: boolean
  /**
   * When `true`, the summary and its count are announced via `role="alert"`
   * and `aria-live="assertive"`. Only enable this once per submission to avoid
   * repeated disruptive announcements on dynamic error updates.
   */
  announceOnce?: boolean
}

/**
 * FormErrorSummary — A validation summary that lists form errors and links to
 * invalid fields.
 *
 * ## Accessibility
 *
 * - Uses `role="alert"` and `aria-live="assertive"` when `announceOnce` is enabled
 *   to announce the error count and title after a failed submission.
 * - Each error is a navigable link that moves focus to the associated field when
 *   activated, enabling quick keyboard navigation to invalid controls.
 * - Dynamic error changes use `aria-live="polite"` to avoid repeated disruptive
 *   announcements while still keeping screen readers informed.
 * - Works inside scrollable containers — activating an error link scrolls the
 *   target field into view using `scrollIntoView({ block: "center" })`.
 *
 * ## Usage
 *
 * ```tsx
 * const [errors, setErrors] = useState<FormError[]>([])
 * const [showSummary, setShowSummary] = useState(false)
 *
 * function handleSubmit(e: React.FormEvent) {
 *   e.preventDefault()
 *   const validationErrors = validate(formData)
 *   if (validationErrors.length > 0) {
 *     setErrors(validationErrors)
 *     setShowSummary(true) // Triggers autoFocus and announceOnce
 *   }
 * }
 *
 * return (
 *   <form onSubmit={handleSubmit}>
 *     {showSummary && errors.length > 0 && (
 *       <FormErrorSummary
 *         errors={errors}
 *         autoFocus
 *         announceOnce
 *       />
 *     )}
 *     <Field id="email" label="Email" invalid={!!errors.find(e => e.id === 'email')}>
 *       <Input type="email" />
 *     </Field>
 *   </form>
 * )
 * ```
 *
 * ## Integration with Field component
 *
 * The FormErrorSummary works seamlessly with the existing `Field` component from
 * `@workspace/ui/components/field`. Each error's `id` must match the Field's `id`
 * prop so the summary can link to the correct control:
 *
 * 1. Set a unique `id` on each Field: `<Field id="email" ...>`
 * 2. Pass matching error IDs to FormErrorSummary: `{ id: "email", message: "Invalid email" }`
 * 3. Mark fields as invalid: `<Field invalid={hasError} error={errorMessage} ...>`
 *
 * The Field component automatically wires `aria-describedby` and `aria-invalid`,
 * so when a user activates an error link, the browser focuses the control and
 * screen readers announce its label, state, and inline error message.
 */
export function FormErrorSummary({
  errors,
  title,
  guidance,
  autoFocus = false,
  announceOnce = false,
  className,
  ...props
}: FormErrorSummaryProps) {
  const summaryRef = React.useRef<HTMLDivElement>(null)
  const hasRendered = React.useRef(false)

  // Focus the summary once when autoFocus is enabled (typically after a failed submit)
  React.useEffect(() => {
    if (autoFocus && summaryRef.current && !hasRendered.current) {
      summaryRef.current.focus()
      hasRendered.current = true
    }
  }, [autoFocus])

  // Reset the "has rendered" flag when errors become empty so the next submission
  // can trigger focus again
  React.useEffect(() => {
    if (errors.length === 0) {
      hasRendered.current = false
    }
  }, [errors.length])

  // Don't render if there are no errors
  if (errors.length === 0) {
    return null
  }

  const errorCount = errors.length
  const defaultTitle = `There ${errorCount === 1 ? "is" : "are"} ${errorCount} ${errorCount === 1 ? "error" : "errors"} with your submission`
  const resolvedTitle = title ?? defaultTitle

  /**
   * Handles error link activation. Focuses the associated field and scrolls it
   * into view, ensuring it's visible even inside scrollable dialogs.
   */
  function handleErrorLinkClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    fieldId: string
  ) {
    e.preventDefault()
    const field = document.getElementById(fieldId)
    if (field) {
      // Focus the field
      field.focus()
      // Scroll into view with the field centered vertically for better visibility
      field.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  return (
    <div
      ref={summaryRef}
      data-slot="form-error-summary"
      role={announceOnce ? "alert" : "region"}
      aria-live={announceOnce ? "assertive" : "polite"}
      aria-atomic={announceOnce}
      aria-labelledby="form-error-summary-title"
      tabIndex={-1}
      className={cn(
        "rounded-lg border border-destructive/30 bg-destructive/10 p-4 focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:outline-none",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <ErrorCircleIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2
              id="form-error-summary-title"
              className="text-13 leading-snug font-semibold text-destructive"
            >
              {resolvedTitle}
            </h2>
            {guidance && (
              <p className="mt-1 text-xs leading-relaxed text-destructive/90">
                {guidance}
              </p>
            )}
          </div>

          <ul className="space-y-2" role="list">
            {errors.map((error) => {
              const linkText = error.fieldLabel
                ? `${error.fieldLabel}: ${error.message}`
                : error.message

              return (
                <li key={error.id}>
                  <a
                    href={`#${error.id}`}
                    onClick={(e) => handleErrorLinkClick(e, error.id)}
                    className={cn(
                      "inline-flex items-start gap-1.5 text-xs leading-relaxed text-destructive underline underline-offset-2",
                      "transition-colors hover:text-destructive/80",
                      "focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:ring-offset-2 focus-visible:outline-none"
                    )}
                  >
                    <span className="mt-0.5 inline-block size-1 shrink-0 rounded-full bg-destructive" />
                    <span>{linkText}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
