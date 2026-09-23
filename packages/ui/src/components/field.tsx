"use client"

import * as React from "react"
import { Field as FieldPrimitive } from "@base-ui/react/field"

import { cn } from "@workspace/ui/lib/utils"

type FieldChildProps = {
  required?: boolean
}

interface FieldProps extends Omit<FieldPrimitive.Root.Props, "children" | "render"> {
  /** Field label, rendered above the control and linked via a native `<label>`. */
  label?: React.ReactNode
  /** Renders a required indicator next to the label and marks the control `required`. */
  required?: boolean
  /** Switches the error slot to an assertive live region and marks the control `aria-invalid`. */
  invalid?: boolean
  /** Supplemental help text, linked to the control via `aria-describedby`. */
  description?: React.ReactNode
  /** Validation message. Only rendered — and only wired into `aria-describedby` — while `invalid` is true. */
  error?: React.ReactNode
  /** Current input length, paired with `maxLength` to render a character counter. */
  characterCount?: number
  /** Enables the character counter alongside `characterCount`. */
  maxLength?: number
  /** Element rendered before the control, e.g. a leading icon. */
  leading?: React.ReactNode
  /** Element rendered after the control, e.g. a unit suffix or action button. */
  trailing?: React.ReactNode
  className?: string
  /**
   * The form control — an `Input`, `Textarea`, `NumberInput`, etc. Field.Root's
   * context wires up `id`, `aria-describedby`, and `aria-invalid` automatically
   * for any control built on `Field.Control` (which `Input` and `Textarea` are);
   * `required` is additionally cloned onto it directly since Base UI's Field has
   * no first-class `required` concept of its own.
   */
  children: React.ReactElement<FieldChildProps>
}

function Field({
  label,
  required = false,
  invalid = false,
  disabled = false,
  description,
  error,
  characterCount,
  maxLength,
  leading,
  trailing,
  className,
  children,
  ...props
}: FieldProps) {
  const showError = invalid && error != null
  const showDescription = description != null
  const showFooter = showDescription || showError || maxLength != null

  const control = React.cloneElement(children, {
    required: children.props.required ?? required,
  })

  return (
    <FieldPrimitive.Root
      data-slot="field"
      invalid={invalid}
      disabled={disabled}
      className={cn("space-y-1.5", className)}
      {...props}
    >
      {label != null && (
        <FieldPrimitive.Label
          data-slot="field-label"
          className={cn(
            "block text-xs font-medium text-foreground",
            disabled && "opacity-50"
          )}
        >
          {label}
          {required && (
            <span
              aria-hidden="true"
              data-slot="field-required-indicator"
              className="ms-0.5 text-destructive"
            >
              *
            </span>
          )}
        </FieldPrimitive.Label>
      )}

      <div
        data-slot="field-control-row"
        className={cn("flex items-center gap-2", disabled && "opacity-50")}
      >
        {leading != null && (
          <span data-slot="field-leading" className="shrink-0">
            {leading}
          </span>
        )}
        <div className="min-w-0 flex-1">{control}</div>
        {trailing != null && (
          <span data-slot="field-trailing" className="shrink-0">
            {trailing}
          </span>
        )}
      </div>

      {showFooter && (
        <div
          data-slot="field-footer"
          className="flex items-start justify-between gap-2"
        >
          <div className="min-w-0 flex-1">
            {showError ? (
              <FieldPrimitive.Error
                data-slot="field-error"
                match={true}
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                className="text-11 text-destructive"
              >
                {error}
              </FieldPrimitive.Error>
            ) : null}
            {showDescription && !showError ? (
              <FieldPrimitive.Description
                data-slot="field-description"
                className="text-11 text-muted-foreground"
              >
                {description}
              </FieldPrimitive.Description>
            ) : null}
            {showDescription && showError ? (
              <FieldPrimitive.Description
                data-slot="field-description"
                className="sr-only"
              >
                {description}
              </FieldPrimitive.Description>
            ) : null}
          </div>
          {maxLength != null && (
            <span
              data-slot="field-character-count"
              aria-hidden="true"
              className="shrink-0 text-11 text-muted-foreground"
            >
              {characterCount ?? 0}/{maxLength}
            </span>
          )}
        </div>
      )}
    </FieldPrimitive.Root>
  )
}

export { Field }
export type { FieldProps }
