// All product prices in the database are stored in the base currency (HKD).
// Other currencies are calculated client-side using the static rates below.
// Rates are approximate demo values and NOT real-time FX rates.
export const BASE_CURRENCY = 'HKD';

export const CURRENCIES = {
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', locale: 'en-HK', rate: 1 },
  USD: { code: 'USD', name: 'US Dollar',         symbol: '$',   locale: 'en-US', rate: 0.128 },
  GBP: { code: 'GBP', name: 'British Pound',     symbol: '£',   locale: 'en-GB', rate: 0.102 },
  EUR: { code: 'EUR', name: 'Euro',              symbol: '€',   locale: 'en-IE', rate: 0.120 },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES);

export function convertFromBase(amount, code) {
  const cfg = CURRENCIES[code] || CURRENCIES[BASE_CURRENCY];
  return Number(amount || 0) * cfg.rate;
}

export function convertToBase(amount, code) {
  const cfg = CURRENCIES[code] || CURRENCIES[BASE_CURRENCY];
  return Number(amount || 0) / cfg.rate;
}

export function formatMoney(amount, code = BASE_CURRENCY, options = {}) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '';
  const cfg = CURRENCIES[code] || CURRENCIES[BASE_CURRENCY];
  const converted = convertFromBase(amount, code);
  const { compact = false, decimals } = options;
  try {
    return new Intl.NumberFormat(cfg.locale, {
      style: 'currency',
      currency: cfg.code,
      minimumFractionDigits: decimals ?? 2,
      maximumFractionDigits: decimals ?? 2,
      notation: compact ? 'compact' : 'standard',
    }).format(converted);
  } catch {
    return `${cfg.symbol}${converted.toFixed(decimals ?? 2)}`;
  }
}
