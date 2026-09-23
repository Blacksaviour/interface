import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { LoadingButton } from "@workspace/ui/components/loading-button"
import { NumericText } from "@workspace/ui/components/numeric"
import { Stat } from "@workspace/ui/components/stat"
import { EmptyState, ErrorState, LoadingState } from "@workspace/ui/components/states"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadRow,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Heading, Text } from "@workspace/ui/components/text"
import { Separator } from "@workspace/ui/components/separator"
import { useTheme } from "@/ui/theme-provider"

function ComponentSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section id={title.toLowerCase().replace(/\s+/g, "-")} className="scroll-mt-16 space-y-4 py-8">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-4 rounded-lg border border-border p-6">{children}</div>
    </section>
  )
}

function ButtonExamples() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Variants</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Sizes</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="xs">XS</Button>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">🎨</Button>
          <Button size="icon-xs">🎨</Button>
          <Button size="icon-sm">🎨</Button>
          <Button size="icon-lg">🎨</Button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">States</h3>
        <div className="flex flex-wrap gap-2">
          <Button>Normal</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>
    </div>
  )
}

function InputExamples() {
  const [value, setValue] = useState("")

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Default</label>
        <Input placeholder="Enter text..." />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">With value</label>
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type here..." />
        {value && <p className="mt-1 text-xs text-muted-foreground">You typed: {value}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Disabled</label>
        <Input placeholder="Disabled input" disabled />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Invalid</label>
        <Input placeholder="Invalid input" aria-invalid="true" />
      </div>
    </div>
  )
}

function BadgeExamples() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Variants</h3>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">With Icon</h3>
        <div className="flex flex-wrap gap-2">
          <Badge>
            ✓ Success
          </Badge>
          <Badge variant="destructive">
            ✕ Error
          </Badge>
          <Badge variant="secondary">
            ⓘ Info
          </Badge>
        </div>
      </div>
    </div>
  )
}

function SkeletonExamples() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Text Skeleton</h3>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Avatar Skeleton</h3>
        <div className="flex gap-2">
          <Skeleton className="size-12 rounded-full" />
          <Skeleton className="size-12 rounded-full" />
          <Skeleton className="size-12 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function DialogExamples() {
  return (
    <div>
      <Dialog>
        <DialogTrigger render={<Button>Open Dialog</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Example Dialog</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This is a dialog component example.</p>
          <div className="flex gap-2 pt-4">
            <Button variant="outline">Cancel</Button>
            <Button>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TabsExamples() {
  return (
    <Tabs defaultValue="tab1" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="mt-4">
        <p className="text-sm">Content for Tab 1</p>
      </TabsContent>
      <TabsContent value="tab2" className="mt-4">
        <p className="text-sm">Content for Tab 2</p>
      </TabsContent>
      <TabsContent value="tab3" className="mt-4">
        <p className="text-sm">Content for Tab 3</p>
      </TabsContent>
    </Tabs>
  )
}

function TypographyExamples() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="mb-3 text-sm font-semibold">Headings</h3>
        <Heading level={1}>Level 1 — page title</Heading>
        <Heading level={2}>Level 2 — section</Heading>
        <Heading level={3}>Level 3 — card title</Heading>
        <Heading level={4}>Level 4 — table caption</Heading>
      </div>

      <div className="space-y-1">
        <h3 className="mb-3 text-sm font-semibold">Body sizes</h3>
        {(["2xs", "xs", "sm", "md", "base", "lg"] as const).map((size) => (
          <Text key={size} size={size}>
            {size} — the quick brown fox jumps over the lazy dog
          </Text>
        ))}
      </div>

      <div className="space-y-1">
        <h3 className="mb-3 text-sm font-semibold">Tones</h3>
        {(["default", "muted", "subtle", "primary", "success", "warning", "info", "danger"] as const).map(
          (tone) => (
            <Text key={tone} tone={tone}>
              {tone}
            </Text>
          ),
        )}
      </div>
    </div>
  )
}

