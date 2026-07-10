"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: number;
  color?: string;
}

export function StatCard({ icon: Icon, label, value, change, color = "text-indigo-600" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">{label}</span>
        <div className={cn("rounded-lg bg-gray-50 p-2 dark:bg-zinc-800", color.replace("text-", "bg-").replace("600", "50").replace("500", "50"))}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-zinc-50">{value}</p>
      {change !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          {change >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              change >= 0 ? "text-green-600" : "text-red-600"
            )}
          >
            {change >= 0 ? "+" : ""}
            {change}%
          </span>
        </div>
      )}
    </div>
  );
}
