"use client";

import { cn } from "@/lib/utils";

type ToastProps = {
  message: string;
  visible: boolean;
  variant?: "default" | "warning" | "error";
};

const variantClasses: Record<NonNullable<ToastProps["variant"]>, string> = {
  default: "bg-gray-800 text-white",
  warning: "bg-amber-500 text-white",
  error: "bg-red-600 text-white",
};

export function Toast({ message, visible, variant = "default" }: ToastProps) {
  return (
    <output
      aria-live="polite"
      className={cn(
        "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md px-4 py-2 text-sm shadow-lg transition-all duration-300",
        variantClasses[variant],
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0 pointer-events-none",
      )}
    >
      {message}
    </output>
  );
}
