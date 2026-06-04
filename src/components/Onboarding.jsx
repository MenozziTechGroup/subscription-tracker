const SUGGESTIONS = [
  { name: 'Netflix', category: 'streaming', amount: 15.99 },
  { name: 'Spotify', category: 'music', amount: 9.99 },
  { name: 'Disney+', category: 'streaming', amount: 13.99 },
  { name: 'YouTube Premium', category: 'streaming', amount: 13.99 },
  { name: 'Amazon Prime', category: 'streaming', amount: 14.99 },
  { name: 'Microsoft 365', category: 'productivity', amount: 6.99 },
  { name: 'Adobe Creative Cloud', category: 'software', amount: 59.99 },
  { name: 'iCloud+', category: 'cloud', amount: 2.99 },
  { name: 'Dropbox', category: 'cloud', amount: 11.99 },
  { name: 'ChatGPT Plus', category: 'software', amount: 20.0 },
]

export default function Onboarding({ onQuickAdd, onAddManual }) {
  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <img src="/mits-logo.svg" alt="MITS" className="h-9 mx-auto mb-6" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SubTracker</h1>
      <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
        Track all your subscriptions, see what you spend monthly and yearly, and never get surprised by a renewal again. Add your first one to get started.
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Quick add a popular service</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.name}
              onClick={() => onQuickAdd({ name: s.name, category: s.category, amount: s.amount, cycle: 'monthly', type: 'subscription' })}
              className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50 transition-colors"
            >
              + {s.name}
            </button>
          ))}
        </div>
        <div className="mt-6 pt-5 border-t border-gray-100">
          <button
            onClick={onAddManual}
            className="text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90"
            style={{ background: '#e1251b' }}
          >
            + Add Manually
          </button>
        </div>
      </div>
    </div>
  )
}
