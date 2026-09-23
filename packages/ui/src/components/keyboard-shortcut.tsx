import { cva } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"
import type { VariantProps } from "class-variance-authority"

type Platform = "mac" | "windows" | "linux"

const keyboardShortcutVariants = cva(
  "inline-flex items-center gap-0.5 rounded-sm border border-border bg-surface-raised px-1.5 py-0.5 text-10 font-medium text-text-secondary",
  {
    variants: {
      presentation: {
        compact: "gap-0.5",
        grouped: "gap-1",
      },
    },
    defaultVariants: {
      presentation: "compact",
    },
  }
)

type KeyboardShortcutProps = React.ComponentProps<"kbd"> &
  VariantProps<typeof keyboardShortcutVariants> & {
    keys?: Array<string>
    platform?: Platform
  }

function normalizeModifier(mod: string, platform?: Platform): string {
  const normalized = mod.toLowerCase()
  const mac = platform === "mac" || (typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform))

  const modMap: Partial<Record<string, Record<string, string>>> = {
    mod: {
      mac: "⌘",
      windows: "Ctrl",
      linux: "Ctrl",
    },
    alt: {
      mac: "⌥",
      windows: "Alt",
      linux: "Alt",
    },
    shift: {
      mac: "⇧",
      windows: "Shift",
      linux: "Shift",
    },
    enter: {
      mac: "⏎",
      windows: "Enter",
      linux: "Enter",
    },
    cmd: {
      mac: "⌘",
      windows: "Ctrl",
      linux: "Ctrl",
    },
    ctrl: {
      mac: "⌘",
      windows: "Ctrl",
      linux: "Ctrl",
    },
    meta: {
      mac: "⌘",
      windows: "⊞ Win",
      linux: "Super",
    },
    option: {
      mac: "⌥",
      windows: "Alt",
      linux: "Alt",
    },
  }

  const platformMap = modMap[normalized]
  if (platformMap) {
    const currentPlatform = mac ? "mac" : navigator.platform.includes("Win") ? "windows" : "linux"
    return platformMap[currentPlatform]
  }

  return mod.charAt(0).toUpperCase() + mod.slice(1)
}

function KeyboardShortcut({
  className,
  keys,
  platform,
  presentation = "compact",
  ...props
}: KeyboardShortcutProps) {
  if (!keys || keys.length === 0) {
    return null
  }

  return (
    <kbd
      className={cn(keyboardShortcutVariants({ presentation }), className)}
      aria-label={keys.map((k) => normalizeModifier(k, platform)).join(" + ")}
      {...props}
    >
      {keys.map((key, idx) => (
        <span key={`${key}-${idx}`}>
          <span aria-hidden="true">{normalizeModifier(key, platform)}</span>
          {idx < keys.length - 1 && <span className="text-text-tertiary">+</span>}
        </span>
      ))}
    </kbd>
  )
}

export { KeyboardShortcut, keyboardShortcutVariants, type KeyboardShortcutProps }
