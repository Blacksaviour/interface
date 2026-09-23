import { cn } from "@workspace/ui/lib/utils"

/**
 * Shared data-table primitives.
 *
 * `Table` wraps the `<table>` in its own horizontally scrollable container so
 * wide financial tables never push the page body sideways on mobile.
 */
function Table({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<"table"> & { containerClassName?: string }) {
  return (
    <div
      data-slot="table-container"
      className={cn("w-full overflow-x-auto", containerClassName)}
    >
      <table
        data-slot="table"
        className={cn("w-full text-xs", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={className} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={className} {...props} />
}

/** Header row. Carries the muted fill + bottom rule. */
function TableHeadRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-head-row"
      className={cn("border-b border-border bg-muted/25 text-start", className)}
      {...props}
    />
  )
}

function TableHead({
  className,
  align = "left",
  ...props
}: Omit<React.ComponentProps<"th">, "align"> & {
  align?: "left" | "right"
}) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "px-5 py-3 font-medium text-muted-foreground",
        align === "right" && "text-right",
        className
      )}
      {...props}
    />
  )
}

function TableRow({
  className,
  interactive = true,
  ...props
}: React.ComponentProps<"tr"> & { interactive?: boolean }) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border/40 last:border-b-0",
        interactive && "transition-colors hover:bg-muted/20",
        className
      )}
      {...props}
    />
  )
}

function TableCell({
  className,
  align = "left",
  ...props
}: Omit<React.ComponentProps<"td">, "align"> & {
  align?: "left" | "right"
}) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-5 py-3.5", align === "right" && "text-right", className)}
      {...props}
    />
  )
}

/** Full-width row used to host an `EmptyState` inside a table body. */
function TableEmptyRow({
  colSpan,
  className,
  children,
  ...props
}: React.ComponentProps<"td"> & { colSpan: number }) {
  return (
    <tr data-slot="table-empty-row">
      <td colSpan={colSpan} className={cn("px-5 py-10", className)} {...props}>
        {children}
      </td>
    </tr>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableHeadRow,
  TableHead,
  TableRow,
  TableCell,
  TableEmptyRow,
}
