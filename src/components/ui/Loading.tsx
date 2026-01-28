/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface LoadingProps {
  variant?: "spinner" | "dots";
  size?: "small" | "medium" | "large";
  color?: string;
  className?: string;
  text?: string;
  center?: "none" | "page" | "screen" | "parent";
  backdropColor?: string;
  backdropBlur?: boolean;

  typewriter?: boolean;
  typewriterSpeed?: number; // ms
  repeat?: boolean;
  repeatDelay?: number; // ms
}

type SpinnerProps = { sizePx: number; color: string };
type DotsProps = { dotPx: number; boxPx: number; color: string };

const SPINNER_SIZES: Record<NonNullable<LoadingProps["size"]>, number> = {
  small: 24,
  medium: 40,
  large: 56,
};

const DOT_SIZES: Record<NonNullable<LoadingProps["size"]>, number> = {
  small: 6,
  medium: 8,
  large: 12,
};

const Spinner = React.memo(function Spinner({ sizePx, color }: SpinnerProps) {
  return (
    <motion.div
      className="rounded-full border-4 border-transparent"
      style={{
        width: sizePx,
        height: sizePx,
        borderTopColor: color,
        borderRightColor: color,
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
});

const Dots = React.memo(function Dots({ dotPx, boxPx, color }: DotsProps) {
  return (
    <div
      className="flex items-center justify-center space-x-2"
      style={{ width: boxPx, height: boxPx }}
    >
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="rounded-full"
          style={{ width: dotPx, height: dotPx, backgroundColor: color }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
});

const LoadingText = React.memo(function LoadingText({
  value,
  showCursor,
}: {
  value: string;
  showCursor: boolean;
}) {
  return (
    <div
      className="mt-3 text-sm font-medium text-gray-600"
      style={{ minHeight: "1.25rem" }}
    >
      <span>{value || "\u00A0"}</span>
      <span
        className={showCursor ? "animate-pulse" : ""}
        style={{
          display: "inline-block",
          width: "0.6ch",
          visibility: showCursor ? "visible" : "hidden",
        }}
      >
        |
      </span>
    </div>
  );
});

const Loading: React.FC<LoadingProps> = ({
  variant = "spinner",
  size = "medium",
  color = "#3b82f6",
  className = "",
  text,
  center = "none",
  backdropColor = "rgba(255, 255, 255, 0.8)",
  backdropBlur = true,

  typewriter = false,
  typewriterSpeed = 40,
  repeat = false,
  repeatDelay = 1000,
}) => {
  const reducedMotion = useReducedMotion();

  const [count, setCount] = useState(0);

  const spinnerPx = SPINNER_SIZES[size];
  const dotPx = DOT_SIZES[size];

  useEffect(() => {
    if (!text) {
      setCount(0);
      return;
    }

    if (!typewriter || reducedMotion) {
      setCount(text.length);
      return;
    }

    const speed = Math.max(16, typewriterSpeed);
    const pause = Math.max(0, repeatDelay);

    const typingMs = text.length * speed;
    const cycleMs = repeat ? typingMs + pause : typingMs;

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;

      let nextCount = text.length;

      if (repeat) {
        const t = cycleMs === 0 ? 0 : elapsed % cycleMs;
        if (t <= typingMs) {
          nextCount = Math.min(text.length, Math.floor(t / speed));
        } else {
          nextCount = text.length;
        }
      } else {
        nextCount = Math.min(text.length, Math.floor(elapsed / speed));
      }

      setCount((prev) => (prev === nextCount ? prev : nextCount));

      if (repeat || nextCount < text.length) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [text, typewriter, typewriterSpeed, repeat, repeatDelay, reducedMotion]);

  const typedText = useMemo(() => {
    if (!text) return "";
    return text.slice(0, Math.max(0, Math.min(count, text.length)));
  }, [text, count]);

  const showCursor = useMemo(() => {
    if (!text) return false;
    if (!typewriter || reducedMotion) return false;
    return typedText.length < text.length;
  }, [text, typewriter, reducedMotion, typedText.length]);

  const loaderNode = useMemo(() => {
    if (variant === "dots") {
      return <Dots dotPx={dotPx} boxPx={spinnerPx} color={color} />;
    }
    return <Spinner sizePx={spinnerPx} color={color} />;
  }, [variant, dotPx, spinnerPx, color]);

  const textNode = useMemo(() => {
    if (!text) return null;
    const value = typewriter && !reducedMotion ? typedText : text;
    return <LoadingText value={value} showCursor={showCursor} />;
  }, [text, typewriter, reducedMotion, typedText, showCursor]);

  const content = useMemo(
    () => (
      <div className="flex flex-col items-center justify-center">
        {loaderNode}
        {textNode}
      </div>
    ),
    [loaderNode, textNode],
  );

  if (center === "page") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  if (center === "screen") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          backgroundColor: backdropColor,
          backdropFilter: backdropBlur ? "blur(4px)" : "none",
        }}
      >
        {content}
      </div>
    );
  }

  if (center === "parent") {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex flex-col items-center justify-center ${className}`}
    >
      {content}
    </div>
  );
};

export default Loading;
