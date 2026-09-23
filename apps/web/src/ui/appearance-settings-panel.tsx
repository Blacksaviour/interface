"use client"

import * as React from "react"
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group"
import { cn } from "@workspace/ui/lib/utils"
import {  useTheme } from "./theme-provider"
import type {Theme} from "./theme-provider";

interface ThemeOption {
  value: Theme
  label: string
  description: string
}

const THEME_OPTIONS: Array<ThemeOption> = [
  {
    value: "light",
    label: "Light",
    description: "Always use light theme",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use dark theme",
  },
  {
    value: "system",
    label: "System",
    description: "Sync with your device settings",
  },
]

export interface AppearanceSettingsPanelProps
  extends React.ComponentProps<"div"> {
  /** Optional heading for the panel. Defaults to "Appearance". */
  heading?: React.ReactNode
  /** When true, shows preview cards for each theme option. Defaults to true. */
  showPreviews?: boolean
}

/**
 * AppearanceSettingsPanel — A settings interface for selecting theme preferences
 * (Light, Dark, or System).
 *
 * ## Features
 *
 * - Displays current theme selection with radio group controls
 * - Shows the resolved theme when "System" is selected
 * - Updates in real-time when system preferences change
 * - Persists selection using the existing theme provider storage
 * - No page reload or flash when changing themes
 * - Optional visual preview cards for each theme
 * - Fully keyboard accessible
 *
 * ## Usage
 *
 * ```tsx
 * <AppearanceSettingsPanel />
 * ```
 *
 * With custom heading and without previews:
 * ```tsx
 * <AppearanceSettingsPanel
 *   heading="Theme Preferences"
 *   showPreviews={false}
 * />
 * ```
 *
 * ## Accessibility
 *
 * - Radio group is keyboard navigable with arrow keys
 * - Each option has a clear label and description
 * - System theme option shows the resolved theme for transparency
 * - Preview cards use semantic design tokens and remain readable in both themes
 */
export function AppearanceSettingsPanel({
  heading = "Appearance",
  showPreviews = true,
  className,
  ...props
}: AppearanceSettingsPanelProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const handleThemeChange = React.useCallback(
    (value: string) => {
      setTheme(value as Theme)
    },
    [setTheme]
  )

  return (
    <div
      data-slot="appearance-settings-panel"
      className={cn("space-y-4", className)}
      {...props}
    >
      {heading && (
        <h3 className="text-15 font-semibold leading-snug">{heading}</h3>
      )}

      <RadioGroup
        value={theme}
        onValueChange={handleThemeChange}
        aria-label="Theme selection"
        className="gap-3"
      >
        {THEME_OPTIONS.map((option) => {
          const isSelected = theme === option.value
          const isSystemAndActive = option.value === "system" && isSelected

          return (
            <label
              key={option.value}
              htmlFor={`theme-${option.value}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface-raised p-4 transition-colors",
                "hover:bg-surface-interactive focus-within:ring-2 focus-within:ring-ring/30",
                isSelected && "border-primary bg-surface-interactive"
              )}
            >
              <RadioGroupItem
                id={`theme-${option.value}`}
                value={option.value}
                className="mt-0.5"
              />

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-13 font-medium">
                    {option.label}
                    {isSystemAndActive && (
                      <span className="ml-2 text-11 font-normal text-muted-foreground">
                        ({resolvedTheme === "dark" ? "Dark" : "Light"})
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-11 text-muted-foreground">
                  {option.description}
                </p>

                {showPreviews && (
                  <div className="pt-2">
                    <ThemePreview theme={option.value} />
                  </div>
                )}
              </div>
            </label>
          )
        })}
      </RadioGroup>

      {theme === "system" && (
        <p className="text-11 text-muted-foreground">
          Currently following your system preference:{" "}
          <span className="font-medium text-foreground">
            {resolvedTheme === "dark" ? "Dark" : "Light"}
          </span>
        </p>
      )}
    </div>
  )
}

/**
 * ThemePreview — A small visual preview card showing how the theme looks.
 * Uses semantic design tokens to remain readable in both themes.
 */
function ThemePreview({ theme }: { theme: Theme }) {
  // Determine preview colors based on the theme option
  const previewTheme = theme === "system" ? "mixed" : theme

  return (
    <div
      className={cn(
        "relative h-16 w-full overflow-hidden rounded-md border",
        previewTheme === "light" && "border-border bg-background",
        previewTheme === "dark" && "border-zinc-700 bg-zinc-900",
        previewTheme === "mixed" &&
          "border-border bg-gradient-to-r from-background via-muted to-zinc-900"
      )}
      aria-hidden="true"
    >
      <div className="flex h-full items-center gap-2 px-3">
        {/* Preview elements using semantic tokens */}
        {previewTheme === "light" && (
          <>
            <div className="size-4 rounded-sm bg-primary" />
            <div className="h-2 flex-1 rounded-full bg-muted" />
            <div className="h-2 w-12 rounded-full bg-muted-foreground/20" />
          </>
        )}

        {previewTheme === "dark" && (
          <>
            <div className="size-4 rounded-sm bg-primary" />
            <div className="h-2 flex-1 rounded-full bg-zinc-800" />
            <div className="h-2 w-12 rounded-full bg-zinc-700" />
          </>
        )}

        {previewTheme === "mixed" && (
          <>
            {/* Light side */}
            <div className="flex flex-1 items-center gap-1.5">
              <div className="size-3 rounded-sm bg-primary" />
              <div className="h-1.5 flex-1 rounded-full bg-muted" />
            </div>
            {/* Separator */}
            <div className="h-12 w-px bg-border" />
            {/* Dark side */}
            <div className="flex flex-1 items-center gap-1.5">
              <div className="size-3 rounded-sm bg-primary" />
              <div className="h-1.5 flex-1 rounded-full bg-zinc-800" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
