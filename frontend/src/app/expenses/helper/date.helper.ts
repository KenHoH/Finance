import { formatYyyyMmDd } from "./date-format";

export function getMonthBoundaries(
  thisMonth: boolean,
  date: Date = new Date(),
): {
  startDate: Date;
  endDate: Date;
} {
  const year = date.getFullYear();
  const month = date.getMonth() - (thisMonth ? 1 : -1);

  const startDate = new Date(year, month, 1);

  const endDate = new Date(year, month + 1, 0);

  return { startDate, endDate };
}

export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export function getThisMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    startDate: formatYyyyMmDd(start),
    endDate: formatYyyyMmDd(end),
  };
}

export function getLastMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const end = new Date(date.getFullYear(), date.getMonth(), 0);

  return {
    startDate: formatYyyyMmDd(start),
    endDate: formatYyyyMmDd(end),
  };
}

export function getThisYearRange(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear(), 11, 31);

  return {
    startDate: formatYyyyMmDd(start),
    endDate: formatYyyyMmDd(end),
  };
}

export function getLastYearRange(date: Date) {
  const start = new Date(date.getFullYear() - 1, 0, 1);
  const end = new Date(date.getFullYear() - 1, 11, 31);

  return {
    startDate: formatYyyyMmDd(start),
    endDate: formatYyyyMmDd(end),
  };
}
