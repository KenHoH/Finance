import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    isOpen: true,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
  });

  it("renders title and description", () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        title="Delete item?"
        description="This will be gone forever."
      />
    );
    expect(screen.getByText("Delete item?")).toBeInTheDocument();
    expect(screen.getByText("This will be gone forever.")).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm and onCancel when Confirm is clicked", () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Confirm"));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("uses custom labels when provided", () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Yes, delete"
        cancelLabel="No, keep"
      />
    );
    expect(screen.getByText("Yes, delete")).toBeInTheDocument();
    expect(screen.getByText("No, keep")).toBeInTheDocument();
  });

  it("applies danger variant styling", () => {
    render(<ConfirmDialog {...defaultProps} variant="danger" />);
    const confirmBtn = screen.getByText("Confirm");
    expect(confirmBtn.className).toContain("bg-rose-500");
  });

  it("applies warning variant styling", () => {
    render(<ConfirmDialog {...defaultProps} variant="warning" />);
    const confirmBtn = screen.getByText("Confirm");
    expect(confirmBtn.className).toContain("bg-amber-500");
  });
});
