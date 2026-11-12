
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label?: string;
  error?: string;
};

export function Input({
  id,
  label,
  error,
  className = "",
  ...props
}: InputProps) {
  const inputStyles = [
    "w-full rounded-xl border",
    "bg-[var(--surface)] px-4 py-3",
    "text-[var(--foreground)]",
    "placeholder:text-zinc-400",
    "shadow-sm outline-none",
    "transition-all duration-200",
    "focus:ring-4",
    "disabled:cursor-not-allowed disabled:opacity-50",
    error
      ? "border-red-500 focus:border-red-500 focus:ring-red-100"
      : "border-[var(--line)] focus:border-[var(--accent)] focus:ring-red-100",
    className,
  ].join(" ");

  return (
    <div className="w-full space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[var(--foreground)]"
        >
          {label}
        </label>
      )}

      <input
        id={id}
        className={inputStyles}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />

      {error && (
        <p
          id={`${id}-error`}
          className="text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
