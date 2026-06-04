// Parse 'YYYY-MM-DD' as a LOCAL date. `new Date('2024-06-01')` parses as UTC,
// which shifts to the previous day in western timezones — causing off-by-one
// errors in renewal dates, billing schedules, and break-even math.
export function parseLocalDate(value) {
  if (value instanceof Date) return value
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return new Date(+m[1], +m[2] - 1, +m[3])
  }
  return new Date(value)
}

export function nextRenewalDate(startDate, cycle) {
  const start = parseLocalDate(startDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let next = new Date(start)
  next.setHours(0, 0, 0, 0)
  while (next < today) {
    if (cycle === 'weekly') next.setDate(next.getDate() + 7)
    else if (cycle === 'monthly') next.setMonth(next.getMonth() + 1)
    else if (cycle === 'quarterly') next.setMonth(next.getMonth() + 3)
    else next.setFullYear(next.getFullYear() + 1)
  }
  return next
}

export function daysUntil(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.round((d - today) / (1000 * 60 * 60 * 24))
}

export function formatDate(date) {
  return parseLocalDate(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateShort(date) {
  return parseLocalDate(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function toMonthly(amount, cycle) {
  if (cycle === 'weekly') return amount * 4.333
  if (cycle === 'monthly') return amount
  if (cycle === 'quarterly') return amount / 3
  return amount / 12
}

export function toYearly(amount, cycle) {
  return toMonthly(amount, cycle) * 12
}

export function breakEven(sub) {
  // For lifetime subs: amortization + optional break-even vs a monthly plan.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = parseLocalDate(sub.startDate)
  start.setHours(0, 0, 0, 0)
  const daysOwned = Math.max(1, Math.round((today - start) / (1000 * 60 * 60 * 24)))
  const monthsOwned = daysOwned / 30.4375
  const costPerDay = sub.amount / daysOwned
  const costPerMonth = sub.amount / monthsOwned

  let breakEvenMonths = null
  let saved = null
  let paidOff = false
  if (sub.monthlyEquivalent && sub.monthlyEquivalent > 0) {
    breakEvenMonths = sub.amount / sub.monthlyEquivalent
    const wouldHaveSpent = sub.monthlyEquivalent * monthsOwned
    saved = wouldHaveSpent - sub.amount
    paidOff = monthsOwned >= breakEvenMonths
  }
  return { daysOwned, monthsOwned, costPerDay, costPerMonth, breakEvenMonths, saved, paidOff }
}

export function sortSubscriptions(subs, sortBy) {
  const arr = [...subs]
  switch (sortBy) {
    case 'name':
      return arr.sort((a, b) => a.name.localeCompare(b.name))
    case 'cost-desc':
      return arr.sort((a, b) => toMonthly(b.amount, b.cycle) - toMonthly(a.amount, a.cycle))
    case 'cost-asc':
      return arr.sort((a, b) => toMonthly(a.amount, a.cycle) - toMonthly(b.amount, b.cycle))
    case 'renewal':
      return arr.sort((a, b) => {
        const ar = a.type === 'lifetime' ? Infinity : nextRenewalDate(a.startDate, a.cycle).getTime()
        const br = b.type === 'lifetime' ? Infinity : nextRenewalDate(b.startDate, b.cycle).getTime()
        return ar - br
      })
    case 'category':
      return arr.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
    default:
      return arr
  }
}
