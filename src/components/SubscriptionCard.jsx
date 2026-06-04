import { getCategoryById } from '../data/categories'
import { nextRenewalDate, daysUntil, formatDate, toMonthly, breakEven } from '../utils/dateUtils'

const TYPE_STYLES = {
  subscription: { label: 'Subscription', bg: '#f0f0f0', color: '#3a3a3a' },
  lifetime: { label: 'Lifetime', bg: '#fef9c3', color: '#854d0e' },
  trial: { label: 'Trial', bg: '#fff7ed', color: '#c2410c' },
  revenue: { label: 'Revenue', bg: '#f0fdf4', color: '#166534' },
}

function RenewalBadge({ days }) {
  if (days <= 0) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Today</span>
  if (days <= 7) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">In {days}d</span>
  if (days <= 30) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">In {days}d</span>
  return <span className="text-xs text-gray-400">{formatDate(new Date(Date.now() + days * 86400000))}</span>
}

export default function SubscriptionCard({ sub, onEdit, onDelete, onDuplicate, onToggleActive, onHistory, selectable = false, selected = false, onSelectToggle }) {
  const cat = getCategoryById(sub.category)
  const isLifetime = sub.type === 'lifetime'
  const renewal = !isLifetime ? nextRenewalDate(sub.startDate, sub.cycle) : null
  const days = renewal ? daysUntil(renewal) : null
  const monthly = !isLifetime ? toMonthly(sub.amount, sub.cycle) : null
  const typeStyle = TYPE_STYLES[sub.type] ?? TYPE_STYLES.subscription

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow flex flex-col ${!sub.active ? 'opacity-60' : ''}`}
      style={{ borderColor: selected ? '#e1251b' : '#f3f4f6', boxShadow: selected ? '0 0 0 1px #e1251b' : undefined }}
    >
      <div className="p-4 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {selectable && (
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onSelectToggle?.(sub.id)}
                className="w-4 h-4 flex-shrink-0 cursor-pointer accent-red-600"
              />
            )}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
              style={{ background: cat.bg, color: cat.color }}
            >
              {sub.name[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{sub.name}</p>
                {!sub.recurring && !isLifetime && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">one-time</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: typeStyle.bg, color: typeStyle.color }}>{typeStyle.label}</span>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-gray-900 text-sm">{sub.currency} {sub.amount.toFixed(2)}</p>
            {!isLifetime && <p className="text-xs text-gray-400 capitalize">{sub.cycle}</p>}
          </div>
        </div>

        {/* Next payment */}
        {!isLifetime && renewal && (
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Next payment</p>
              <RenewalBadge days={days} />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0.5">Monthly equiv.</p>
              <p className="text-xs font-semibold text-gray-600">{sub.currency} {monthly.toFixed(2)}</p>
            </div>
          </div>
        )}

        {isLifetime && (() => {
          const be = breakEven(sub)
          return (
            <div className="mb-2 rounded-lg p-2" style={{ background: '#faf9f7' }}>
              <p className="text-xs text-gray-400">Purchased {formatDate(sub.startDate)} · one-time</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">{sub.currency} {be.costPerMonth.toFixed(2)}/mo effective</span>
                <span className="text-xs text-gray-400">{sub.currency} {be.costPerDay.toFixed(3)}/day</span>
              </div>
              {be.breakEvenMonths != null && (
                <p className="text-xs font-medium mt-1" style={{ color: be.paidOff ? '#166534' : '#c2410c' }}>
                  {be.paidOff
                    ? `✓ Paid off — saved ${sub.currency} ${be.saved.toFixed(0)} vs monthly`
                    : `Breaks even in ${Math.ceil(be.breakEvenMonths - be.monthsOwned)} more mo (${Math.ceil(be.breakEvenMonths)} total)`}
                </p>
              )}
            </div>
          )
        })()}

        {/* Payment method */}
        {sub.paymentMethod && sub.paymentMethod !== 'Not Specified' && (
          <p className="text-xs text-gray-400 mb-2">via {sub.paymentMethod}</p>
        )}

        {/* URL */}
        {sub.url && (
          <a
            href={sub.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs truncate block mb-2 hover:underline"
            style={{ color: '#e1251b' }}
          >
            {sub.url.replace(/^https?:\/\//, '')}
          </a>
        )}

        {/* Tags */}
        {sub.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {sub.tags.map((t) => (
              <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{t}</span>
            ))}
          </div>
        )}

        {/* Notes */}
        {sub.notes && <p className="text-xs text-gray-400 truncate">{sub.notes}</p>}

        {onHistory && (
          <button onClick={() => onHistory(sub)} className="mt-2 text-xs text-gray-400 hover:text-gray-700 hover:underline">
            View payment history →
          </button>
        )}

        {!sub.active && (
          <span className="mt-1 inline-block text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Paused</span>
        )}
      </div>

      {/* Action row */}
      <div className="flex border-t border-gray-50">
        <button
          onClick={() => onEdit(sub)}
          className="flex-1 text-xs text-gray-500 hover:text-gray-800 font-medium py-2.5 hover:bg-gray-50 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onToggleActive(sub.id)}
          className="flex-1 text-xs font-medium py-2.5 hover:bg-gray-50 transition-colors border-l border-gray-50"
          style={{ color: sub.active ? '#97989a' : '#e1251b' }}
        >
          {sub.active ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={() => onDuplicate(sub)}
          className="flex-1 text-xs text-gray-500 hover:text-gray-800 font-medium py-2.5 hover:bg-gray-50 transition-colors border-l border-gray-50"
        >
          Duplicate
        </button>
        <button
          onClick={() => onDelete(sub.id)}
          className="flex-1 text-xs font-medium py-2.5 hover:bg-red-50 transition-colors border-l border-gray-50"
          style={{ color: '#e1251b' }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
