import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

export interface PageHeaderProps extends Omit<
  React.ComponentProps<"header">,
  "title"
> {
  /** Page title — the primary heading. */
  title: React.ReactNode
  /** Subtitle / description text rendered below the title. */
  description?: React.ReactNode
  /**
   * Action slot rendered on the right (desktop) or below the title (mobile).
   * Typically buttons, filters, or time-range controls.
   */
  actions?: React.ReactNode
  /** Metadata slot rendered below the description — stats, badges, etc. */
  metadata?: React.ReactNode
  /**
   * Sub-navigation tabs rendered below the header content.
   * Pass the entire `<TabsList>` + `<TabsTrigger>` elements.
   */
  tabs?: React.ReactNode
  /** Breadcrumb navigation rendered above the title. */
  breadcrumbs?: React.ReactNode
}

function PageHeader({
  title,
  description,
  actions,
  metadata,
  tabs,
  breadcrumbs,
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn("mb-6", className)}
      {...props}
    >
      {breadcrumbs != null && (
        <nav data-slot="page-header-breadcrumbs" className="mb-2">
          {breadcrumbs}
        </nav>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {typeof title === "string" ? (
            <h1 className="text-22 font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          ) : (
            title
          )}

          {description != null && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}

          {metadata != null && (
            <div
              data-slot="page-header-metadata"
              className="mt-3 flex flex-wrap items-center gap-3"
            >
              {metadata}
            </div>
          )}
        </div>

        {actions != null && (
          <div
            data-slot="page-header-actions"
            className="flex shrink-0 flex-wrap items-center gap-3"
          >
            {actions}
          </div>
        )}
      </div>

      {tabs != null && (
        <div data-slot="page-header-tabs" className="mt-6">
          {tabs}
        </div>
      )}

      {children}
    </header>
  )
}

export { PageHeader }
