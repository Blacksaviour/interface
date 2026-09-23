import React from "react"
import { Link } from "@tanstack/react-router"
import { cn } from "@workspace/ui/lib/utils"

export interface PageLink {
  title: string
  route: string
}

export interface PagerProps {
  prev?: PageLink
  next?: PageLink
  className?: string
}

export function Pager({ prev, next, className }: PagerProps) {
  if (!prev && !next) return null

  return (
    <nav
      aria-label="Pagination navigation"
      className={cn(
        "mt-12 pt-6 border-t border-border flex items-center justify-between gap-4",
        className,
      )}
    >
      {prev ? (
        <Link
          to={prev.route}
          rel="prev"
          className="group flex flex-col items-start px-4 py-3 rounded-lg border border-border hover:border-border-accent transition-colors"
        >
          <span className="text-xs text-text-tertiary font-medium group-hover:text-text-primary">
            ← Previous
          </span>
          <span className="text-sm font-semibold text-text-primary group-hover:text-text-accent">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          to={next.route}
          rel="next"
          className="group flex flex-col items-end px-4 py-3 rounded-lg border border-border hover:border-border-accent transition-colors ml-auto"
        >
          <span className="text-xs text-text-tertiary font-medium group-hover:text-text-primary">
            Next →
          </span>
          <span className="text-sm font-semibold text-text-primary group-hover:text-text-accent">
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
