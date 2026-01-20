import React from "react";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type IconElement = React.ReactElement<{ className?: string }>;

function isIconElement(node: React.ReactNode): node is IconElement {
  return React.isValidElement(node);
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
};

export function Button({
  className,
  variant = "primary",
  icon,
  iconPosition = "left",
  children,
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-brand-blue text-white hover:brightness-110",
    secondary: "bg-black text-white hover:brightness-110",
    ghost: "bg-transparent text-black hover:bg-black/5",
    danger: "bg-red-600 text-white hover:brightness-110",
  };

  const iconWithColor = isIconElement(icon)
    ? React.cloneElement(icon, {
        className: cn(icon.props.className, "flex-shrink-0"),
      })
    : icon;

  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {iconWithColor && iconPosition === "left" && iconWithColor}
      {children && <span>{children}</span>}
      {iconWithColor && iconPosition === "right" && iconWithColor}
    </button>
  );
}
