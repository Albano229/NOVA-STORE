"use client";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  animation?: "fade-in-up" | "fade-in-left" | "fade-in-right" | "scale-in";
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article";
}

export function ScrollReveal({
  children,
  animation = "fade-in-up",
  delay = 0,
  className = "",
  as: Tag = "div",
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal({});

  const delayClass = delay > 0 ? `animate-delay-${Math.min(delay, 500)}` : "";

  return (
    <Tag
      ref={ref}
      className={`${className} animate-${animation}${isVisible ? " visible" : ""} ${delayClass}`}
    >
      {children}
    </Tag>
  );
}
