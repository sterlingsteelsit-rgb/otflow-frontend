type DayType = "WEEKDAY" | "SATURDAY" | "SUNDAY";

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
export function minutesDiff(start: number, end: number) {
  if (end < start) return end + 24 * 60 - start;
  return end - start;
}
export function dayTypeFromDate(dateYYYYMMDD: string): DayType {
  const d = new Date(dateYYYYMMDD + "T00:00:00Z");
  const day = d.getUTCDay();
  if (day === 0) return "SUNDAY";
  if (day === 6) return "SATURDAY";
  return "WEEKDAY";
}
export function shiftType(
  shift: string,
): "SHIFT_0630" | "SHIFT_0830" | "OTHER" {
  const s = shift.toLowerCase().trim();
  if (s === "shift 1" || s.includes("6:30") || s.includes("0630"))
    return "SHIFT_0630";
  if (s === "shift 2" || s.includes("8:30") || s.includes("0830"))
    return "SHIFT_0830";
  return "OTHER";
}
export function floorTo15(mins: number) {
  return Math.floor(mins / 15) * 15;
}

export function calcOtMinutesUI(params: {
  workDate: string;
  shift: string;
  inTime: string;
  outTime: string;
  isTripleDay: boolean;
}) {
  if (!params.inTime || !params.outTime) {
    return {
      normalMinutes: 0,
      doubleMinutes: 0,
      tripleMinutes: 0,
      isNight: false,
    };
  }

  const inMin = toMinutes(params.inTime);
  const outMin = toMinutes(params.outTime);
  const outAdjusted = outMin < inMin ? outMin + 24 * 60 : outMin;

  const NIGHT_START = 21 * 60;
  const isNight = outAdjusted > NIGHT_START;

  const rawWorked = minutesDiff(inMin, outMin);

  if (params.isTripleDay) {
    const triple = floorTo15(rawWorked);
    return {
      normalMinutes: 0,
      doubleMinutes: 0,
      tripleMinutes: triple,
      isNight,
    };
  }

  const dayType = dayTypeFromDate(params.workDate);

  if (dayType === "SUNDAY") {
    const dbl = floorTo15(rawWorked);
    return { normalMinutes: 0, doubleMinutes: dbl, tripleMinutes: 0, isNight };
  }

  const st = shiftType(params.shift);
  let otStart: number;

  if (dayType === "SATURDAY") {
    otStart = st === "SHIFT_0630" ? toMinutes("11:30") : toMinutes("13:30");
  } else {
    otStart = st === "SHIFT_0630" ? toMinutes("15:30") : toMinutes("17:30");
  }

  const start = Math.max(inMin, otStart);
  const rawOt = Math.max(0, outAdjusted - start);
  const normalOt = floorTo15(rawOt);

  return {
    normalMinutes: normalOt,
    doubleMinutes: 0,
    tripleMinutes: 0,
    isNight,
  };
}

export function minsToHours(mins: number) {
  const h = Math.round((mins / 60) * 100) / 100;
  return String(h).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
}
