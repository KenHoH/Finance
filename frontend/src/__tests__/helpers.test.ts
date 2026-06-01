import {
  debounce,
  throttle,
  clamp,
  calculatePercentage,
  truncate,
  slugify,
  deepEqual,
  getInitials,
  getColorFromString,
  groupBy,
  sortByDate,
} from "@/lib/helpers";

describe("helpers", () => {
  jest.useFakeTimers();

  describe("debounce", () => {
    it("delays execution until after wait period", () => {
      const fn = jest.fn();
      const d = debounce(fn, 100);
      d("a");
      expect(fn).not.toHaveBeenCalled();
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith("a");
    });

    it("cancels previous timer on rapid calls", () => {
      const fn = jest.fn();
      const d = debounce(fn, 100);
      d("a");
      d("b");
      d("c");
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith("c");
    });
  });

  describe("throttle", () => {
    it("limits execution to once per interval", () => {
      const fn = jest.fn();
      const t = throttle(fn, 100);
      t();
      t();
      expect(fn).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(100);
      t();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("clamp", () => {
    it("returns value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it("returns min when below range", () => {
      expect(clamp(-2, 0, 10)).toBe(0);
    });

    it("returns max when above range", () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe("calculatePercentage", () => {
    it("returns correct percentage", () => {
      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(25, 100, 1)).toBe(25.0);
    });

    it("returns 0 when total is 0 or negative", () => {
      expect(calculatePercentage(50, 0)).toBe(0);
      expect(calculatePercentage(50, -10)).toBe(0);
    });
  });

  describe("truncate", () => {
    it("truncates strings longer than maxLength", () => {
      expect(truncate("hello world", 5)).toBe("he...");
    });

    it("returns original string when short enough", () => {
      expect(truncate("hi", 5)).toBe("hi");
    });
  });

  describe("slugify", () => {
    it("converts to lowercase kebab-case", () => {
      expect(slugify("Hello World")).toBe("hello-world");
    });

    it("removes special characters", () => {
      expect(slugify("a@b#c")).toBe("abc");
    });

    it("collapses multiple dashes", () => {
      expect(slugify("a--b")).toBe("a-b");
    });
  });

  describe("deepEqual", () => {
    it("returns true for identical objects", () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it("returns false for different values", () => {
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it("returns false for different keys", () => {
      expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
    });

    it("handles nested objects", () => {
      expect(deepEqual({ x: { y: 1 } }, { x: { y: 1 } })).toBe(true);
      expect(deepEqual({ x: { y: 1 } }, { x: { y: 2 } })).toBe(false);
    });
  });

  describe("getInitials", () => {
    it("returns first letters of each word", () => {
      expect(getInitials("John Doe")).toBe("JD");
    });

    it("returns single initial for one word", () => {
      expect(getInitials("Alice")).toBe("A");
    });

    it("limits to 2 characters", () => {
      expect(getInitials("One Two Three")).toBe("OT");
    });
  });

  describe("getColorFromString", () => {
    it("returns consistent color for same input", () => {
      const c1 = getColorFromString("test");
      const c2 = getColorFromString("test");
      expect(c1).toBe(c2);
      expect(c1).toMatch(/^bg-/);
    });

    it("returns different colors for different inputs", () => {
      const c1 = getColorFromString("a");
      const c2 = getColorFromString("b");
      expect(c1).not.toBe(c2);
    });
  });

  describe("groupBy", () => {
    it("groups array items by key", () => {
      const items = [
        { category: "a", amount: 100 },
        { category: "b", amount: 200 },
        { category: "a", amount: 150 },
      ];
      const result = groupBy(items, "category");
      expect(result.a).toHaveLength(2);
      expect(result.b).toHaveLength(1);
      expect(result.a[0].amount).toBe(100);
    });
  });

  describe("sortByDate", () => {
    it("sorts by date descending by default", () => {
      const items = [
        { date: "2024-01-01", name: "a" },
        { date: "2024-03-01", name: "b" },
        { date: "2024-02-01", name: "c" },
      ];
      const result = sortByDate(items, "date");
      expect(result.map((i: { name: string }) => i.name)).toEqual(["b", "c", "a"]);
    });

    it("sorts ascending when specified", () => {
      const items = [
        { date: "2024-03-01", name: "a" },
        { date: "2024-01-01", name: "b" },
      ];
      const result = sortByDate(items, "date", false);
      expect(result.map((i: { name: string }) => i.name)).toEqual(["b", "a"]);
    });
  });
});
