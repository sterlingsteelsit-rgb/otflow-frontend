import {
  Snowflake,
  Gift,
  Sparkles,
  Flower2,
  Sun,
  Heart,
  Star,
  Leaf,
  Egg,
  Flame,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SeasonalKey =
  | "new-year"
  | "valentine"
  | "easter"
  | "sinhala-tamil-new-year"
  | "vesak"
  | "christmas"
  | "default";

export type SeasonalConfig = {
  key: SeasonalKey;
  label: string;
  from: string; // MM-DD
  to: string; // MM-DD
  icons: LucideIcon[];
  density?: number;
  size?: [number, number];
  speed?: [number, number];
};

export const SEASONAL_CONFIGS: SeasonalConfig[] = [
  {
    key: "new-year",
    label: "New Year",
    from: "12-28",
    to: "01-05",
    icons: [Sparkles, Star],
    density: 18,
    size: [14, 28],
    speed: [8, 16],
  },
  {
    key: "valentine",
    label: "Valentine",
    from: "02-10",
    to: "02-16",
    icons: [Heart, Sparkles],
    density: 16,
    size: [14, 24],
    speed: [9, 16],
  },
  {
    key: "easter",
    label: "Easter",
    from: "03-25",
    to: "04-10",
    icons: [Egg, Sparkles],
    density: 16,
    size: [14, 24],
    speed: [8, 14],
  },
  {
    key: "sinhala-tamil-new-year",
    label: "Sinhala & Tamil New Year",
    from: "04-10",
    to: "04-18",
    icons: [Sun, Sparkles, Flower2],
    density: 22,
    size: [16, 30],
    speed: [7, 13],
  },
  {
    key: "vesak",
    label: "Vesak",
    from: "05-20",
    to: "05-31",
    icons: [Flame, Star, Sparkles],
    density: 20,
    size: [14, 26],
    speed: [8, 14],
  },
  {
    key: "christmas",
    label: "Christmas",
    from: "12-01",
    to: "12-26",
    icons: [Snowflake, Gift, Star],
    density: 24,
    size: [14, 28],
    speed: [8, 15],
  },
];

export const DEFAULT_SEASON: SeasonalConfig = {
  key: "default",
  label: "Default",
  from: "01-01",
  to: "12-31",
  icons: [Leaf, Sparkles],
  density: 10,
  size: [12, 20],
  speed: [10, 18],
};
