"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 p-4 dark:bg-zinc-800">
        <Icon className="h-8 w-8 text-gray-400 dark:text-zinc-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[#0f172a] dark:text-zinc-50">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-zinc-400">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 inline-flex items-center rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e293b] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
