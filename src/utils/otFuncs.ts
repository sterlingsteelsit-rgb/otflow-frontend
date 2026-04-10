import type { CreateRow } from "./otTypes";

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
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function makeCreateRow(): CreateRow {
  return {
    id: crypto.randomUUID(),
    employeeId: "",
    shift: "Shift 1",
    inTime: "",
    outTime: "",
    reason: "",

    manualOverride: false,
    normalHours: "0",
    doubleHours: "0",
    tripleHours: "0",
    isNight: false,
  };
}
