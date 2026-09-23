import * as React from 'react'

import { cn } from '@workspace/ui/lib/utils'
import { Input } from '@workspace/ui/components/input'

interface TableToolbarProps {
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  searchValue?: string
  children?: React.ReactNode
  count?: number
  onClearAll?: () => void
  className?: string
}

function TableToolbar({
  searchPlaceholder = 'Search\u2026',
  onSearch,
  searchValue,
  children,
  count,
  onClearAll,
  className,
}: TableToolbarProps) {
  return (
    <div
      data-slot="table-toolbar"
      className={cn(
        'flex flex-wrap items-center gap-2 px-5 py-3',
        className,
      )}
    >
      {onSearch && (
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearch(e.target.value)}
          className="w-48"
        />
      )}
      {children && (
        <div className="flex flex-wrap items-center gap-1.5">
          {children}
        </div>
      )}
      {count != null && (
        <span className="ms-auto text-xs text-muted-foreground">
          {count} {count === 1 ? 'result' : 'results'}
        </span>
      )}
      {onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  )
}

export { TableToolbar }
export type { TableToolbarProps }