function NumericExamples() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Semantic roles</h3>
        <div className="flex flex-wrap gap-6">
          <NumericText role="neutral">$12,450.00</NumericText>
          <NumericText role="muted">$12,450.00</NumericText>
          <NumericText role="positive">+18.42%</NumericText>
          <NumericText role="negative">-4.10%</NumericText>
          <NumericText role="warning">$1.02</NumericText>
          <NumericText role="accent">15%</NumericText>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Stats</h3>
        <div className="flex flex-wrap gap-8">
          <Stat label="Total investment value" value="$104,220.00" />
          <Stat label="Total pending rewards" value="$412.90" role="positive" />
          <Stat label="Loading" value="—" isLoading />
        </div>
      </div>
    </div>
  )
}

function SurfaceExamples() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card padding="default">
        <Text size="sm" tone="muted">
          Card — default surface
        </Text>
      </Card>
      <Card variant="subtle" padding="default">
        <Text size="sm" tone="muted">
          Card — muted surface
        </Text>
      </Card>
      <Card variant="dashed" padding="default">
        <Text size="sm" tone="muted">
          Card — dashed placeholder
        </Text>
      </Card>
      <Card variant="plain">
        <CardHeader>
          <Heading level={3}>Card — plain frame</Heading>
        </CardHeader>
        <CardContent>
          <Text size="sm" tone="muted">
            Used when the body is a table.
          </Text>
        </CardContent>
      </Card>
    </div>
  )
}

function TableExamples() {
  return (
    <Card variant="plain">
      <CardHeader>
        <Heading level={3}>Distribution history</Heading>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableHeadRow>
            <TableHead>Epoch</TableHead>
            <TableHead>Token</TableHead>
            <TableHead align="right">Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableHeadRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <NumericText role="muted">W-12</NumericText>
            </TableCell>
            <TableCell>
              <NumericText>USDC</NumericText>
            </TableCell>
            <TableCell align="right">
              <NumericText>$125.50</NumericText>
            </TableCell>
            <TableCell>
              <Badge variant="success">Distributed</Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <NumericText role="muted">W-13</NumericText>
            </TableCell>
            <TableCell>
              <NumericText>esSO4</NumericText>
            </TableCell>
            <TableCell align="right">
              <NumericText>$0.00</NumericText>
            </TableCell>
            <TableCell>
              <Badge variant="muted">Upcoming</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  )
}

function AlertExamples() {
  return (
    <div className="space-y-3">
      {(["info", "success", "warning", "danger", "muted"] as const).map((variant) => (
        <Alert key={variant} variant={variant}>
          <div>
            <AlertTitle>{variant}</AlertTitle>
            <AlertDescription>
              Shared alert surface — colours come from semantic tokens.
            </AlertDescription>
          </div>
        </Alert>
      ))}
    </div>
  )
}

function StateExamples() {
  return (
    <div className="space-y-4">
      <Card variant="plain">
        <LoadingState rows={2} label="Loading positions" />
      </Card>
      <Card variant="plain">
        <EmptyState
          title="You have no deposits"
          description="Start earning by depositing into a pool"
          action={
            <Button variant="outline" size="sm">
              Browse pools
            </Button>
          }
        />
      </Card>
      <Card variant="plain">
        <ErrorState description="We could not reach the RPC node." onRetry={() => {}} />
      </Card>
    </div>
  )
}

function LoadingButtonExamples() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <LoadingButton>Claim</LoadingButton>
      <LoadingButton isLoading loadingText="Claiming">
        Claim
      </LoadingButton>
      <LoadingButton
        variant="outline"
        isLoading={loading}
        loadingText="Working…"
        onClick={() => {
          setLoading(true)
          setTimeout(() => setLoading(false), 1500)
        }}
      >
        Try it
      </LoadingButton>
    </div>
  )
}

