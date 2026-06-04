import { useState, useEffect, useRef } from 'react'
import { CATEGORIES } from '../data/categories'

const CYCLES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

const CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'AUD']

const PAYMENT_METHODS = [
  'Not Specified', 'Credit Card', 'Debit Card', 'PayPal',
  'Venmo', 'CashApp', 'Zelle', 'ACH', 'Other',
]

const SUB_TYPES = [
  { value: 'subscription', label: 'Subscription' },
  { value: 'lifetime', label: 'Lifetime' },
  { value: 'trial', label: 'Trial' },
  { value: 'revenue', label: 'Revenue' },
]

const empty = {
  name: '',
  amount: '',
  currency: 'USD',
  cycle: 'monthly',
  category: 'other',
  type: 'subscription',
  clientId: null,
  monthlyEquivalent: '',
  startDate: new Date().toISOString().slice(0, 10),
  url: '',
  paymentMethod: 'Not Specified',
  tags: [],
  notes: '',
  active: true,
  recurring: true,
}

export default function SubscriptionModal({ sub, onSave, onClose, allTags, onAddTag, clients = [], defaultClientId = null, prefill = null }) {
  const [form, setForm] = useState(
    sub ? { ...empty, ...sub } : { ...empty, clientId: defaultClientId ?? null, ...(prefill ?? {}) }
  )
  const [errors, setErrors] = useState({})
  const [tagInput, setTagInput] = useState('')
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const tagRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    function handleClick(e) {
      if (tagRef.current && !tagRef.current.contains(e.target)) setTagDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function toggleTag(tag) {
    set('tags', form.tags.includes(tag) ? form.tags.filter((t) => t !== tag) : [...form.tags, tag])
  }

  function addNewTag() {
    const t = tagInput.trim()
    if (!t) return
    if (!allTags.includes(t)) onAddTag(t)
    if (!form.tags.includes(t)) set('tags', [...form.tags, t])
    setTagInput('')
    setTagDropdownOpen(false)
  }

  const filteredTags = allTags.filter(
    (t) => t.toLowerCase().includes(tagInput.toLowerCase())
  )

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) < 0)
      errs.amount = 'Enter a valid amount'
    if (!form.startDate) errs.startDate = 'Start date is required'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) return setErrors(errs)
    onSave({
      ...form,
      amount: parseFloat(form.amount),
      monthlyEquivalent: form.monthlyEquivalent !== '' && form.monthlyEquivalent != null
        ? parseFloat(form.monthlyEquivalent) : null,
      id: form.id ?? crypto.randomUUID(),
    })
  }

  const isLifetime = form.type === 'lifetime'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-base font-semibold text-gray-900">
            {sub ? 'Edit Subscription' : 'Add Subscription'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-7 h-7 flex items-center justify-center">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {SUB_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set('type', t.value)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.type === t.value
                      ? 'text-white border-transparent'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                  }`}
                  style={form.type === t.value ? { background: '#e1251b', borderColor: '#e1251b' } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Owner */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Owner</label>
            <select
              value={form.clientId ?? ''}
              onChange={(e) => set('clientId', e.target.value || null)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="">Me (Personal)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` — ${c.company}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Service Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Netflix, Spotify"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.name ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-red-200'}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Website URL</label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => set('url', e.target.value)}
              placeholder="https://example.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>

          {/* Amount + Currency */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Amount *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="0.00"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.amount ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-red-200'}`}
              />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>
            <div className="w-28">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Billing Cycle — hidden for lifetime */}
          {!isLifetime && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Billing Cycle</label>
              <div className="grid grid-cols-4 gap-2">
                {CYCLES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => set('cycle', c.value)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                      form.cycle === c.value
                        ? 'text-white border-transparent'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                    }`}
                    style={form.cycle === c.value ? { background: '#e1251b', borderColor: '#e1251b' } : {}}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recurring toggle — hidden for lifetime */}
          {!isLifetime && (
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-gray-700">Recurring</p>
                <p className="text-xs text-gray-400">Auto-renews each billing cycle</p>
              </div>
              <button
                type="button"
                onClick={() => set('recurring', !form.recurring)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0`}
                style={{ background: form.recurring ? '#e1251b' : '#d1d5db' }}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${form.recurring ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {isLifetime ? 'Purchase Date' : 'Start / Next Billing Date'} *
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.startDate ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-red-200'}`}
            />
            {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
          </div>

          {/* Comparable monthly (lifetime only, for break-even) */}
          {isLifetime && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Comparable Monthly Plan (optional)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.monthlyEquivalent ?? ''}
                onChange={(e) => set('monthlyEquivalent', e.target.value)}
                placeholder="e.g. 9.99 — the monthly price you'd otherwise pay"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <p className="text-xs text-gray-400 mt-1">Used to calculate when this lifetime purchase pays for itself.</p>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Payment Method</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => set('paymentMethod', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>

          {/* Tags */}
          <div ref={tagRef}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tags</label>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ background: '#e1251b' }}
                  >
                    {tag}
                    <button type="button" onClick={() => toggleTag(tag)} className="hover:opacity-70 leading-none">&times;</button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => { setTagInput(e.target.value); setTagDropdownOpen(true) }}
                onFocus={() => setTagDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addNewTag() }
                }}
                placeholder="Search or create a tag..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              {tagDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredTags.filter((t) => !form.tags.includes(t)).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => { toggleTag(tag); setTagInput(''); setTagDropdownOpen(false) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                    >
                      {tag}
                    </button>
                  ))}
                  {tagInput.trim() && !allTags.includes(tagInput.trim()) && (
                    <button
                      type="button"
                      onClick={addNewTag}
                      className="w-full text-left px-3 py-2 text-sm font-medium border-t border-gray-100"
                      style={{ color: '#e1251b' }}
                    >
                      + Create "{tagInput.trim()}"
                    </button>
                  )}
                  {filteredTags.filter((t) => !form.tags.includes(t)).length === 0 && !tagInput.trim() && (
                    <p className="px-3 py-2 text-xs text-gray-400">All tags selected</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="e.g. family plan, trial ends..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-gray-700">Status</p>
              <p className="text-xs text-gray-400">{form.active ? 'Active and tracking' : 'Paused — not counting toward totals'}</p>
            </div>
            <button
              type="button"
              onClick={() => set('active', !form.active)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
              style={{ background: form.active ? '#e1251b' : '#d1d5db' }}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${form.active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors hover:opacity-90"
              style={{ background: '#e1251b' }}
            >
              {sub ? 'Save Changes' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
