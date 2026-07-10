"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">
            {label}
          </label>
        )}
        <input
          id={id}
          className={cn(
            "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
            "placeholder:text-gray-400 dark:placeholder:text-zinc-500",
            "focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
