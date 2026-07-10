"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      default: "bg-[#7126b6] text-white hover:bg-[#7126b6]/90 focus-visible:ring-[#7126b6]",
      outline: "border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-gray-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
      ghost: "hover:bg-gray-100 focus-visible:ring-gray-400 dark:text-zinc-300 dark:hover:bg-zinc-800",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
      secondary: "bg-[#7126b6]/10 text-[#7126b6] hover:bg-[#7126b6]/20 focus-visible:ring-[#7126b6] dark:bg-purple-500/20 dark:text-purple-400",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-6 text-lg",
      icon: "h-10 w-10",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, type ButtonProps };
