# Windows Forced-Colors Mode Verification Checklist

This checklist helps verify that SO4's interface remains operable when Windows High Contrast Mode is active. Forced-colors mode replaces custom colors with system colors, which can break gradients, translucent elements, and custom focus treatments.

## Setup

### Enable Windows High Contrast Mode

**Windows 10/11:**
1. Press `Left Alt + Left Shift + Print Screen`
2. Or: Settings → Accessibility → High Contrast → Turn on High Contrast

**Browser Testing:**
- Test in Edge or Chrome (best support for forced-colors)
- Firefox also supports it but with some differences

### Emulate in DevTools

**Chrome/Edge:**
1. Open DevTools (F12)
2. Press `Ctrl+Shift+P` → "Rendering"
3. Scroll to "Emulate CSS media feature forced-colors"
4. Select "active"

## Core Components Checklist

### ✅ Buttons

- [ ] Button text is readable against button background
- [ ] Button borders are visible
- [ ] Hover state shows clear visual change (highlight)
- [ ] Focus indicator is clearly visible (2px outline)
- [ ] Disabled buttons show grayed text
- [ ] Icon buttons remain identifiable
- [ ] All button variants (primary, outline, ghost, destructive) work

**Test locations:**
- `/` - Hero CTA buttons
- `/trade` - Place order, Cancel buttons
- All forms and dialogs

### ✅ Links

- [ ] Links use system LinkText color
- [ ] Links are underlined
- [ ] Hover/focus shows highlight background
- [ ] Visited links remain distinguishable (if applicable)

**Test locations:**
- Navigation menu
- Footer links
- Inline text links

### ✅ Form Inputs

- [ ] Input fields have visible borders
- [ ] Input text is readable
- [ ] Placeholder text is visible (GrayText)
- [ ] Focus outline is clearly visible
- [ ] Invalid state shows doubled border
- [ ] Disabled inputs show grayed text
- [ ] Labels are associated and readable

**Test locations:**
- `/trade` - Order form inputs
- `/pools` - Liquidity form
- Search inputs

### ✅ Checkboxes and Radio Buttons

- [ ] Unchecked boxes have visible borders
- [ ] Checked boxes show system checkmark
- [ ] Radio buttons follow same pattern
- [ ] Labels are readable and associated
- [ ] Disabled state shows grayed

**Test locations:**
- Settings panels
- Filter controls
- Terms acceptance checkboxes

### ✅ Selects and Dropdowns

- [ ] Dropdown trigger has visible border
- [ ] Dropdown arrow/icon is visible
- [ ] Dropdown menu has visible border
- [ ] Selected option is highlighted
- [ ] Hover state is distinguishable
- [ ] Disabled state shows grayed

**Test locations:**
- Network selector
- Token pair selects
- Any combo boxes

### ✅ Tabs

- [ ] All tabs have visible borders or separators
- [ ] Active tab is clearly distinguished (underline or highlight)
- [ ] Inactive tabs remain readable
- [ ] Hover state shows visual change
- [ ] Focus indicator is visible

**Test locations:**
- `/trade` - Order tabs (Limit, Market)
- Settings tabs (if applicable)

### ✅ Dialogs and Modals

- [ ] Dialog has visible border
- [ ] Dialog content is readable
- [ ] Close button is visible and operable
- [ ] Backdrop (if visible) does not obscure dialog
- [ ] Dialog title stands out

**Test locations:**
- Connect wallet modal
- Confirmation dialogs
- Settings dialogs

### ✅ Alerts and Notifications

- [ ] Alert container has visible border
- [ ] Alert text is readable
- [ ] Alert icon is visible (uses currentColor)
- [ ] Severity is distinguishable by border/structure, not just color
- [ ] Dismiss button (if present) is visible

**Test locations:**
- Error messages after failed transactions
- Success toasts
- Warning banners

### ✅ Menus

- [ ] Menu container has visible border
- [ ] Menu items are readable
- [ ] Hover/focus highlights menu item
- [ ] Selected menu item (if applicable) is distinguished
- [ ] Separators between menu sections are visible
- [ ] Disabled menu items show grayed text

**Test locations:**
- User dropdown menu
- Context menus
- Navigation dropdown (if applicable)

### ✅ Tables and Data Grids

