import type { DayStats } from "../types/dashboard.types";

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toYYYYMMDD(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfWeekMonday(today: Date) {
  const d = new Date(today);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function sumWeek(items: DayStats[]) {
  return items.reduce(
    (acc, it) => {
      acc.total += it.total || 0;
      acc.pending += it.pending || 0;
      acc.approved += it.approved || 0;
      acc.rejected += it.rejected || 0;
      acc.hours.normal += it.hours?.normal || 0;
      acc.hours.double += it.hours?.double || 0;
      acc.hours.triple += it.hours?.triple || 0;
      return acc;
    },
    {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      hours: { normal: 0, double: 0, triple: 0 },
    },
  );
}
