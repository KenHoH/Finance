import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchInput } from "@/components/ui/SearchInput";

describe("SearchInput", () => {
  const defaultProps = {
    value: "",
    onChange: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders with default placeholder", () => {
    render(<SearchInput {...defaultProps} />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(<SearchInput {...defaultProps} placeholder="Find users..." />);
    expect(screen.getByPlaceholderText("Find users...")).toBeInTheDocument();
  });

  it("calls onChange when typing", () => {
    render(<SearchInput {...defaultProps} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "hello" } });
    expect(defaultProps.onChange).toHaveBeenCalledWith("hello");
  });

  it("displays the current value", () => {
    render(<SearchInput {...defaultProps} value="test query" />);
    expect(screen.getByDisplayValue("test query")).toBeInTheDocument();
  });

  it("shows clear button when value is present", () => {
    render(<SearchInput {...defaultProps} value="something" />);
    expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
  });

  it("hides clear button when value is empty", () => {
    render(<SearchInput {...defaultProps} value="" />);
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });

  it("clears value when clear button is clicked", () => {
    render(<SearchInput {...defaultProps} value="something" />);
    fireEvent.click(screen.getByLabelText("Clear search"));
    expect(defaultProps.onChange).toHaveBeenCalledWith("");
  });

  it("shows loading spinner instead of clear when isLoading is true", () => {
    render(<SearchInput {...defaultProps} value="something" isLoading />);
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<SearchInput {...defaultProps} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