- [ ] Table borders are visible
- [ ] Header row is distinguishable
- [ ] Cell borders or separators are visible
- [ ] Row hover shows highlight
- [ ] Selected row is distinguished
- [ ] Sortable column headers show affordance

**Test locations:**
- `/pools` - Liquidity table
- Order history tables
- Position tables

### ✅ Icons and SVGs

- [ ] All icons remain visible (use currentColor fill/stroke)
- [ ] Status icons are distinguishable by shape, not just color
- [ ] Icon buttons maintain icon visibility
- [ ] Loading spinners remain visible

**Test locations:**
- Navigation icons
- Status indicators (success, error, pending)
- Social media icons

### ✅ Focus Indicators

- [ ] All interactive elements show focus outline
- [ ] Focus outline uses system Highlight color
- [ ] Focus outline has 2px width minimum
- [ ] Focus outline does not disappear against any background
- [ ] Tab order makes sense

**Test:**
- Tab through every page
- Verify focus is always visible

### ✅ Trading-Specific States

- [ ] Long/Short/Liquidation states remain distinguishable
- [ ] Price up/down indicators use shape or text, not just color
- [ ] Order status (pending, filled, cancelled) is clear
- [ ] Chart elements remain visible (if forced-colors affects charts, consider canvas-based alternative)

**Test locations:**
- `/trade` - Order book, recent trades
- Price change indicators
- Position PnL

### ✅ Separators and Dividers

- [ ] Horizontal rules (`<hr>`) are visible
- [ ] Section dividers are visible
- [ ] Card borders are visible
- [ ] `Separator` subtle/default/strong tones are all still visible (all three
      collapse to `CanvasText` — that is expected; the *presence* of the line is
      what matters, not the tone)
- [ ] `Divider` labels remain readable against `Canvas`

**Test locations:**
- Between major sections
- Within complex forms

### ✅ Scroll Areas (DS-079)

The gradient edge affordances are dropped in forced-colors mode (background
images are removed), so the scrollbar itself has to carry the "there is more
content" signal.

- [ ] Scrollbars are visible on every `ScrollArea` that overflows
- [ ] Scrollbar thumb (`CanvasText`) is distinguishable from its track (`Canvas`)
- [ ] Scroll position is still discoverable without the edge shadows
- [ ] Keyboard scrolling (arrows, Page Up/Down) still works on focusable areas

**Test locations:**
- Command menu (`Cmd/Ctrl+K`) — long, filtered result list
- `/trade` — bottom tabs and trade panel
- Any horizontally overflowing tab row
- Card components

## Additional Checks

### No Reliance on Background Images

- [ ] No critical information is conveyed via background-image
- [ ] Decorative gradients do not break layout
- [ ] CSS gradients used for borders have solid fallbacks

### System Colors Used Correctly

- [ ] No hardcoded colors in forced-colors overrides
- [ ] Use ButtonText, CanvasText, LinkText, etc. instead of #000 or #fff
- [ ] `forced-color-adjust: none` is only used where necessary (hover, focus states)

### Documentation

- [ ] All forced-colors overrides are documented in `globals.css`
- [ ] This checklist is up to date
- [ ] Team is aware of forced-colors testing requirement

## Testing Workflow

1. Enable forced-colors mode (see Setup above)
2. Visit each major page: `/`, `/trade`, `/pools`, `/earn`, `/referrals`, `/faucet`
3. Test all interactive elements on each page
4. Use keyboard navigation (Tab, Enter, Space, Arrows)
5. Check both light and dark forced-colors themes if your OS offers them
6. Document any issues found
7. Re-test after fixes

## Known Limitations

- **Charts:** Canvas-based charts (e.g., TradingView) may not fully support forced-colors. Ensure fallback controls remain operable.
- **Third-party widgets:** Wallet connectors and external embeds may not support forced-colors. Document these as known limitations.
- **Browser differences:** Edge has the best support. Firefox and Chrome may differ slightly.

## Resources

- [CSS Color Adjustment Module](https://drafts.csswg.org/css-color-adjust-1/#forced)
- [Windows High Contrast Mode](https://docs.microsoft.com/en-us/fluent-ui/web-components/design-system/high-contrast)
- [MDN: forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)

## Issue Reporting

When reporting forced-colors issues, include:
- OS and version (e.g., Windows 11 22H2)
- Browser and version
- High contrast theme in use (e.g., "High Contrast Black")
- Screenshot showing the problem
- Steps to reproduce
