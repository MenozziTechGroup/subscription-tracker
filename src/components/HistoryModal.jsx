import { useEffect } from 'react'
import { subscriptionHistory } from '../utils/spend'
import { formatDate } from '../utils/dateUtils'

export default function HistoryModal({ sub, onClose }) {
  const { charges, total, count } = subscriptionHistory(sub)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{sub.name}</h2>
            <p className="text-xs text-gray-400">Billing history</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-7 h-7 flex items-center justify-center">×</button>
        </div>

        <div className="px-6 py-4 border-b border-gray-100" style={{ background: '#faf9f7' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Total paid to date</p>
              <p className="text-lg font-bold text-gray-900">{sub.currency} {total.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Charges</p>
              <p className="text-lg font-bold text-gray-900">{count}</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto p-2">
          {charges.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No charges yet.</p>
          ) : (
            <ul>
              {charges.map((c, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{formatDate(c)}</span>
                  <span className="text-sm font-medium text-gray-900">{sub.currency} {sub.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
