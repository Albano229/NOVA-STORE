"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { cn } from "@/lib/utils";

export function CurrencySelector() {
  const { currency, setCurrency, supportedCurrencies } = useCurrency();
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

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-[#7126b6] hover:text-[#7126b6] dark:border-gray-700 dark:text-gray-300 dark:hover:border-[#7126b6]"
        title="Changer la devise"
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{currency.code}</span>
        <span className="sm:hidden">{currency.symbol}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Devise
          </div>
          <div className="max-h-64 overflow-y-auto">
            {supportedCurrencies.map((c) => (
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
                <span>{c.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{c.code} ({c.symbol})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
