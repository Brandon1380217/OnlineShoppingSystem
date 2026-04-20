import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BASE_CURRENCY, CURRENCIES, formatMoney } from '../utils/currency';

const STORAGE_KEY = 'shopease.currency';
const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && CURRENCIES[saved] ? saved : BASE_CURRENCY;
    } catch {
      return BASE_CURRENCY;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, currency); } catch { /* ignore */ }
  }, [currency]);

  const setCurrency = useCallback((code) => {
    if (!CURRENCIES[code]) return;
    setCurrencyState(code);
  }, []);

  const format = useCallback((amount, options) => formatMoney(amount, currency, options), [currency]);

  const value = useMemo(() => ({
    currency,
    setCurrency,
    format,
    config: CURRENCIES[currency],
    currencies: CURRENCIES,
  }), [currency, setCurrency, format]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
