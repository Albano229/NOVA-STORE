"use client";

import { useEffect } from "react";

export function ScrollAnimator() {
  useEffect(() => {
    const sections = document.querySelectorAll("section");
    sections.forEach((s) => {
      if (!s.classList.contains("animate-fade-in-up") && !s.closest("[data-no-animate]")) {
        s.classList.add("animate-fade-in-up");
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll("section.animate-fade-in-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
