import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/useDebounce";

describe("useDebounce", () => {
  jest.useFakeTimers();

  it("debounces value changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 200),
      { initialProps: { value: "a" } }
    );

    expect(result.current).toBe("a");
    rerender({ value: "ab" });
    rerender({ value: "abc" });
    expect(result.current).toBe("a");

    act(() => { jest.advanceTimersByTime(200); });
    expect(result.current).toBe("abc");
  });
});
