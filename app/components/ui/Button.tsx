
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function buttonStyles(
  variant: Variant = "primary",
  className = ""
) {
  const base =
    "inline-flex min-h-11 items-center justify-center " +
    "rounded-xl px-5 py-2.5 text-sm font-semibold " +
    "transition duration-150 focus-visible:outline-2 " +
    "focus-visible:outline-offset-2 " +
    "focus-visible:outline-[var(--accent)] " +
    "disabled:cursor-not-allowed disabled:opacity-60";

  const variants = {
    primary:
      "bg-[var(--accent)] text-white " +
      "hover:bg-[var(--accent-hover)]",
    secondary:
      "border border-[var(--line)] bg-white " +
      "text-[var(--foreground)] hover:bg-zinc-100",
  };

  return `${base} ${variants[variant]} ${className}`;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={buttonStyles(variant, className)}
      {...props}
    />
  );
}
