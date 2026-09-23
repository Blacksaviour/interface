import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { axe } from "vitest-axe"
import { DataTable } from "./data-table"
import type { Column } from "./data-table"

interface TestRow {
  id: string
  name: string
  value: number
}

const columns: Array<Column<TestRow>> = [
  { id: "name", header: "Name", accessor: (r) => r.name },
  { id: "value", header: "Value", accessor: (r) => r.value, align: "right" },
]

const data: Array<TestRow> = [
  { id: "1", name: "Alpha", value: 100 },
  { id: "2", name: "Beta", value: 200 },
]

describe("DataTable", () => {
  it("renders column headers and data rows", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
      />
    )
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Value" })).toBeInTheDocument()
    expect(screen.getByRole("cell", { name: "Alpha" })).toBeInTheDocument()
    expect(screen.getByRole("cell", { name: "100" })).toBeInTheDocument()
  })

  it("applies right alignment to column header and cells", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
      />
    )
    const th = screen.getByRole("columnheader", { name: "Value" })
    const td = screen.getByRole("cell", { name: "100" })
    expect(th).toHaveClass("text-right")
    expect(td).toHaveClass("text-right")
  })

  it("renders skeleton rows while loading", () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={[]}
        isLoading
        keyExtractor={(r) => r.id}
      />
    )
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBe(columns.length * 3)
  })

  it("renders empty state with message", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyMessage="No items found"
        keyExtractor={(r) => r.id}
      />
    )
    expect(screen.getByText("No items found")).toBeInTheDocument()
  })

  it("renders empty state with action", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyMessage="No items"
        emptyAction={<button type="button">Add item</button>}
        keyExtractor={(r) => r.id}
      />
    )
    expect(screen.getByRole("button", { name: "Add item" })).toBeInTheDocument()
  })

  it("highlights selected row", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        selectedRowKey="1"
        keyExtractor={(r) => r.id}
      />
    )
    const cells = screen.getAllByRole("cell")
    const alphaCell = cells.find((c) => c.textContent === "Alpha")!
    const row = alphaCell.closest("tr")
    expect(row).toHaveAttribute("aria-current", "true")
    expect(row).toHaveClass("bg-muted/30")
  })

  it("calls onRowClick when a row is clicked", async () => {
    const onRowClick = vi.fn()
    const user = userEvent.setup()
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        onRowClick={onRowClick}
      />
    )
    await user.click(screen.getByRole("cell", { name: "Alpha" }))
    expect(onRowClick).toHaveBeenCalledWith(data[0])
  })

  it("calls onRowClick when Enter is pressed on a row", async () => {
    const onRowClick = vi.fn()
    const user = userEvent.setup()
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        onRowClick={onRowClick}
      />
    )
    const cell = screen.getByRole("cell", { name: "Alpha" })
    const row = cell.closest("tr")!
    row.focus()
    await user.keyboard("{Enter}")
    expect(onRowClick).toHaveBeenCalledWith(data[0])
  })

  it("wraps the table in an overflow-x-auto container", () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
      />
    )
    const wrapper = container.querySelector('[data-slot="table-container"]')
    expect(wrapper).toHaveClass("overflow-x-auto")
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
