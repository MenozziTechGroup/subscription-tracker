import { useState, useEffect, useRef } from 'react'
import {
  getSubscriptions, createSubscription, updateSubscription, deleteSubscription,
  getClients, createClient, updateClient, deleteClient,
  getTags, addTag, getSetting, setSetting, seedIfEmpty,
} from './data/repo'
import { isTauri } from './data/db'
import { checkForUpdate, installUpdate } from './data/updater'
import { DEFAULT_TAGS } from './data/tags'
import { DEFAULT_ALERT_SETTINGS, sendBrowserNotification } from './data/alerts'
import { DEFAULT_RATES, DEFAULT_BASE } from './data/currency'
import { CATEGORIES } from './data/categories'
import Dashboard from './components/Dashboard'
import SubscriptionCard from './components/SubscriptionCard'
import SubscriptionModal from './components/SubscriptionModal'
import ClientModal from './components/ClientModal'
import ClientsView from './components/ClientsView'
import ClientDetail from './components/ClientDetail'
import AlertsPanel from './components/AlertsPanel'
import SettingsPanel from './components/SettingsPanel'
import Onboarding from './components/Onboarding'
import HistoryModal from './components/HistoryModal'
import HelpModal from './components/HelpModal'
import { nextRenewalDate, daysUntil, sortSubscriptions } from './utils/dateUtils'

const VIEWS = ['Dashboard', 'My Subs', 'Clients']

const SAMPLE_SUBS = [
  { id: '1', clientId: null, name: 'Netflix', amount: 15.99, currency: 'USD', cycle: 'monthly', category: 'streaming', type: 'subscription', startDate: '2024-01-15', url: 'https://netflix.com', paymentMethod: 'Credit Card', tags: ['Family', 'Essential'], notes: '', active: true, recurring: true },
  { id: '2', clientId: null, name: 'Spotify', amount: 9.99, currency: 'USD', cycle: 'monthly', category: 'music', type: 'subscription', startDate: '2024-02-01', url: 'https://spotify.com', paymentMethod: 'PayPal', tags: ['Personal'], notes: 'Family plan', active: true, recurring: true },
  { id: '3', clientId: null, name: 'GitHub Pro', amount: 4, currency: 'USD', cycle: 'monthly', category: 'software', type: 'subscription', startDate: '2024-03-10', url: 'https://github.com', paymentMethod: 'Credit Card', tags: ['Business', 'Work Expense'], notes: '', active: true, recurring: true },
  { id: '4', clientId: null, name: 'iCloud 200GB', amount: 2.99, currency: 'USD', cycle: 'monthly', category: 'cloud', type: 'subscription', startDate: '2024-01-01', url: '', paymentMethod: 'Debit Card', tags: ['Personal', 'Essential'], notes: '', active: true, recurring: true },
  { id: '5', clientId: null, name: 'Adobe CC', amount: 599.88, currency: 'USD', cycle: 'yearly', category: 'software', type: 'subscription', startDate: '2024-06-01', url: 'https://adobe.com', paymentMethod: 'Credit Card', tags: ['Business'], notes: '', active: false, recurring: true },
]

function BellIcon({ hasAlerts }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      {hasAlerts && <circle cx="18" cy="6" r="4" fill="#e1251b" stroke="white" strokeWidth="1.5" />}
    </svg>
  )
}

