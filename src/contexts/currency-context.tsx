"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CURRENCIES, COUNTRY_CURRENCY_MAP, type Currency } from "@/lib/currencies";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (code: string) => void;
  convertPrice: (amount: number, fromCurrency?: string) => number;
  formatConvertedPrice: (amount: number, fromCurrency?: string) => string;
  supportedCurrencies: Currency[];
  detectedCountry: string | null;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: CURRENCIES.XOF,
  setCurrency: () => {},
  convertPrice: (a) => a,
  formatConvertedPrice: (a) => `${a} FCFA`,
  supportedCurrencies: Object.values(CURRENCIES),
  detectedCountry: null,
  loading: false,
});

const RATE_CACHE_KEY = "nova_exchange_rates";
const RATE_CACHE_TTL = 3600000;

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES.XOF);
  const [rates, setRates] = useState<Record<string, number>>({ XOF: 1 });
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRates = useCallback(async () => {
    try {
      const cached = localStorage.getItem(RATE_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < RATE_CACHE_TTL) {
          setRates(data);
          setLoading(false);
          return;
        }
      }

      const res = await fetch(
        "https://api.exchangerate-api.com/v4/latest/XOF"
      );
      if (res.ok) {
        const data = await res.json();
        const transformed: Record<string, number> = { XOF: 1 };
        for (const [key, value] of Object.entries(data.rates)) {
          transformed[key] = value as number;
        }
        setRates(transformed);
        localStorage.setItem(
          RATE_CACHE_KEY,
          JSON.stringify({ data: transformed, timestamp: Date.now() })
        );
      }
    } catch {
      setRates({ XOF: 1, EUR: 0.00152, USD: 0.00163, GBP: 0.00128 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedCurrency = localStorage.getItem("nova_currency");
    if (savedCurrency && CURRENCIES[savedCurrency]) {
      setCurrencyState(CURRENCIES[savedCurrency]);
    }

    loadRates();

    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        if (data.country_code) {
          setDetectedCountry(data.country_code);
          const savedCurrency = localStorage.getItem("nova_currency");
          if (!savedCurrency && COUNTRY_CURRENCY_MAP[data.country_code]) {
            const code = COUNTRY_CURRENCY_MAP[data.country_code];
            if (CURRENCIES[code]) {
              setCurrencyState(CURRENCIES[code]);
              localStorage.setItem("nova_currency", code);
            }
          }
        }
      })
      .catch(() => {});
  }, [loadRates]);

  const setCurrency = useCallback((code: string) => {
    if (CURRENCIES[code]) {
      setCurrencyState(CURRENCIES[code]);
      localStorage.setItem("nova_currency", code);
    }
  }, []);

  const convertPrice = useCallback(
    (amount: number, fromCurrency?: string): number => {
      if (!fromCurrency || fromCurrency === currency.code) return amount;

      const fromRate = rates[fromCurrency] || 1;
      const toRate = rates[currency.code] || 1;

      const inXOF = amount / fromRate;
      return inXOF * toRate;
    },
    [currency.code, rates]
  );

  const formatConvertedPrice = useCallback(
    (amount: number, fromCurrency?: string): string => {
      const converted = convertPrice(amount, fromCurrency);
      return currency.format(Math.round(converted));
    },
    [currency, convertPrice]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        convertPrice,
        formatConvertedPrice,
        supportedCurrencies: Object.values(CURRENCIES),
        detectedCountry,
        loading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
