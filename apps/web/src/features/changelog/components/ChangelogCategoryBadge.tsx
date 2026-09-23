import { StatusBadge } from "@workspace/ui/components/status-badge"
import { typeLabel, typeToVariant } from "../utils"

interface ChangelogCategoryBadgeProps {
  type: string
  breaking?: boolean
}

export function ChangelogCategoryBadge({
  type,
  breaking = false,
}: ChangelogCategoryBadgeProps) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <StatusBadge variant={typeToVariant(type)}>{typeLabel(type)}</StatusBadge>
      {breaking && <StatusBadge variant="danger-subtle">Breaking</StatusBadge>}
    </span>
  )
}
