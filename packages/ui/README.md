# @workspace/ui

A shared React component library with accessible UI primitives built with Tailwind CSS and Base UI.

## Components

All components are located in `src/components/` and exported through the package's export map in `package.json`.

- **Button** - Versatile button component with multiple variants and sizes
- **Input** - Text input field with support for invalid states
- **Badge** - Label component for categorization
- **Dialog** - Modal dialog for focused user interactions
- **Tabs** - Tabbed interface for content organization
- **Tabs** - Tabbed interface with keyboard navigation support
- **Slider** - Range input slider component
- **Tooltip** - Contextual information on hover
- **Sheet** - Side panel component
- **Skeleton** - Content placeholder loaders
- **Separator / Divider** - Rules in `subtle`/`default`/`strong` tones, semantic or decorative, plus a labelled divider (see [DESIGN.md](../../DESIGN.md#separators-and-dividers) for when *not* to use one)
- **ScrollArea** - Native overflow container with scroll-position edge shadows and themed scrollbars
- **VisuallyHidden / LiveRegion** - Screen-reader-only content and polite/assertive announcements ([ACCESSIBILITY_PRIMITIVES.md](./ACCESSIBILITY_PRIMITIVES.md))
- **SkipLink** - Keyboard bypass for global chrome; wired into `AppShell`'s `<main>` target
- **TokenAvatar** - Token icon with fallback initials
- **TokenPair** - Overlapping token pair visual
- **TransactionStatus** - Transaction state indicator with actions
- **Text / Heading** - Shared type scale and tones; use instead of one-off font sizes
- **NumericText** - Tabular figures with semantic roles (`positive`, `negative`, `warning`, `accent`, `muted`)
- **Stat** - Label + numeric value pair with a built-in loading state
- **Card** - Surface primitive (`default`, `muted`, `dashed`, `plain`) with header/content/footer slots
- **Table** - Data-table primitives that scroll horizontally instead of widening the page
- **Alert** - Status messaging (`info`, `success`, `warning`, `danger`, `muted`) with the right ARIA role
- **LoadingState / EmptyState / ErrorState** - Shared list and table state treatments
- **Spinner** - Busy indicator, hidden from assistive tech unless labelled
- **LoadingButton** - Button that owns its pending state, spinner and `aria-busy`

## Semantic tokens

`src/styles/globals.css` defines the semantic colour roles every component draws
from: `--success`, `--warning`, `--info`, `--destructive`, plus the trading
aliases `--long` / `--short` and the `--chart-*` roles the trading chart reads
through its typed adapter. Prefer these over palette classes such as
`text-green-400` so light and dark themes stay in sync.

## Testing

All interactive components include accessibility tests using `vitest-axe` to ensure WCAG compliance.

### Running tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# View test results in UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test coverage

Every interactive primitive has automated accessibility checks that:
- Verify no critical or serious axe violations
- Test keyboard navigation for interactive components
- Validate ARIA attributes and roles
- Check focus management

## Development

```bash
# Format code
npm run format

# Type check
npm run typecheck

# Lint code
npm run lint
```

## Usage

Import components from the package:

```tsx
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { TokenAvatar } from "@workspace/ui/components/token-avatar"
```
