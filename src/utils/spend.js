import { convert } from '../data/currency'
import { parseLocalDate } from './dateUtils'

function stepInPlace(d, cycle) {
  if (cycle === 'weekly') d.setDate(d.getDate() + 7)
  else if (cycle === 'monthly') d.setMonth(d.getMonth() + 1)
  else if (cycle === 'quarterly') d.setMonth(d.getMonth() + 3)
  else d.setFullYear(d.getFullYear() + 1)
}

// All charge dates for a subscription between fromDate and toDate (inclusive).
export function chargeDatesInWindow(sub, fromDate, toDate) {
  const charges = []
  const d = parseLocalDate(sub.startDate)
  d.setHours(0, 0, 0, 0)

  // One-time charges: lifetime purchases or non-recurring subs.
  if (sub.type === 'lifetime' || sub.recurring === false) {
    if (d >= fromDate && d <= toDate) charges.push(new Date(d))
    return charges
  }

  let guard = 0
  while (d <= toDate && guard < 5000) {
    if (d >= fromDate) charges.push(new Date(d))
    stepInPlace(d, sub.cycle)
    guard++
  }
  return charges
}

function ym(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

// Total spend per month over the last `months` months (converted to base currency).
export function spendByMonth(subs, months, baseCurrency, rates) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1)

  const buckets = []
  for (let i = 0; i < months; i++) {
    const m = new Date(start.getFullYear(), start.getMonth() + i, 1)
    buckets.push({ key: ym(m), label: monthLabel(m), total: 0 })
  }
  const index = Object.fromEntries(buckets.map((b, i) => [b.key, i]))

  subs.forEach((s) => {
    const charges = chargeDatesInWindow(s, start, today)
    charges.forEach((c) => {
      const i = index[ym(c)]
      if (i != null) buckets[i].total += convert(s.amount, s.currency, baseCurrency, rates)
    })
  })
  return buckets
}

// Full billing history of a single subscription up to today.
export function subscriptionHistory(sub) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = parseLocalDate(sub.startDate)
  start.setHours(0, 0, 0, 0)
  const charges = chargeDatesInWindow(sub, start, today)
  const total = charges.length * sub.amount
  return { charges: charges.reverse(), total, count: charges.length }
}
