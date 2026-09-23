import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardSkeleton, TableSkeleton, TextSkeleton } from "./index";

describe("Skeleton Loaders", () => {
  it("renders text skeleton with accessible busy state", () => {
    render(<TextSkeleton count={2} />);
    const container = screen.getByLabelText("Loading text");
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute("aria-busy", "true");
  });

  it("renders card skeleton with accessible busy state", () => {
    render(<CardSkeleton count={2} />);
    const container = screen.getByLabelText("Loading cards");
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute("aria-busy", "true");
  });

  it("renders table skeleton with accessible busy state", () => {
    render(<TableSkeleton count={2} />);
    const container = screen.getByLabelText("Loading table");
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute("aria-busy", "true");
  });

  it("does not crash when count is zero", () => {
    const { container: textContainer } = render(<TextSkeleton count={0} />);
    expect(textContainer.firstChild).toBeNull();

    const { container: cardContainer } = render(<CardSkeleton count={0} />);
    expect(cardContainer.firstChild).toBeNull();

    const { container: tableContainer } = render(<TableSkeleton count={0} />);
    expect(tableContainer.firstChild).toBeNull();
  });

  it("handles large count props gracefully without layout crash", () => {
    render(<TextSkeleton count={100} />);
    expect(screen.getByLabelText("Loading text")).toBeInTheDocument();
  });
});
