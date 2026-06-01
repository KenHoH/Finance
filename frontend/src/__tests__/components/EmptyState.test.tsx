import React from "react";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/ui/EmptyState";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <EmptyState
        title="No items found"
        description="Try adjusting your filters."
      />
    );
    expect(screen.getByText("Try adjusting your filters.")).toBeInTheDocument();
  });

  it("does not render description when omitted", () => {
    render(<EmptyState title="No items found" />);
    expect(
      screen.queryByText("Try adjusting your filters.")
    ).not.toBeInTheDocument();
  });

  it("renders action children when provided", () => {
    render(
      <EmptyState
        title="No items"
        action={<button>Add new</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Add new" })).toBeInTheDocument();
  });
});
