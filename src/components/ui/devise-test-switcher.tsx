"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Zap } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { cn } from "@/lib/utils";

const TEST_CURRENCIES = [
  { code: "XOF", symbol: "F CFA", label: "XOF (F CFA)" },
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "NGN", symbol: "₦", label: "NGN (₦)" },
];

export function DeviseTestSwitcher() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = TEST_CURRENCIES.find((c) => c.code === currency.code) || TEST_CURRENCIES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
          "border-dashed border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400 hover:bg-amber-100",
          "dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
        )}
        title="[TEST] Changer la devise"
      >
        <Zap className="h-3 w-3" />
        <span className="hidden sm:inline">{current.code}</span>
        <span className="sm:hidden">{current.symbol}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-700">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
              [TEST] Devise
            </span>
          </div>
          <div className="py-1">
            {TEST_CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setCurrency(c.code);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors",
                  currency.code === c.code
                    ? "bg-[#7126b6]/10 font-medium text-[#7126b6] dark:bg-[#7126b6]/20"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                <span>{c.label}</span>
                <span
                  className={cn(
                    "ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    currency.code === c.code
                      ? "bg-[#7126b6] text-white"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  )}
                >
                  {c.symbol}
                </span>
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 px-3 py-2 dark:border-gray-700">
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              Taux via exchangerate-api.com
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
