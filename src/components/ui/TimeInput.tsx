import React from "react";
import { cn } from "../../utils/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

/**
 * Custom TimeInput component
 *
 * Usage:
 * <TimeInput
 *   label="Start Time"
 *   value={time}
 *   onChange={e => setTime(e.target.value)}
 *   error={error}
 *   step={60} // seconds step
 *   min="09:00"
 *   max="18:00"
 * />
 */
export function TimeInput({ label, error, className, ...props }: Props) {
  return (
    <label className="block">
      {label && (
        <div className="mb-1 text-sm font-medium text-black">{label}</div>
      )}

      <input
        type="time"
        className={cn(
          "w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none",
          "focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
            : "",
          className,
        )}
        {...props}
      />

      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </label>
  );
}
