import { useState } from "react"
import {
  Home01Icon,
  Search01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons"
import { Icon } from "@workspace/ui/components/icon"

import { Button } from "@workspace/ui/components/button"
import { CommandMenu  } from "@workspace/ui/components/command-menu"
import { Kbd } from "@workspace/ui/components/kbd"
import type {CommandMenuGroup} from "@workspace/ui/components/command-menu";

export function CommandMenuGallery() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [lastAction, setLastAction] = useState("No command selected")

  const groups: Array<CommandMenuGroup> = [
    {
      id: "navigation",
      label: "Navigation",
      items: [
        {
          id: "open-dashboard",
          label: "Open dashboard",
          description: "View account activity and positions",
          icon: <Icon icon={Home01Icon} size="md" />,
          shortcut: ["⌘", "1"],
          onSelect: () => setLastAction("Opened dashboard"),
        },
        {
          id: "search-markets",
          label: "Search markets",
          description: "Find a market by name or symbol",
          icon: <Icon icon={Search01Icon} size="md" />,
          shortcut: ["⌘", "K"],
          onSelect: () => setLastAction("Started market search"),
        },
      ],
    },
    {
      id: "preferences",
      label: "Preferences",
      items: [
        {
          id: "open-settings",
          label: "Open settings",
          description: "Manage application preferences",
          icon: <Icon icon={Settings01Icon} size="md" />,
          shortcut: ["⌘", ","],
          onSelect: () => setLastAction("Opened settings"),
        },
      ],
    },
  ]

  return (
    <section className="flex max-w-xl flex-col gap-3 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-sm font-medium">Command menu</h2>
          <p className="text-xs text-muted-foreground">A keyboard-first command surface.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          Open menu <Kbd>⌘ K</Kbd>
        </Button>
      </div>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {lastAction}
      </p>
      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        query={query}
        onQueryChange={setQuery}
        groups={groups}
      />
    </section>
  )
}
