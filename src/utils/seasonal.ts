import {
  DEFAULT_SEASON,
  SEASONAL_CONFIGS,
  type SeasonalConfig,
} from "../config/seasonal-config";

function mmdd(date: Date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

function isInRange(current: string, from: string, to: string) {
  // handles cross-year ranges like 12-28 -> 01-05
  if (from <= to) {
    return current >= from && current <= to;
  }
  return current >= from || current <= to;
}

export function getCurrentSeasonalConfig(date = new Date()): SeasonalConfig {
  const current = mmdd(date);

  for (const config of SEASONAL_CONFIGS) {
    if (isInRange(current, config.from, config.to)) {
      return config;
    }
  }

  return DEFAULT_SEASON;
}
