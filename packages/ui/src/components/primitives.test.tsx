import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { axe } from "vitest-axe"
import { Alert, AlertDescription, AlertTitle } from "./alert"
import { Card, CardContent, CardHeader } from "./card"
import { LoadingButton } from "./loading-button"
import { NumericText, numericRoleForValue } from "./numeric"
import { Spinner } from "./spinner"
import { Stat } from "./stat"
import { EmptyState, ErrorState, LoadingState } from "./states"
import {
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeadRow,
  TableHeader,
  TableRow,
} from "./table"
import { Heading, Text } from "./text"

describe("Text", () => {
  it("renders a paragraph by default", () => {
    render(<Text>Body copy</Text>)
    expect(screen.getByText("Body copy").tagName).toBe("P")
  })

  it("applies the tone class", () => {
    render(<Text tone="muted">Muted</Text>)
    expect(screen.getByText("Muted")).toHaveClass("text-muted-foreground")
  })

  it("renders as another element via the render prop", () => {
    render(<Text render={<span />}>Inline</Text>)
    expect(screen.getByText("Inline").tagName).toBe("SPAN")
  })

  it("has no accessibility violations", async () => {
    const { container } = render(<Text>Accessible copy</Text>)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe("Heading", () => {
  it("maps level to the matching heading tag", () => {
    render(<Heading level={1}>Page title</Heading>)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Page title"
    )
  })

  it("defaults to level 2", () => {
    render(<Heading>Section</Heading>)
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument()
  })

  it("has no accessibility violations", async () => {
    const { container } = render(<Heading level={2}>Section</Heading>)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe("NumericText", () => {
  it("always uses tabular figures so columns align", () => {
    render(<NumericText>1,234.00</NumericText>)
    expect(screen.getByText("1,234.00")).toHaveClass("tabular-nums")
  })

  it.each([
    ["positive", "text-success"],
    ["negative", "text-destructive"],
    ["warning", "text-warning"],
    ["accent", "text-primary"],
    ["muted", "text-muted-foreground"],
  ] as const)("maps the %s role onto a semantic token", (role, expected) => {
    render(<NumericText role={role}>42</NumericText>)
    expect(screen.getByText("42")).toHaveClass(expected)
  })

  it("derives a role from a signed value", () => {
    expect(numericRoleForValue(1)).toBe("positive")
    expect(numericRoleForValue(-1)).toBe("negative")
    expect(numericRoleForValue(0)).toBe("neutral")
  })
})

describe("Stat", () => {
  it("renders label and value", () => {
    render(<Stat label="Total earned" value="$12.00" />)
    expect(screen.getByText("Total earned")).toBeInTheDocument()
    expect(screen.getByText("$12.00")).toBeInTheDocument()
  })

  it("swaps the value for a skeleton while loading", () => {
    const { container } = render(
      <Stat label="Total earned" value="$12.00" isLoading />
    )
    expect(screen.queryByText("$12.00")).not.toBeInTheDocument()
    expect(
      container.querySelector("[data-slot='skeleton']")
    ).toBeInTheDocument()
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Stat label="Balance" value="$0.00" role="positive" />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe("LoadingButton", () => {
  it("keeps its accessible name while idle", () => {
    render(<LoadingButton>Claim</LoadingButton>)
    expect(screen.getByRole("button", { name: "Claim" })).toBeEnabled()
  })

  it("disables itself and swaps in the loading label", () => {
    render(
      <LoadingButton isLoading loadingText="Claiming">
        Claim
      </LoadingButton>
    )
    const button = screen.getByRole("button", { name: "Claiming" })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("aria-busy", "true")
  })

  it("falls back to the children when no loadingText is given", () => {
    render(<LoadingButton isLoading>Claim</LoadingButton>)
    expect(screen.getByRole("button", { name: "Claim" })).toBeDisabled()
  })

  it("does not fire onClick while loading", async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <LoadingButton isLoading loadingText="Claiming" onClick={onClick}>
        Claim
      </LoadingButton>
    )
    await user.click(screen.getByRole("button", { name: "Claiming" }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it("has no accessibility violations in either state", async () => {
    const idle = render(<LoadingButton>Claim</LoadingButton>)
    expect(await axe(idle.container)).toHaveNoViolations()

    const loading = render(
      <LoadingButton isLoading loadingText="Claiming">
        Claim
      </LoadingButton>
    )
    expect(await axe(loading.container)).toHaveNoViolations()
  })
})

describe("Spinner", () => {
  it("is hidden from assistive tech by default", () => {
    const { container } = render(<Spinner />)
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true")
  })

  it("announces itself when given a label", () => {
    render(<Spinner label="Loading prices" />)
    expect(
      screen.getByRole("status", { name: "Loading prices" })
    ).toBeInTheDocument()
  })
})

describe("Alert", () => {
  it("uses role=status for non-destructive variants", () => {
    render(
      <Alert variant="warning">
        <AlertDescription>Switch networks</AlertDescription>
      </Alert>
    )
    expect(screen.getByRole("status")).toHaveTextContent("Switch networks")
  })

  it("escalates to role=alert for the danger variant", () => {
    render(
      <Alert variant="danger">
        <AlertTitle>Failed</AlertTitle>
      </Alert>
    )
    expect(screen.getByRole("alert")).toHaveTextContent("Failed")
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Alert variant="info">
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Rewards are accruing.</AlertDescription>
      </Alert>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe("state primitives", () => {
  it("LoadingState announces itself and renders the requested rows", () => {
    const { container } = render(
      <LoadingState rows={3} label="Loading assets" />
    )
    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(screen.getByText("Loading assets")).toBeInTheDocument()
    expect(container.querySelectorAll("[data-slot='skeleton']")).toHaveLength(3)
  })

  it("EmptyState renders title, description and action", () => {
    render(
      <EmptyState
        title="No deposits"
        description="Start earning by depositing"
        action={<button type="button">Browse pools</button>}
      />
    )
    expect(screen.getByText("No deposits")).toBeInTheDocument()
    expect(screen.getByText("Start earning by depositing")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Browse pools" })
    ).toBeInTheDocument()
  })

  it("ErrorState exposes an alert and an optional retry", async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<ErrorState description="Network unreachable" onRetry={onRetry} />)

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong")
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it("has no accessibility violations", async () => {
    const empty = render(<EmptyState title="Nothing here" description="Yet" />)
    expect(await axe(empty.container)).toHaveNoViolations()

    const error = render(<ErrorState description="Boom" onRetry={() => {}} />)
    expect(await axe(error.container)).toHaveNoViolations()
  })
})

describe("Card", () => {
  it("renders header and content", () => {
    render(
      <Card>
        <CardHeader>
          <Heading level={3}>My assets</Heading>
        </CardHeader>
        <CardContent>Body</CardContent>
      </Card>
    )
    expect(
      screen.getByRole("heading", { name: "My assets" })
    ).toBeInTheDocument()
    expect(screen.getByText("Body")).toBeInTheDocument()
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Card variant="subtle" padding="default">
        <Text>Card body</Text>
      </Card>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe("Table", () => {
  function ExampleTable({ empty = false }: { empty?: boolean }) {
    return (
      <Table>
        <TableHeader>
          <TableHeadRow>
            <TableHead>Epoch</TableHead>
            <TableHead align="right">Amount</TableHead>
          </TableHeadRow>
        </TableHeader>
        <TableBody>
          {empty ? (
            <TableEmptyRow colSpan={2}>
              <EmptyState title="No distributions yet" />
            </TableEmptyRow>
          ) : (
            <TableRow>
              <TableCell>W-12</TableCell>
              <TableCell align="right">
                <NumericText>$125.50</NumericText>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    )
  }

  it("renders column headers and cells", () => {
    render(<ExampleTable />)
    expect(
      screen.getByRole("columnheader", { name: "Epoch" })
    ).toBeInTheDocument()
    expect(screen.getByRole("cell", { name: "W-12" })).toBeInTheDocument()
  })

  it("hosts an empty state spanning every column", () => {
    render(<ExampleTable empty />)
    const cell = screen.getByRole("cell")
    expect(cell).toHaveAttribute("colspan", "2")
    expect(screen.getByText("No distributions yet")).toBeInTheDocument()
  })

  it("scrolls horizontally instead of widening the page", () => {
    const { container } = render(<ExampleTable />)
    expect(
      container.querySelector('[data-slot="table-container"]')
    ).toHaveClass("overflow-x-auto")
  })

  it("has no accessibility violations", async () => {
    const { container } = render(<ExampleTable />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
