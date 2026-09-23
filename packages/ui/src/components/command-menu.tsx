import * as React from "react"

import {
  Combobox,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { cn } from "@workspace/ui/lib/utils"

export type CommandMenuItem = {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  shortcut?: string | ReadonlyArray<string>
  disabled?: boolean
  onSelect: () => void
}

export type CommandMenuGroup = {
  id: string
  label?: string
  items: ReadonlyArray<CommandMenuItem>
}

export type CommandMenuProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  query: string
  onQueryChange: (query: string) => void
  groups: ReadonlyArray<CommandMenuGroup>
  triggerRef?: React.RefObject<HTMLElement | null>
  title?: string
  description?: string
  placeholder?: string
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

function ShortcutHint({ shortcut }: { shortcut: CommandMenuItem["shortcut"] }) {
  if (!shortcut) return null

  const keys = Array.isArray(shortcut) ? shortcut : [shortcut]

  return (
    <KbdGroup aria-label={`Shortcut ${keys.join(" ")}`}>
      {keys.map((key) => (
        <Kbd key={key}>{key}</Kbd>
      ))}
    </KbdGroup>
  )
}

export function CommandMenu({
  open,
  onOpenChange,
  query,
  onQueryChange,
  groups,
  triggerRef,
  title = "Command menu",
  description = "Search for a command or destination.",
  placeholder = "Search commands...",
  emptyTitle = "No commands found",
  emptyDescription = "Try a different search term.",
  className,
}: CommandMenuProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filteredGroups = React.useMemo(() => {
    if (!normalizedQuery) return groups

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          [item.label, item.description]
            .filter(Boolean)
            .some((value) =>
              value!.toLocaleLowerCase().includes(normalizedQuery)
            )
        ),
      }))
      .filter((group) => group.items.length > 0)
  }, [groups, normalizedQuery])
  const allItems = React.useMemo(
    () => groups.flatMap((group) => group.items),
    [groups]
  )
  const filteredItems = React.useMemo(
    () => filteredGroups.flatMap((group) => group.items),
    [filteredGroups]
  )
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen && query) {
      onQueryChange("")
    }
  }

  const handleItemSelect = (item: CommandMenuItem) => {
    if (item.disabled) return
    item.onSelect()
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn("max-w-xl gap-0 overflow-hidden p-0", className)}
        initialFocus={inputRef}
        finalFocus={triggerRef ?? true}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>

        <Combobox
          inline
          items={allItems}
          filteredItems={filteredItems}
          filter={null}
          autoHighlight={false}
          inputValue={query}
          onInputValueChange={(value) => onQueryChange(String(value))}
          itemToStringLabel={(item: CommandMenuItem) => item.label}
          value={null}
          onValueChange={(item) => {
            if (item) handleItemSelect(item)
          }}
        >
          <div className="flex items-center border-b border-border px-1">
            <ComboboxInput
              ref={inputRef}
              aria-label="Search commands"
              placeholder={placeholder}
              className="flex-1"
            />
          </div>

          <ScrollArea className="max-h-80" tone="overlay">
            <ComboboxList className="space-y-3 p-2">
              {filteredGroups.map((group) => {
                return (
                  <ComboboxGroup key={group.id} items={group.items}>
                    {group.label && (
                      <ComboboxGroupLabel>{group.label}</ComboboxGroupLabel>
                    )}
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <ComboboxItem
                          key={item.id}
                          value={item}
                          disabled={item.disabled}
                        >
                          {item.icon && (
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4">
                              {item.icon}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">
                              {item.label}
                            </span>
                            {item.description && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {item.description}
                              </span>
                            )}
                          </span>
                          <ShortcutHint shortcut={item.shortcut} />
                        </ComboboxItem>
                      ))}
                    </div>
                  </ComboboxGroup>
                )
              })}
              <ComboboxEmpty>
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyTitle>{emptyTitle}</EmptyTitle>
                    <EmptyDescription>
                      {normalizedQuery
                        ? emptyDescription
                        : "No commands are available yet."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </ComboboxEmpty>
            </ComboboxList>
          </ScrollArea>
        </Combobox>
      </DialogContent>
    </Dialog>
  )
}

export { ShortcutHint }