export function DesignSystemPage() {
  const { theme, setTheme } = useTheme()
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">("desktop")

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Design System Gallery</h1>
              <p className="text-sm text-muted-foreground">
                Development-only gallery showing all components and tokens
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
                className="rounded border border-border bg-background px-2 py-1 text-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
              <select
                value={viewport}
                onChange={(e) => setViewport(e.target.value as "mobile" | "tablet" | "desktop")}
                className="rounded border border-border bg-background px-2 py-1 text-sm"
              >
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
                <option value="desktop">Desktop</option>
              </select>
            </div>
          </div>

          <nav className="mt-4 flex gap-4 overflow-x-auto pb-2 text-sm font-medium">
            <a href="#buttons" className="whitespace-nowrap text-primary hover:underline">
              Buttons
            </a>
            <a href="#inputs" className="whitespace-nowrap text-primary hover:underline">
              Inputs
            </a>
            <a href="#badges" className="whitespace-nowrap text-primary hover:underline">
              Badges
            </a>
            <a href="#tabs" className="whitespace-nowrap text-primary hover:underline">
              Tabs
            </a>
            <a href="#dialogs" className="whitespace-nowrap text-primary hover:underline">
              Dialogs
            </a>
            <a href="#skeletons" className="whitespace-nowrap text-primary hover:underline">
              Skeletons
            </a>
            <a href="#typography" className="whitespace-nowrap text-primary hover:underline">
              Typography
            </a>
            <a href="#numeric" className="whitespace-nowrap text-primary hover:underline">
              Numeric
            </a>
            <a href="#surfaces" className="whitespace-nowrap text-primary hover:underline">
              Surfaces
            </a>
            <a href="#tables" className="whitespace-nowrap text-primary hover:underline">
              Tables
            </a>
            <a href="#alerts" className="whitespace-nowrap text-primary hover:underline">
              Alerts
            </a>
            <a href="#states" className="whitespace-nowrap text-primary hover:underline">
              States
            </a>
            <a href="#loading-buttons" className="whitespace-nowrap text-primary hover:underline">
              Loading buttons
            </a>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <ComponentSection title="Buttons" description="Button component with multiple variants and sizes">
          <ButtonExamples />
        </ComponentSection>

        <Separator />

        <ComponentSection title="Inputs" description="Input field component with various states">
          <InputExamples />
        </ComponentSection>

        <Separator />

        <ComponentSection title="Badges" description="Badge component for labeling and categorization">
          <BadgeExamples />
        </ComponentSection>

        <Separator />

        <ComponentSection title="Tabs" description="Tabbed interface for organizing content">
          <TabsExamples />
        </ComponentSection>

        <Separator />

        <ComponentSection title="Dialogs" description="Dialog component for modal content">
          <DialogExamples />
        </ComponentSection>

        <Separator />

        <ComponentSection title="Skeletons" description="Skeleton loaders for content placeholders">
          <SkeletonExamples />
        </ComponentSection>

        <Separator />

        <ComponentSection
          title="Typography"
          description="Heading and Text — the shared type scale that replaces one-off font sizes"
        >
          <TypographyExamples />
        </ComponentSection>

        <Separator />

        <ComponentSection
          title="Numeric"
          description="NumericText and Stat — tabular figures with semantic roles for financial values"
        >
          <NumericExamples />
        </ComponentSection>

        <Separator />

        <ComponentSection title="Surfaces" description="Card variants used across every feature">
          <SurfaceExamples />
        </ComponentSection>

        <Separator />

        <ComponentSection title="Tables" description="Shared data-table primitives">
          <TableExamples />
        </ComponentSection>

        <Separator />

        <ComponentSection title="Alerts" description="Status messaging built on semantic tokens">
          <AlertExamples />
        </ComponentSection>

        <Separator />

        <ComponentSection
          title="States"
          description="Loading, empty and error treatments shared by every list and table"
        >
          <StateExamples />
        </ComponentSection>

        <Separator />

        <ComponentSection
          title="Loading buttons"
          description="Buttons that own their pending state, spinner and aria-busy"
        >
          <LoadingButtonExamples />
        </ComponentSection>
      </div>
    </div>
  )
}
