
import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "dark";
};

export function Card({
  children,
  variant = "default",
  className = "",
  ...props
}: CardProps) {
  const base =
    "rounded-2xl border p-5 shadow-sm " +
    "transition-shadow duration-200 " +
    "sm:p-6";

  const variants = {
    default:
      "border-[var(--line)] " +
      "bg-[var(--surface)] " +
      "text-[var(--foreground)]",

    dark:
      "border-zinc-800 bg-zinc-900 text-white",
  };

  return (
    <div
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
