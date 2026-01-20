import React from "react";
import { cn } from "../../utils/cn";

type Option =
  | string
  | {
      label: string;
      value: string | number;
      disabled?: boolean;
    };

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options?: Option[];
};

export function Select({
  label,
  error,
  options,
  className,
  children,
  ...props
}: Props) {
  return (
    <label className="block">
      {label ? (
        <div className="mb-1 text-sm font-medium text-black">{label}</div>
      ) : null}
      <select
        className={cn(
          "w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none",
          "focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
            : "",
          className,
        )}
        {...props}
      >
        {options
          ? options.map((opt) =>
              typeof opt === "string" ? (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ) : (
                <option
                  key={String(opt.value)}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </option>
              ),
            )
          : children}
      </select>
      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
    </label>
  );
}
