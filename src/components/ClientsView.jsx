import { toMonthly } from '../utils/dateUtils'
import { convert, DEFAULT_RATES, DEFAULT_BASE } from '../data/currency'

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function ClientsView({ clients, subscriptions, onAddClient, onEditClient, onDeleteClient, onOpenClient, baseCurrency = DEFAULT_BASE, rates = DEFAULT_RATES }) {
  function clientStats(clientId) {
    const subs = subscriptions.filter((s) => s.clientId === clientId && s.active && s.type !== 'lifetime')
    const monthly = subs.reduce((sum, s) => sum + convert(toMonthly(s.amount, s.cycle), s.currency, baseCurrency, rates), 0)
    const count = subscriptions.filter((s) => s.clientId === clientId).length
    return { monthly, count, currency: baseCurrency }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
          <p className="text-sm text-gray-400">{clients.length} client{clients.length === 1 ? '' : 's'}</p>
        </div>
        <button
          onClick={onAddClient}
          className="text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 flex items-center gap-1.5"
          style={{ background: '#e1251b' }}
        >
          <span className="text-base leading-none">+</span> Add Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400 text-sm">No clients yet.</p>
          <button onClick={onAddClient} className="mt-3 text-sm font-medium hover:underline" style={{ color: '#e1251b' }}>
            Add your first client
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => {
            const { monthly, count, currency } = clientStats(c.id)
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <button onClick={() => onOpenClient(c.id)} className="p-4 flex-1 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: '#97989a' }}>
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                      {c.company && <p className="text-xs text-gray-400 truncate">{c.company}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Monthly</p>
                      <p className="text-sm font-bold text-gray-900">{currency} {monthly.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Subscriptions</p>
                      <p className="text-sm font-semibold text-gray-600">{count}</p>
                    </div>
                  </div>
                  {(c.email || c.phone) && (
                    <p className="text-xs text-gray-400 mt-2 truncate">{c.email || c.phone}</p>
                  )}
                </button>
                <div className="flex border-t border-gray-50">
                  <button onClick={() => onOpenClient(c.id)} className="flex-1 text-xs font-medium py-2.5 hover:bg-gray-50" style={{ color: '#e1251b' }}>Open</button>
                  <button onClick={() => onEditClient(c)} className="flex-1 text-xs text-gray-500 hover:text-gray-800 font-medium py-2.5 hover:bg-gray-50 border-l border-gray-50">Edit</button>
                  <button onClick={() => onDeleteClient(c.id)} className="flex-1 text-xs font-medium py-2.5 hover:bg-red-50 border-l border-gray-50" style={{ color: '#e1251b' }}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
