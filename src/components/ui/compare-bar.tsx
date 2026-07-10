"use client";

import Link from "next/link";
import { useCompareStore } from "@/stores/compare";
import { Scale, X, ArrowRight } from "lucide-react";

export function CompareBar() {
  const { items, removeProduct, clearAll } = useCompareStore();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] backdrop-blur-sm dark:bg-gray-900/95 dark:border-gray-700">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Scale className="h-5 w-5 shrink-0 text-[#7126b6]" />
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800"
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-8 w-8 rounded object-cover"
                />
              )}
              <span className="max-w-[100px] truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                {item.name}
              </span>
              <button
                onClick={() => removeProduct(item.id)}
                className="rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Vider
          </button>
          <Link
            href="/compare"
            className="flex items-center gap-2 rounded-xl bg-[#7126b6] px-4 py-2 text-sm font-medium text-white hover:bg-[#5c1e96]"
          >
            Comparer ({items.length})
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
