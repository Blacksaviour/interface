import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@workspace/ui/lib/utils"

export type IconSize = "sm" | "md" | "lg"
export type IconTone = "default" | "muted" | "success" | "warning" | "error" | "info"

export interface IconProps extends Omit<React.ComponentProps<typeof HugeiconsIcon>, "size"> {
  size?: IconSize
  tone?: IconTone
}

const sizeMap: Record<IconSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
}

const toneMap: Record<IconTone, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  success: "text-green-500",
  warning: "text-yellow-500",
  error: "text-red-500",
  info: "text-blue-500",
}

export function Icon({
  icon,
  size = "md",
  tone = "default",
  strokeWidth = 2,
  className,
  "aria-label": ariaLabel,
  ...props
}: IconProps) {
  // Decorative by default unless aria-label is provided
  const isDecorative = !ariaLabel

  return (
    <HugeiconsIcon
      icon={icon}
      strokeWidth={strokeWidth}
      className={cn(sizeMap[size], toneMap[tone], className)}
      aria-hidden={isDecorative ? "true" : undefined}
      aria-label={ariaLabel}
      {...props}
    />
  )
}
