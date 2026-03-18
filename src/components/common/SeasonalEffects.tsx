/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { getCurrentSeasonalConfig } from "../../utils/seasonal";

type Particle = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  drift: number;
  rotate: number;
  opacity: number;
  iconIndex: number;
};

type SeasonalEffectsProps = {
  enabled?: boolean;
  count?: number;
  className?: string;
};

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function SeasonalEffects({
  enabled = true,
  count,
  className = "",
}: SeasonalEffectsProps) {
  const season = useMemo(() => getCurrentSeasonalConfig(), []);
  const [items, setItems] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      return;
    }

    const density = count ?? season.density ?? 16;
    const [minSize, maxSize] = season.size ?? [14, 24];
    const [minSpeed, maxSpeed] = season.speed ?? [8, 16];

    const nextItems: Particle[] = Array.from({ length: density }, (_, i) => ({
      id: i,
      left: randomBetween(0, 100),
      delay: randomBetween(0, 10),
      duration: randomBetween(minSpeed, maxSpeed),
      size: randomBetween(minSize, maxSize),
      drift: randomBetween(-80, 80),
      rotate: randomBetween(-180, 180),
      opacity: randomBetween(0.35, 0.85),
      iconIndex: Math.floor(Math.random() * season.icons.length),
    }));

    setItems(nextItems);
  }, [enabled, count, season]);

  if (!enabled || !mounted || items.length === 0) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[60] overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <style>
        {`
          @keyframes seasonal-fall {
            0% {
              transform: translate3d(0, -10vh, 0) rotate(0deg);
            }
            100% {
              transform: translate3d(var(--drift), 110vh, 0) rotate(var(--rotate));
            }
          }
        `}
      </style>

      {items.map((item) => {
        const Icon = season.icons[item.iconIndex];

        return (
          <div
            key={item.id}
            className="absolute -top-10 will-change-transform"
            style={{
              left: `${item.left}%`,
              opacity: item.opacity,
              animationName: "seasonal-fall",
              animationDuration: `${item.duration}s`,
              animationDelay: `${item.delay}s`,
              animationIterationCount: "infinite",
              animationTimingFunction: "linear",
              ["--drift" as string]: `${item.drift}px`,
              ["--rotate" as string]: `${item.rotate}deg`,
            }}
          >
            <Icon
              style={{
                width: `${item.size}px`,
                height: `${item.size}px`,
              }}
              className="text-amber-400 drop-shadow-sm"
            />
          </div>
        );
      })}
    </div>
  );
}
