import React from "react";
import { render, screen } from "@testing-library/react";
import { LoadingState } from "@/components/ui/LoadingState";

describe("LoadingState", () => {
  it("renders default loading message", () => {
    render(<LoadingState />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders custom message", () => {
    render(<LoadingState message="Fetching data..." />);
    expect(screen.getByText("Fetching data...")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<LoadingState className="my-custom-class" />);
    const container = screen.getByText("Loading...").parentElement;
    expect(container?.className).toContain("my-custom-class");
  });
});
