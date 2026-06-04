import { useMemo } from 'react'
import { toMonthly, nextRenewalDate, daysUntil, formatDate } from '../utils/dateUtils'
import { getCategoryById } from '../data/categories'
import { convert, DEFAULT_RATES, DEFAULT_BASE } from '../data/currency'
import { spendByMonth } from '../utils/spend'

function StatCard({ label, value, sub, highlight }) {
  return (
    <div
      className="rounded-2xl border p-5 shadow-sm"
      style={highlight
        ? { background: '#e1251b', borderColor: '#e1251b' }
        : { background: '#fff', borderColor: '#f3f4f6' }
      }
    >
      <p className="text-sm mb-1" style={{ color: highlight ? 'rgba(255,255,255,0.8)' : '#6b7280' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: highlight ? '#fff' : '#111827' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: highlight ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>{sub}</p>}
    </div>
  )
}

export default function Dashboard({ subscriptions, clients = [], baseCurrency = DEFAULT_BASE, rates = DEFAULT_RATES }) {
  const active = subscriptions.filter((s) => s.active)
  const nonLifetime = active.filter((s) => s.type !== 'lifetime')

  const monthlyBase = (s) => convert(toMonthly(s.amount, s.cycle), s.currency, baseCurrency, rates)

  const { monthly, yearly } = useMemo(() => {
    const m = nonLifetime.reduce((sum, s) => sum + monthlyBase(s), 0)
    return { monthly: m, yearly: m * 12 }
  }, [nonLifetime, baseCurrency, rates]) // eslint-disable-line react-hooks/exhaustive-deps

  const upcoming = useMemo(() => {
    return nonLifetime
      .map((s) => ({ ...s, renewal: nextRenewalDate(s.startDate, s.cycle) }))
      .sort((a, b) => a.renewal - b.renewal)
      .slice(0, 6)
  }, [nonLifetime])

  const byCategory = useMemo(() => {
    const map = {}
    nonLifetime.forEach((s) => {
      map[s.category] = (map[s.category] ?? 0) + monthlyBase(s)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [nonLifetime, baseCurrency, rates]) // eslint-disable-line react-hooks/exhaustive-deps

  const byOwner = useMemo(() => {
    if (!clients.length) return []
    const map = {}
    nonLifetime.forEach((s) => {
      const key = s.clientId ?? '__me__'
      map[key] = (map[key] ?? 0) + monthlyBase(s)
    })
    return Object.entries(map)
      .map(([key, amount]) => ({
        key,
        label: key === '__me__' ? 'Me (Personal)' : (clients.find((c) => c.id === key)?.name ?? 'Unknown'),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [nonLifetime, clients, baseCurrency, rates]) // eslint-disable-line react-hooks/exhaustive-deps

  const spend = useMemo(
    () => spendByMonth(subscriptions, 12, baseCurrency, rates),
    [subscriptions, baseCurrency, rates]
  )
  const maxSpend = Math.max(1, ...spend.map((s) => s.total))

  const currency = baseCurrency
  const fmt = (n) => `${currency} ${n.toFixed(2)}`

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Monthly Total" value={fmt(monthly)} highlight />
        <StatCard label="Yearly Total" value={fmt(yearly)} sub={`${nonLifetime.length} recurring`} />
        <StatCard label="Active" value={active.length} sub={`${subscriptions.filter(s => !s.active).length} paused`} />
        <StatCard
          label="Avg per Sub"
          value={nonLifetime.length ? fmt(monthly / nonLifetime.length) : `${currency} 0.00`}
          sub="per month"
        />
      </div>

      {/* Spend over time */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#e1251b' }} />
            Spend Over Time
          </h3>
          <span className="text-xs text-gray-400">Last 12 months · {currency}</span>
        </div>
        <div className="flex items-end justify-between gap-1.5 h-32">
          {spend.map((m) => (
            <div key={m.key} className="flex-1 flex flex-col items-center justify-end h-full group">
              <div className="text-[10px] text-gray-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {m.total.toFixed(0)}
              </div>
              <div
                className="w-full rounded-t transition-all"
                style={{ height: `${(m.total / maxSpend) * 100}%`, background: m.total > 0 ? '#e1251b' : '#f3f4f6', minHeight: m.total > 0 ? '2px' : '0' }}
                title={`${m.label}: ${currency} ${m.total.toFixed(2)}`}
              />
              <div className="text-[10px] text-gray-400 mt-1.5 whitespace-nowrap">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming renewals */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: '#e1251b' }}
            />
            Upcoming Renewals
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-400">No active recurring subscriptions</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((s) => {
                const days = daysUntil(s.renewal)
                const cat = getCategoryById(s.category)
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: cat.bg, color: cat.color }}
                      >
                        {s.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                        <p className="text-xs text-gray-400">{formatDate(s.renewal)}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-800">{s.currency} {s.amount.toFixed(2)}</p>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          days <= 0 ? 'bg-red-100 text-red-700'
                          : days <= 7 ? 'bg-orange-100 text-orange-700'
                          : days <= 30 ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {days <= 0 ? 'Today' : `${days}d`}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Spending by category */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#97989a' }} />
            Spending by Category
          </h3>
          {byCategory.length === 0 ? (
            <p className="text-sm text-gray-400">No active subscriptions</p>
          ) : (
            <ul className="space-y-3">
              {byCategory.map(([catId, amount]) => {
                const cat = getCategoryById(catId)
                const pct = monthly > 0 ? (amount / monthly) * 100 : 0
                return (
                  <li key={catId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{cat.label}</span>
                      <span className="text-gray-500">{currency} {amount.toFixed(2)}/mo</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${pct}%`, background: '#e1251b' }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Spending by Owner (master view only) */}
      {byOwner.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#e1251b' }} />
            Spending by Owner
          </h3>
          <ul className="space-y-3">
            {byOwner.map((o) => {
              const pct = monthly > 0 ? (o.amount / monthly) * 100 : 0
              return (
                <li key={o.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{o.label}</span>
                    <span className="text-gray-500">{currency} {o.amount.toFixed(2)}/mo</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: o.key === '__me__' ? '#e1251b' : '#97989a' }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
