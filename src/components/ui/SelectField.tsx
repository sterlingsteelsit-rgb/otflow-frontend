import React from "react";
import { cn } from "../../utils/cn";

export type SelectOption = {
  label: string;
  value: string; // ✅ string only
  disabled?: boolean;
};

type Props = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "value" | "onChange"
> & {
  label?: string;
  error?: string;
  value: string; // ✅ controlled
  onValueChange: (value: string) => void;
  options: SelectOption[];
};

export function SelectField({
  label,
  error,
  options,
  className,
  value,
  onValueChange,
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
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
    </label>
  );
}
