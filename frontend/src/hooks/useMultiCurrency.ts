"use client";

import { useState, useCallback } from "react";

const DEFAULT_RATES: Record<string, number> = {
  IDR: 1,
  USD: 0.000065,
  EUR: 0.00006,
  SGD: 0.000088,
  JPY: 0.0098,
  GBP: 0.000051,
  AUD: 0.000098,
  CNY: 0.00047,
};

const STORAGE_KEY = "finpro-currency";

function getSavedCurrency(): string {
  if(typeof window === "undefined") return "IDR";
  try{
    return localStorage.getItem(STORAGE_KEY) || "IDR";
  } catch{ return "IDR"; }
}

export function useMultiCurrency(){
  const [currency, setCurrency] = useState(() => getSavedCurrency());
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);

  const changeCurrency = useCallback((next: string) => {
    if(typeof window !== "undefined") {
      try{ localStorage.setItem(STORAGE_KEY, next); } catch{ /* ignore */ }
    }
    setCurrency(next);
  }, []);

  const convert = useCallback((amount: number, from: string = "IDR", to?: string) => {
    const target = to || currency;
    if(from === target) return amount;
    const fromRate = rates[from] || 1;
    const toRate = rates[target] || 1;
    return (amount * toRate) / fromRate;
  }, [currency, rates]);

  const format = useCallback((amount: number, from?: string) => {
    const converted = convert(amount, from || "IDR");
    const symbol = {
      IDR: "Rp",
      USD: "$",
      EUR: "€",
      SGD: "S$",
      JPY: "¥",
      GBP: "£",
      AUD: "A$",
      CNY: "¥",
    }[currency] || currency;

    if(converted >= 1000000000) return `${symbol}${(converted / 1000000000).toFixed(1)}B`;
    if(converted >= 1000000) return `${symbol}${(converted / 1000000).toFixed(1)}M`;
    if(converted >= 1000) return `${symbol}${(converted / 1000).toFixed(1)}K`;
    return `${symbol}${converted.toFixed(0)}`;
  }, [currency, convert]);

  return {
    currency,
    changeCurrency,
    rates,
    setRates,
    convert,
    format,
    supportedCurrencies: Object.keys(DEFAULT_RATES),
  };
}