export default function App() {
  const [subs, setSubs] = useState([])
  const [clients, setClients] = useState([])
  const [tags, setTags] = useState([])
  const [alertSettings, setAlertSettings] = useState(DEFAULT_ALERT_SETTINGS)
  const [baseCurrency, setBaseCurrency] = useState(DEFAULT_BASE)
  const [rates, setRates] = useState(DEFAULT_RATES)
  const [loading, setLoading] = useState(true)

  const [view, setView] = useState('Dashboard')
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [modal, setModal] = useState(null)          // null | 'add' | sub object
  const [addDefaultClient, setAddDefaultClient] = useState(null)
  const [addPrefill, setAddPrefill] = useState(null)
  const [clientModal, setClientModal] = useState(null) // null | 'add' | client object
  const [showAlerts, setShowAlerts] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [historySub, setHistorySub] = useState(null)
  const [update, setUpdate] = useState(null)
  const [updateState, setUpdateState] = useState('idle') // idle | installing
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterActive, setFilterActive] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('default')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkTagOpen, setBulkTagOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [confirmDeleteClient, setConfirmDeleteClient] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await seedIfEmpty(SAMPLE_SUBS, DEFAULT_TAGS)
        const [s, c, t, a, bc, r] = await Promise.all([
          getSubscriptions(), getClients(), getTags(),
          getSetting('alerts', DEFAULT_ALERT_SETTINGS),
          getSetting('baseCurrency', DEFAULT_BASE),
          getSetting('rates', DEFAULT_RATES),
        ])
        if (cancelled) return
        setSubs(s); setClients(c); setTags(t)
        setAlertSettings({ ...DEFAULT_ALERT_SETTINGS, ...a })
        setBaseCurrency(bc || DEFAULT_BASE)
        setRates({ ...DEFAULT_RATES, ...(r || {}) })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  async function reloadAll() {
    const [s, c, t, a, bc, r] = await Promise.all([
      getSubscriptions(), getClients(), getTags(),
      getSetting('alerts', DEFAULT_ALERT_SETTINGS),
      getSetting('baseCurrency', DEFAULT_BASE),
      getSetting('rates', DEFAULT_RATES),
    ])
    setSubs(s); setClients(c); setTags(t)
    setAlertSettings({ ...DEFAULT_ALERT_SETTINGS, ...a })
    setBaseCurrency(bc || DEFAULT_BASE)
    setRates({ ...DEFAULT_RATES, ...(r || {}) })
    setSelectedClientId(null)
  }

  async function handleSaveCurrency(newBase, newRates) {
    await setSetting('baseCurrency', newBase)
    await setSetting('rates', newRates)
    setBaseCurrency(newBase)
    setRates(newRates)
  }

  // Alerts across ALL subscriptions (yours + clients')
  const alertSubs = alertSettings.enabled
    ? subs.filter((s) => {
        if (!s.active || s.type === 'lifetime') return false
        const days = daysUntil(nextRenewalDate(s.startDate, s.cycle))
        return alertSettings.daysBeforeRenewal.some((d) => days >= 0 && days <= d)
      })
    : []

  // Recurring notification scheduler — fires due-renewal notifications on load
  // and hourly thereafter (so it keeps working while hidden in the tray).
  // Each (subscription, renewal-date) only notifies once per session.
  const notifiedRef = useRef(new Set())
  useEffect(() => {
    if (loading) return
    if (!alertSettings.enabled || !alertSettings.browserNotifications) return

    const notifyDue = () => {
      subs.forEach((s) => {
        if (!s.active || s.type === 'lifetime') return
        const renewal = nextRenewalDate(s.startDate, s.cycle)
        const days = daysUntil(renewal)
        const due = alertSettings.daysBeforeRenewal.some((d) => days >= 0 && days <= d)
        if (!due) return
        const key = `${s.id}:${renewal.toISOString().slice(0, 10)}`
        if (notifiedRef.current.has(key)) return
        notifiedRef.current.add(key)
        const when = days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`
        const owner = s.clientId ? clients.find((c) => c.id === s.clientId)?.name : null
        sendBrowserNotification(
          `${s.name} renews ${when}`,
          `${owner ? owner + ' · ' : ''}${s.currency} ${s.amount.toFixed(2)} · ${s.cycle}`
        )
      })
    }
    notifyDue()
    const id = setInterval(notifyDue, 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [loading, subs, alertSettings, clients])

  // Check for app updates once on launch (desktop only).
  useEffect(() => {
    if (!isTauri()) return
    let cancelled = false
    ;(async () => {
      const u = await checkForUpdate()
      if (!cancelled && u) setUpdate(u)
    })()
    return () => { cancelled = true }
  }, [])

  async function checkUpdatesManual() {
    const u = await checkForUpdate()
    if (u) { setUpdate(u); return `Update available: v${u.version}` }
    return 'You’re on the latest version.'
  }

  async function applyUpdate() {
    if (!update) return
    setUpdateState('installing')
    try {
      await installUpdate(update)
      // app relaunches on success
    } catch {
      setUpdateState('idle')
    }
  }

  // Keep the tray tooltip in sync with the number of upcoming renewals.
  useEffect(() => {
    if (!isTauri()) return
    let cancelled = false
    ;(async () => {
      try {
        const { TrayIcon } = await import('@tauri-apps/api/tray')
        const tray = await TrayIcon.getById('main')
        if (tray && !cancelled) {
          await tray.setTooltip(
            alertSubs.length
              ? `MITS SubTracker — ${alertSubs.length} renewal${alertSubs.length === 1 ? '' : 's'} due soon`
              : 'MITS SubTracker'
          )
        }
      } catch {
        /* tray not available */
      }
    })()
    return () => { cancelled = true }
  }, [alertSubs.length])

  // ---- subscription CRUD ----
  async function handleSave(sub) {
    if (sub.id && subs.find((s) => s.id === sub.id)) {
      await updateSubscription(sub)
      setSubs((prev) => prev.map((s) => (s.id === sub.id ? sub : s)))
    } else {
      const created = await createSubscription(sub)
      setSubs((prev) => [...prev, created])
    }
    setModal(null)
  }
  async function handleDelete(id) {
    await deleteSubscription(id)
    setSubs((prev) => prev.filter((s) => s.id !== id))
    setConfirmDelete(null)
  }
  async function toggleActive(id) {
    const sub = subs.find((s) => s.id === id)
    if (!sub) return
    const updated = { ...sub, active: !sub.active }
    await updateSubscription(updated)
    setSubs((prev) => prev.map((s) => (s.id === id ? updated : s)))
  }
  async function duplicate(sub) {
    const copy = { ...sub, id: undefined, name: `${sub.name} (copy)` }
    const created = await createSubscription(copy)
    setSubs((prev) => [...prev, created])
  }

  // ---- client CRUD ----
  async function handleSaveClient(client) {
    if (client.id && clients.find((c) => c.id === client.id)) {
      await updateClient(client)
      setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)))
    } else {
      const created = await createClient(client)
      setClients((prev) => [...prev, created])
    }
    setClientModal(null)
  }
  async function handleDeleteClient(id) {
    await deleteClient(id)
    setClients((prev) => prev.filter((c) => c.id !== id))
    setSubs((prev) => prev.filter((s) => s.clientId !== id))
    setConfirmDeleteClient(null)
    if (selectedClientId === id) setSelectedClientId(null)
  }

  // ---- tags / alerts ----
  async function handleAddTag(tag) {
    await addTag(tag)
    setTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]))
  }
  async function handleSaveAlerts(settings) {
    await setSetting('alerts', settings)
    setAlertSettings(settings)
  }

  // open add-subscription modal with a default owner
  function openAddSub(clientId = null, prefill = null) {
    setAddDefaultClient(clientId)
    setAddPrefill(prefill)
    setModal('add')
  }

  // ---- bulk actions ----
  function toggleSelect(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }
  function exitSelectMode() {
    setSelectMode(false); setSelectedIds([]); setBulkTagOpen(false)
  }
  async function bulkSetActive(active) {
    const targets = subs.filter((s) => selectedIds.includes(s.id) && s.active !== active)
    await Promise.all(targets.map((s) => updateSubscription({ ...s, active })))
    setSubs((prev) => prev.map((s) => (selectedIds.includes(s.id) ? { ...s, active } : s)))
    exitSelectMode()
  }
  async function bulkDelete() {
    await Promise.all(selectedIds.map((id) => deleteSubscription(id)))
    setSubs((prev) => prev.filter((s) => !selectedIds.includes(s.id)))
    setConfirmBulkDelete(false)
    exitSelectMode()
  }
  async function bulkAddTag(tag) {
    await handleAddTag(tag)
    const targets = subs.filter((s) => selectedIds.includes(s.id) && !(s.tags ?? []).includes(tag))
    await Promise.all(targets.map((s) => updateSubscription({ ...s, tags: [...(s.tags ?? []), tag] })))
    setSubs((prev) => prev.map((s) =>
      selectedIds.includes(s.id) && !(s.tags ?? []).includes(tag)
        ? { ...s, tags: [...(s.tags ?? []), tag] } : s
    ))
    setBulkTagOpen(false)
    exitSelectMode()
  }

  // My Subs = personal only
  const mySubs = subs.filter((s) => s.clientId == null)
  const filtered = sortSubscriptions(
    mySubs.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterCategory !== 'all' && s.category !== filterCategory) return false
      if (filterActive === 'active' && !s.active) return false
      if (filterActive === 'paused' && s.active) return false
      if (filterType !== 'all' && s.type !== filterType) return false
      return true
    }),
    sortBy
  )

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--app-bg)' }}>
        <div className="text-center">
          <img src="/mits-logo.svg" alt="MITS" className="h-8 mx-auto mb-4 opacity-80" />
          <p className="text-sm text-gray-400">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-4">
          <img src="/mits-logo.svg" alt="MITS" className="h-7 flex-shrink-0" />

          <nav className="flex gap-1">
            {VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => { setView(v); if (v === 'Clients') setSelectedClientId(null) }}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={view === v ? { background: '#e1251b', color: '#fff' } : { color: '#6b7280' }}
                onMouseEnter={(e) => { if (view !== v) e.currentTarget.style.background = '#f9fafb' }}
                onMouseLeave={(e) => { if (view !== v) e.currentTarget.style.background = 'transparent' }}
              >
                {v}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAlerts(true)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: alertSubs.length > 0 ? '#e1251b' : '#9ca3af' }}
              title="Alert settings"
            >
              <BellIcon hasAlerts={alertSubs.length > 0} />
              {alertSubs.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold" style={{ background: '#e1251b', fontSize: '10px' }}>
                  {alertSubs.length}
                </span>
              )}
            </button>
            <button onClick={() => setShowHelp(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400" title="Help">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400" title="Data & backup">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={() => openAddSub(null)}
              className="text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 hover:opacity-90"
              style={{ background: '#e1251b' }}
            >
              <span className="text-base leading-none">+</span> Add
            </button>
          </div>
        </div>
      </header>

      {/* Update banner */}
      {update && (
        <div style={{ background: '#1a1a2e' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-white">
              ⬆ Update available — v{update.version}
            </span>
            {update.body && <span className="text-xs text-gray-300 truncate max-w-md">{update.body}</span>}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={applyUpdate}
                disabled={updateState === 'installing'}
                className="text-white text-xs font-semibold px-3 py-1 rounded-lg hover:opacity-90 disabled:opacity-60"
                style={{ background: '#e1251b' }}
              >
                {updateState === 'installing' ? 'Installing…' : 'Install & Restart'}
              </button>
              <button onClick={() => setUpdate(null)} className="text-gray-400 hover:text-white text-xs">Later</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert banner */}
      {alertSettings.enabled && alertSubs.length > 0 && (
        <div style={{ background: '#fff3f3', borderBottom: '1px solid #fecaca' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3 flex-wrap">
            <span style={{ color: '#e1251b' }} className="text-xs font-semibold flex items-center gap-1">⚠ Upcoming renewals:</span>
            {alertSubs.map((s) => {
              const days = daysUntil(nextRenewalDate(s.startDate, s.cycle))
              const owner = s.clientId ? (clients.find((c) => c.id === s.clientId)?.name ?? '') : ''
              return (
                <span key={s.id} className="text-xs text-gray-700 bg-white border border-red-200 px-2 py-0.5 rounded-full">
                  {s.name}{owner ? ` (${owner})` : ''} — {days === 0 ? 'today' : `in ${days}d`}
                </span>
              )
            })}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {view === 'Dashboard' && (
          subs.length === 0
            ? <Onboarding onQuickAdd={(p) => openAddSub(null, p)} onAddManual={() => openAddSub(null)} />
            : <Dashboard subscriptions={subs} clients={clients} baseCurrency={baseCurrency} rates={rates} />
        )}

        {view === 'My Subs' && subs.length === 0 && (
          <Onboarding onQuickAdd={(p) => openAddSub(null, p)} onAddManual={() => openAddSub(null)} />
        )}

        {view === 'My Subs' && subs.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none w-44" />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
                <option value="all">All Types</option>
                <option value="subscription">Subscription</option>
                <option value="lifetime">Lifetime</option>
                <option value="trial">Trial</option>
                <option value="revenue">Revenue</option>
              </select>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
                <option value="all">All Categories</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" title="Sort">
                <option value="default">Sort: Default</option>
                <option value="name">Name (A–Z)</option>
                <option value="cost-desc">Cost (high → low)</option>
                <option value="cost-asc">Cost (low → high)</option>
                <option value="renewal">Next renewal</option>
                <option value="category">Category</option>
              </select>
              <button
                onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
                className="ml-auto border rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                style={selectMode ? { background: '#e1251b', color: '#fff', borderColor: '#e1251b' } : { borderColor: '#e5e7eb', color: '#6b7280', background: '#fff' }}
              >
                {selectMode ? 'Done' : 'Select'}
              </button>
              <span className="text-sm text-gray-400">{filtered.length} subscriptions</span>
            </div>

            {/* Bulk action bar */}
            {selectMode && (
              <div className="sticky top-14 z-30 bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-2.5 flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-gray-700">{selectedIds.length} selected</span>
                <button
                  onClick={() => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map((s) => s.id))}
                  className="text-xs text-gray-500 hover:text-gray-800 underline"
                >
                  {selectedIds.length === filtered.length && filtered.length > 0 ? 'Clear all' : 'Select all'}
                </button>
                <div className="ml-auto flex items-center gap-2 relative">
                  <button onClick={() => bulkSetActive(false)} disabled={!selectedIds.length} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-gray-600">Pause</button>
                  <button onClick={() => bulkSetActive(true)} disabled={!selectedIds.length} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-gray-600">Resume</button>
                  <button onClick={() => setBulkTagOpen((v) => !v)} disabled={!selectedIds.length} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-gray-600">Add Tag ▾</button>
                  <button onClick={() => setConfirmBulkDelete(true)} disabled={!selectedIds.length} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-40" style={{ background: '#e1251b' }}>Delete</button>
                  {bulkTagOpen && (
                    <div className="absolute right-0 top-9 z-40 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto w-44">
                      {tags.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">No tags yet</p>}
                      {tags.map((t) => (
                        <button key={t} onClick={() => bulkAddTag(t)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700">{t}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm">No subscriptions found.</p>
                <button onClick={() => openAddSub(null)} className="mt-3 text-sm font-medium hover:underline" style={{ color: '#e1251b' }}>Add your first subscription</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((s) => (
                  <SubscriptionCard
                    key={s.id}
                    sub={s}
                    onEdit={setModal}
                    onDelete={setConfirmDelete}
                    onDuplicate={duplicate}
                    onToggleActive={toggleActive}
                    onHistory={setHistorySub}
                    selectable={selectMode}
                    selected={selectedIds.includes(s.id)}
                    onSelectToggle={toggleSelect}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'Clients' && !selectedClient && (
          <ClientsView
            clients={clients}
            subscriptions={subs}
            baseCurrency={baseCurrency}
            rates={rates}
            onAddClient={() => setClientModal('add')}
            onEditClient={(c) => setClientModal(c)}
            onDeleteClient={setConfirmDeleteClient}
            onOpenClient={setSelectedClientId}
          />
        )}

        {view === 'Clients' && selectedClient && (
          <ClientDetail
            client={selectedClient}
            subscriptions={subs}
            onBack={() => setSelectedClientId(null)}
            onEditClient={(c) => setClientModal(c)}
            onAddSub={() => openAddSub(selectedClient.id)}
            onEditSub={setModal}
            onDeleteSub={setConfirmDelete}
            onDuplicateSub={duplicate}
            onToggleActive={toggleActive}
            onHistorySub={setHistorySub}
            baseCurrency={baseCurrency}
            rates={rates}
          />
        )}
      </main>

      {modal && (
        <SubscriptionModal
          sub={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          allTags={tags}
          onAddTag={handleAddTag}
          clients={clients}
          defaultClientId={modal === 'add' ? addDefaultClient : null}
          prefill={modal === 'add' ? addPrefill : null}
        />
      )}

      {clientModal && (
        <ClientModal
          client={clientModal === 'add' ? null : clientModal}
          onSave={handleSaveClient}
          onClose={() => setClientModal(null)}
        />
      )}

      {showAlerts && (
        <AlertsPanel settings={alertSettings} onSave={handleSaveAlerts} onClose={() => setShowAlerts(false)} />
      )}

      {historySub && (
        <HistoryModal sub={historySub} onClose={() => setHistorySub(null)} />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {showSettings && (
        <SettingsPanel
          clients={clients}
          baseCurrency={baseCurrency}
          rates={rates}
          onSaveCurrency={handleSaveCurrency}
          onCheckUpdates={checkUpdatesManual}
          onClose={() => setShowSettings(false)}
          onImported={async () => { await reloadAll(); setShowSettings(false); setView('Dashboard') }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete subscription?"
          body="This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}

      {confirmBulkDelete && (
        <ConfirmDialog
          title={`Delete ${selectedIds.length} subscription${selectedIds.length === 1 ? '' : 's'}?`}
          body="This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setConfirmBulkDelete(false)}
          onConfirm={bulkDelete}
        />
      )}

      {confirmDeleteClient && (
        <ConfirmDialog
          title="Delete client?"
          body="This also deletes all of their subscriptions. This cannot be undone."
          confirmLabel="Delete Client"
          onCancel={() => setConfirmDeleteClient(null)}
          onConfirm={() => handleDeleteClient(confirmDeleteClient)}
        />
      )}
    </div>
  )
}

function ConfirmDialog({ title, body, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
        <p className="text-gray-900 font-semibold mb-2">{title}</p>
        <p className="text-sm text-gray-500 mb-5">{body}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90" style={{ background: '#e1251b' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
