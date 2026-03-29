import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, value, ...props }: React.ComponentProps<"input">) {
  const displayValue =
    type === "number" && (value === 0 || value === "0") ? "" : value;

  return (
    <input
      type={type}
      data-slot="input"
      value={displayValue}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        type === "number"
          ? "appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:p-0 [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:p-0 [&::-moz-focus-outer]:none"
          : "",
        className
      )}
      {...(type === "number" ? { inputMode: props.inputMode ?? "decimal", pattern: "[0-9]*" } : {})}
      {...props}
    />
  )
}

export { Input }