// Rates are USD-relative: how many USD is 1 unit of the currency worth.
// Converting between any two currencies pivots through USD, so changing the
// base currency never requires re-entering rates.

export const CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'AUD']

export const DEFAULT_RATES = {
  USD: 1,
  CAD: 0.73,
  EUR: 1.08,
  GBP: 1.27,
  AUD: 0.66,
}

export const DEFAULT_BASE = 'USD'

export function convert(amount, from, base, rates = DEFAULT_RATES) {
  const fromRate = rates[from] ?? 1
  const baseRate = rates[base] ?? 1
  return (amount * fromRate) / baseRate
}

const SYMBOLS = { USD: '$', CAD: 'C$', EUR: '€', GBP: '£', AUD: 'A$' }

export function formatMoney(amount, currency) {
  const sym = SYMBOLS[currency] ?? ''
  return `${sym}${amount.toFixed(2)} ${currency}`
}
