# Accessibility primitives

The shared building blocks for screen-reader-only content, status announcements,
and keyboard bypass. Added in DS-077 (`VisuallyHidden`, `LiveRegion`) and
DS-078 (`SkipLink`, post-navigation focus).

Before this pass, `sr-only` markup and `aria-live` regions were hand-rolled at
each call site — a dozen slightly different spellings, a few of them silent in
practice. These primitives are the one spelling.

---

## `VisuallyHidden`

`packages/ui/src/components/visually-hidden.tsx`

Content for assistive technology only. Clipped by `sr-only`, which is
absolutely positioned, so it can never shift the layout around it.

```tsx
<button>
  <IconTrash aria-hidden="true" />
  <VisuallyHidden>Delete position</VisuallyHidden>
</button>

{/* Semantic elements survive via `render`, so the outline stays intact */}
<VisuallyHidden render={<h2 />}>Open positions</VisuallyHidden>

{/* Hidden interactive content must be visible once focused */}
<VisuallyHidden focusable>
  <a href="#orders">Jump to orders</a>
</VisuallyHidden>
```

### Use it for

- The verb behind an icon-only control, when `aria-label` would lose markup.
- Table column meaning a sighted user reads from position.
- Units and qualifiers a sighted user reads from a nearby heading.
- A heading that structures a region for screen readers where visible design
  already makes the grouping obvious.

### Do **not** use it for

- **Anything the user must act on**: form labels, validation errors, prices,
  balances, confirmation copy. Hiding those helps screen readers and hurts
  low-vision, cognitive-load, and translation users.
- **Replacing a visible label** on a control that would otherwise be
  ambiguous on screen. A hidden label supplements visible context; it does not
  substitute for it.
- **Pointer-reachable content.** Hidden content is 1×1px — only keyboard focus
  can reach it, which is what `focusable` is for.

---

## `LiveRegion`

`packages/ui/src/components/live-region.tsx`

Status text that reaches screen readers without stealing focus.

```tsx
<LiveRegion message={`${rows.length} positions`} />        // polite  → role=status
<LiveRegion mode="assertive" message={submitError} />      // assertive → role=alert
<LiveRegion mode="off" message={draft} />                  // mounted, silent
<LiveRegion visible message="Saving…" />                   // also rendered on screen
```

| Prop | Effect |
| --- | --- |
| `mode` | `polite` (default) waits its turn, `assertive` interrupts, `off` stays silent |
| `atomic` | `true` (default) announces the whole region; `false` for append-only logs |
| `relevant` | maps to `aria-relevant` |
| `visible` | also render the message on screen |
| `announcementKey` | change it to re-announce identical text |

### Two rules that decide whether it works at all

1. **Mount the region before the message exists.** An empty region that later
   fills in is announced; a region inserted together with its text is
   frequently missed, because the assistive technology never observed a change.
2. **Identical text is silent.** "3 results" after "3 results" is not a change.
   To repeat it deliberately, bump `announcementKey` — or use `useAnnouncer`,
   which keeps the counter for you:

```tsx
const { message, announcementKey, announce } = useAnnouncer()

<LiveRegion message={message} announcementKey={announcementKey} />
<button onClick={() => announce("Order submitted")}>Submit</button>
```

Under the hood a zero-width space is toggled onto the end of the string, which
changes the text node without changing what the user hears.

Reserve `assertive` for messages whose loss costs money or data — order
rejected, transaction failed, session expired. Everything else is `polite`.

This is not a notification queue: each region owns one message. Toasts remain
the job of the toast layer.

---

## `SkipLink` and post-navigation focus

`packages/ui/src/components/skip-link.tsx`,
`apps/web/src/shared/components/RouteAnnouncer.tsx`

`AppShell` renders the skip link as its first focusable element and marks its
content area as `<main id="main-content" tabindex="-1">`. Both are on by
default; pass `skipLink={false}` / `landmark={false}` only for a shell nested
inside another one (gallery previews), where a second landmark or a duplicate
id would be invalid.

- The link is clipped until focused, then pins itself above the sticky navbar.
- Activating it moves focus into the main region **without** navigating to
  `#main-content`, so the hash never lands in the history entry.
- `RouteAnnouncer`, mounted once at the root route, moves focus to the new
  page's `<h1>` after each **pathname** change and announces its title in a
  polite region.
- Search-param and hash changes are ignored on purpose: filters, tabs, and sort
  order live in the query string, and pulling focus out of a control the user is
  still operating is worse than saying nothing.
- Focus is handed over with `preventScroll` and lands on a `tabindex="-1"`
  target, so a pointer user gets neither a jump nor a focus ring
  (programmatic focus does not match `:focus-visible`).

Focus *inside* dialogs, menus, and other overlays stays with those components.
