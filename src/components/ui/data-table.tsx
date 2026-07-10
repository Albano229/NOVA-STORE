"use client";

import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  render: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
}

function TableSkeleton({ columns }: { columns: Column<unknown>[] }) {
  return (
    <tbody>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100 dark:border-zinc-800">
          {columns.map((col) => (
            <td key={col.key} className={cn("px-4 py-3", col.className)}>
              <div className="h-4 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" style={{ width: `${50 + Math.random() * 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyIcon,
  emptyTitle = "Aucun élément",
  emptyDescription,
  emptyAction,
  keyExtractor,
  onRowClick,
  stickyHeader = true,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50 dark:border-zinc-800 dark:bg-zinc-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-400",
                    stickyHeader && "sticky top-0 z-10 bg-gray-50/50 backdrop-blur-sm dark:bg-zinc-800/50",
                    col.headerClassName
                  )}
                >
                  <div className="h-3 w-16 animate-pulse rounded bg-gray-300 dark:bg-zinc-600" />
                </th>
              ))}
            </tr>
          </thead>
          <TableSkeleton columns={columns as Column<unknown>[]} />
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          {emptyIcon && <div className="text-gray-300 dark:text-zinc-600">{emptyIcon}</div>}
          <h3 className="mt-4 text-base font-medium text-[#0f172a] dark:text-zinc-50">{emptyTitle}</h3>
          {emptyDescription && (
            <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{emptyDescription}</p>
          )}
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50 dark:border-zinc-800 dark:bg-zinc-800/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-400",
                  stickyHeader && "sticky top-0 z-10 bg-gray-50/50 backdrop-blur-sm dark:bg-zinc-800/50",
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
          {data.map((row, index) => (
            <tr
              key={keyExtractor(row)}
              className={cn(
                "transition-colors hover:bg-gray-50/80 dark:hover:bg-zinc-800/50",
                onRowClick && "cursor-pointer"
              )}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-3", col.className)}>
                  {col.render(row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
