import Dashboard from './Dashboard'
import SubscriptionCard from './SubscriptionCard'

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function ClientDetail({
  client, subscriptions, onBack, onEditClient,
  onAddSub, onEditSub, onDeleteSub, onDuplicateSub, onToggleActive, onHistorySub,
  baseCurrency, rates,
}) {
  const subs = subscriptions.filter((s) => s.clientId === client.id)

  return (
    <div className="space-y-6">
      {/* Back + breadcrumb */}
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
        ← Back to Clients
      </button>

      {/* Client header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0" style={{ background: '#97989a' }}>
            {initials(client.name)}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{client.name}</h2>
            {client.company && <p className="text-sm text-gray-500">{client.company}</p>}
            <div className="flex gap-4 mt-1 flex-wrap">
              {client.email && <a href={`mailto:${client.email}`} className="text-xs hover:underline" style={{ color: '#e1251b' }}>{client.email}</a>}
              {client.phone && <span className="text-xs text-gray-400">{client.phone}</span>}
            </div>
            {client.notes && <p className="text-xs text-gray-400 mt-2 max-w-md">{client.notes}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEditClient(client)} className="border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Edit Client</button>
          <button onClick={onAddSub} className="text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 flex items-center gap-1.5" style={{ background: '#e1251b' }}>
            <span className="text-base leading-none">+</span> Add Subscription
          </button>
        </div>
      </div>

      {/* Their dashboard summary */}
      {subs.length > 0 && <Dashboard subscriptions={subs} baseCurrency={baseCurrency} rates={rates} />}

      {/* Their subscriptions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Subscriptions ({subs.length})</h3>
        {subs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 text-sm">No subscriptions for this client yet.</p>
            <button onClick={onAddSub} className="mt-3 text-sm font-medium hover:underline" style={{ color: '#e1251b' }}>Add one</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subs.map((s) => (
              <SubscriptionCard
                key={s.id}
                sub={s}
                onEdit={onEditSub}
                onDelete={onDeleteSub}
                onDuplicate={onDuplicateSub}
                onToggleActive={onToggleActive}
                onHistory={onHistorySub}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
