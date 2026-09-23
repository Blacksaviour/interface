"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import {  cva } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"
import type {VariantProps} from "class-variance-authority";


/* ────────────────────────────────────────────────────────────────────────────
 * Toolbar Context
 * ──────────────────────────────────────────────────────────────────────────── */

interface ToolbarContextValue {
  orientation: "horizontal" | "vertical"
  rovingTabIndex: number
  setRovingTabIndex: (index: number) => void
  items: Array<React.RefObject<HTMLElement | null>>
  registerItem: (ref: React.RefObject<HTMLElement | null>) => () => void
}

const ToolbarContext = React.createContext<ToolbarContextValue | null>(null)

function useToolbarContext() {
  const context = React.useContext(ToolbarContext)
  if (!context) {
    throw new Error(
      "Toolbar compound components must be used within Toolbar.Root"
    )
  }
  return context
}

/* ────────────────────────────────────────────────────────────────────────────
 * Toolbar Root
 * ──────────────────────────────────────────────────────────────────────────── */

interface ToolbarRootProps extends React.ComponentPropsWithoutRef<"div"> {
  orientation?: "horizontal" | "vertical"
  "aria-label": string
}

const ToolbarRoot = React.forwardRef<HTMLDivElement, ToolbarRootProps>(
  ({ className, orientation = "horizontal", children, ...props }, ref) => {
    const [rovingTabIndex, setRovingTabIndex] = React.useState(-1)
    const itemsRef = React.useRef<Array<React.RefObject<HTMLElement | null>>>([])
    const [initialized, setInitialized] = React.useState(false)

    const registerItem = React.useCallback(
      (itemRef: React.RefObject<HTMLElement | null>) => {
        itemsRef.current.push(itemRef)
        return () => {
          itemsRef.current = itemsRef.current.filter((r) => r !== itemRef)
        }
      },
      []
    )

    // Initialize roving tab index to first enabled item
    React.useEffect(() => {
      if (!initialized && itemsRef.current.length > 0) {
        const firstEnabledIndex = itemsRef.current.findIndex((item) => {
          const el = item.current
          return (
            el &&
            !el.hasAttribute("disabled") &&
            !el.getAttribute("aria-disabled")
          )
        })
        if (firstEnabledIndex !== -1) {
          setRovingTabIndex(firstEnabledIndex)
          setInitialized(true)
        }
      }
    }, [initialized, itemsRef.current.length])

    const contextValue: ToolbarContextValue = React.useMemo(
      () => ({
        orientation,
        rovingTabIndex,
        setRovingTabIndex,
        items: itemsRef.current,
        registerItem,
      }),
      [orientation, rovingTabIndex, registerItem]
    )

    return (
      <ToolbarContext.Provider value={contextValue}>
        <div
          ref={ref}
          role="toolbar"
          data-slot="toolbar"
          data-orientation={orientation}
          aria-orientation={orientation}
          className={cn(
            "flex gap-1",
            orientation === "horizontal"
              ? "flex-row items-center"
              : "flex-col items-start",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </ToolbarContext.Provider>
    )
  }
)
ToolbarRoot.displayName = "Toolbar.Root"

/* ────────────────────────────────────────────────────────────────────────────
 * Toolbar Group
 * ──────────────────────────────────────────────────────────────────────────── */

interface ToolbarGroupProps extends React.ComponentPropsWithoutRef<"div"> {
  "aria-label"?: string
}

const ToolbarGroup = React.forwardRef<HTMLDivElement, ToolbarGroupProps>(
  ({ className, children, ...props }, ref) => {
    const { orientation } = useToolbarContext()

    return (
      <div
        ref={ref}
        role="group"
        data-slot="toolbar-group"
        className={cn(
          "flex shrink-0 gap-0.5",
          orientation === "horizontal"
            ? "flex-row items-center"
            : "flex-col items-start",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ToolbarGroup.displayName = "Toolbar.Group"

/* ────────────────────────────────────────────────────────────────────────────
 * Toolbar Button
 * ──────────────────────────────────────────────────────────────────────────── */

const toolbarButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded border border-transparent text-xs font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default:
          "hover:bg-muted hover:text-foreground data-state-on:bg-accent data-state-on:text-accent-foreground",
        outline:
          "border-border hover:bg-input/50 data-state-on:border-border data-state-on:bg-muted",
        ghost: "hover:bg-muted hover:text-foreground data-state-on:bg-accent",
      },
      size: {
        default: "h-7 gap-1 px-2",
        sm: "h-6 gap-0.5 px-1.5 text-10",
        icon: "size-7",
        "icon-sm": "size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ToolbarButtonProps
  extends
    Omit<ButtonPrimitive.Props, "tabIndex">,
    VariantProps<typeof toolbarButtonVariants> {
  pressed?: boolean
}

const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      pressed,
      disabled,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const {
      orientation,
      rovingTabIndex,
      setRovingTabIndex,
      items,
      registerItem,
    } = useToolbarContext()
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const [localIndex, setLocalIndex] = React.useState<number>(-1)

    // Register this button and get its index
    React.useEffect(() => {
      const unregister = registerItem(buttonRef)
      const index = items.findIndex((item) => item === buttonRef)
      setLocalIndex(index)
      return unregister
    }, [registerItem, items])

    // Handle keyboard navigation
    const handleKeyDown = React.useCallback(
      (
        event: Parameters<NonNullable<ButtonPrimitive.Props["onKeyDown"]>>[0]
      ) => {
        onKeyDown?.(event)

        const enabledItems = items.filter((item) => {
          const el = item.current
          return (
            el &&
            !el.hasAttribute("disabled") &&
            !el.getAttribute("aria-disabled")
          )
        })

        const currentIndex = enabledItems.findIndex(
          (item) => item === buttonRef
        )
        if (currentIndex === -1) return

        let nextIndex = currentIndex

        if (orientation === "horizontal") {
          if (event.key === "ArrowRight") {
            event.preventDefault()
            nextIndex = (currentIndex + 1) % enabledItems.length
          } else if (event.key === "ArrowLeft") {
            event.preventDefault()
            nextIndex =
              (currentIndex - 1 + enabledItems.length) % enabledItems.length
          }
        } else {
          if (event.key === "ArrowDown") {
            event.preventDefault()
            nextIndex = (currentIndex + 1) % enabledItems.length
          } else if (event.key === "ArrowUp") {
            event.preventDefault()
            nextIndex =
              (currentIndex - 1 + enabledItems.length) % enabledItems.length
          }
        }

        if (event.key === "Home") {
          event.preventDefault()
          nextIndex = 0
        } else if (event.key === "End") {
          event.preventDefault()
          nextIndex = enabledItems.length - 1
        }

        if (nextIndex !== currentIndex) {
          const nextItem = enabledItems[nextIndex]
          const globalIndex = items.findIndex((item) => item === nextItem)
          setRovingTabIndex(globalIndex)
          nextItem.current?.focus()
        }
      },
      [items, orientation, onKeyDown, setRovingTabIndex]
    )

    return (
      <ButtonPrimitive
        ref={(node) => {
          const buttonNode = node as HTMLButtonElement | null
          buttonRef.current = buttonNode
          if (typeof ref === "function") {
            ref(buttonNode)
          } else if (ref) {
            ref.current = buttonNode
          }
        }}
        data-slot="toolbar-button"
        data-state={pressed ? "on" : "off"}
        aria-pressed={pressed !== undefined ? pressed : undefined}
        tabIndex={!disabled && localIndex === rovingTabIndex ? 0 : -1}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        className={cn(toolbarButtonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
ToolbarButton.displayName = "Toolbar.Button"

/* ────────────────────────────────────────────────────────────────────────────
 * Toolbar Link
 * ──────────────────────────────────────────────────────────────────────────── */

interface ToolbarLinkProps
  extends
    React.ComponentPropsWithoutRef<"a">,
    VariantProps<typeof toolbarButtonVariants> {}

const ToolbarLink = React.forwardRef<HTMLAnchorElement, ToolbarLinkProps>(
  (
    { className, variant = "default", size = "default", onKeyDown, ...props },
    ref
  ) => {
    const {
      orientation,
      rovingTabIndex,
      setRovingTabIndex,
      items,
      registerItem,
    } = useToolbarContext()
    const linkRef = React.useRef<HTMLAnchorElement>(null)
    const [localIndex, setLocalIndex] = React.useState<number>(-1)

    React.useEffect(() => {
      const unregister = registerItem(linkRef)
      const index = items.findIndex((item) => item === linkRef)
      setLocalIndex(index)
      return unregister
    }, [registerItem, items])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLAnchorElement>) => {
        onKeyDown?.(event)

        const enabledItems = items.filter((item) => item.current)
        const currentIndex = enabledItems.findIndex((item) => item === linkRef)
        if (currentIndex === -1) return

        let nextIndex = currentIndex

        if (orientation === "horizontal") {
          if (event.key === "ArrowRight") {
            event.preventDefault()
            nextIndex = (currentIndex + 1) % enabledItems.length
          } else if (event.key === "ArrowLeft") {
            event.preventDefault()
            nextIndex =
              (currentIndex - 1 + enabledItems.length) % enabledItems.length
          }
        } else {
          if (event.key === "ArrowDown") {
            event.preventDefault()
            nextIndex = (currentIndex + 1) % enabledItems.length
          } else if (event.key === "ArrowUp") {
            event.preventDefault()
            nextIndex =
              (currentIndex - 1 + enabledItems.length) % enabledItems.length
          }
        }

        if (event.key === "Home") {
          event.preventDefault()
          nextIndex = 0
        } else if (event.key === "End") {
          event.preventDefault()
          nextIndex = enabledItems.length - 1
        }

        if (nextIndex !== currentIndex) {
          const nextItem = enabledItems[nextIndex]
          const globalIndex = items.findIndex((item) => item === nextItem)
          setRovingTabIndex(globalIndex)
          nextItem.current?.focus()
        }
      },
      [items, orientation, onKeyDown, setRovingTabIndex]
    )

    return (
      <a
        ref={(node) => {
          linkRef.current = node
          if (typeof ref === "function") {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        data-slot="toolbar-link"
        tabIndex={localIndex === rovingTabIndex ? 0 : -1}
        onKeyDown={handleKeyDown}
        className={cn(toolbarButtonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
ToolbarLink.displayName = "Toolbar.Link"

/* ────────────────────────────────────────────────────────────────────────────
 * Toolbar Separator
 * ──────────────────────────────────────────────────────────────────────────── */

interface ToolbarSeparatorProps extends React.ComponentPropsWithoutRef<"div"> {}

const ToolbarSeparator = React.forwardRef<
  HTMLDivElement,
  ToolbarSeparatorProps
>(({ className, ...props }, ref) => {
  const { orientation } = useToolbarContext()

  return (
    <div
      ref={ref}
      role="separator"
      data-slot="toolbar-separator"
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "mx-1 h-4 w-px" : "my-1 h-px w-full",
        className
      )}
      {...props}
    />
  )
})
ToolbarSeparator.displayName = "Toolbar.Separator"

/* ────────────────────────────────────────────────────────────────────────────
 * Exports
 * ──────────────────────────────────────────────────────────────────────────── */

export const Toolbar = {
  Root: ToolbarRoot,
  Group: ToolbarGroup,
  Button: ToolbarButton,
  Link: ToolbarLink,
  Separator: ToolbarSeparator,
}

export type {
  ToolbarRootProps,
  ToolbarGroupProps,
  ToolbarButtonProps,
  ToolbarLinkProps,
  ToolbarSeparatorProps,
}
