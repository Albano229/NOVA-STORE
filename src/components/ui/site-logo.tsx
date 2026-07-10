"use client";

import { useSiteSettings } from "@/contexts/site-settings-context";
import { BRAND } from "@/lib/brand";
import Link from "next/link";

interface SiteLogoProps {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light";
}

export function SiteLogo({ href, className = "", size = "md", variant = "dark" }: SiteLogoProps) {
  const { settings } = useSiteSettings();

  const customLogo = settings.logo || "";
  const defaultLogo = "/brand/logo.png";
  const logoSrc = customLogo || defaultLogo;

  const sizeStyles = {
    sm: { height: "h-[32px] md:h-[36px]" },
    md: { height: "h-[36px] md:h-[48px]" },
    lg: { height: "h-[40px] md:h-[52px]" },
  };

  const content = (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoSrc}
        alt={settings.siteName || BRAND.name}
        className={`${sizeStyles[size].height} w-auto`}
        style={{ maxHeight: "56px" }}
      />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
