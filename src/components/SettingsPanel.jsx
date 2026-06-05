import { useState, useEffect } from 'react'
import { exportJSON, exportCSV, pickJSONFile, importJSON } from '../data/backup'
import { CURRENCIES, DEFAULT_RATES } from '../data/currency'
import { isTauri } from '../data/db'

export default function SettingsPanel({ clients, baseCurrency, rates, onSaveCurrency, onCheckUpdates, onClose, onImported }) {
  const [updateMsg, setUpdateMsg] = useState('')
  const [checking, setChecking] = useState(false)
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    if (!isTauri()) return
    ;(async () => {
      try {
        const { getVersion } = await import('@tauri-apps/api/app')
        setAppVersion(await getVersion())
      } catch { /* ignore */ }
    })()
  }, [])

  async function handleCheckUpdates() {
    setChecking(true); setUpdateMsg('')
    try { setUpdateMsg(await onCheckUpdates()) } catch { setUpdateMsg('Could not check for updates.') } finally { setChecking(false) }
  }

  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [confirmImport, setConfirmImport] = useState(null)
  const [base, setBase] = useState(baseCurrency)
  const [rateDraft, setRateDraft] = useState({ ...DEFAULT_RATES, ...rates })
  const [savedMsg, setSavedMsg] = useState('')

  function saveCurrency() {
    const cleaned = {}
    for (const c of CURRENCIES) cleaned[c] = parseFloat(rateDraft[c]) || DEFAULT_RATES[c]
    onSaveCurrency(base, cleaned)
    setSavedMsg('Saved')
    setTimeout(() => setSavedMsg(''), 1500)
  }

  async function handleExportJSON() {
    setBusy('json'); setError('')
    try { await exportJSON() } catch (e) { setError(e.message) } finally { setBusy('') }
  }
  async function handleExportCSV() {
    setBusy('csv'); setError('')
    try { await exportCSV(clients) } catch (e) { setError(e.message) } finally { setBusy('') }
  }
  async function handlePickImport() {
    setError('')
    try {
      const data = await pickJSONFile()
      const subCount = data.subscriptions?.length ?? 0
      const clientCount = data.clients?.length ?? 0
      setConfirmImport({ data, subCount, clientCount })
    } catch (e) {
      if (e.message !== 'No file selected') setError(e.message)
    }
  }
  async function doImport() {
    setBusy('import'); setError('')
    try {
      await importJSON(confirmImport.data)
      setConfirmImport(null)
      onImported()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-base font-semibold text-gray-900">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-7 h-7 flex items-center justify-center">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Currency */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Currency</p>
            <label className="block text-sm text-gray-600 mb-1">Base currency (totals shown in this)</label>
            <select value={base} onChange={(e) => setBase(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 mb-3">
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <p className="text-xs text-gray-400 mb-2">Exchange rates (value of 1 unit in USD)</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
              {CURRENCIES.map((c) => (
                <div key={c} className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-gray-600 w-9 flex-shrink-0">{c}</span>
                  <input
                    type="number" step="0.0001" min="0"
                    value={rateDraft[c]}
                    disabled={c === 'USD'}
                    onChange={(e) => setRateDraft((d) => ({ ...d, [c]: e.target.value }))}
                    className="w-full min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
              ))}
            </div>
            <button onClick={saveCurrency} className="w-full text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90" style={{ background: '#e1251b' }}>
              {savedMsg || 'Save Currency Settings'}
            </button>
          </div>

          <div className="border-t border-gray-100" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Backup</p>
            <div className="space-y-2">
              <button onClick={handleExportJSON} disabled={!!busy} className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 text-sm hover:bg-gray-50 disabled:opacity-50">
                <span>
                  <span className="font-medium text-gray-800 block">Export full backup (JSON)</span>
                  <span className="text-xs text-gray-400">Everything: subs, clients, tags, settings</span>
                </span>
                <span style={{ color: '#e1251b' }} className="text-sm font-semibold">{busy === 'json' ? '…' : 'Download'}</span>
              </button>
              <button onClick={handleExportCSV} disabled={!!busy} className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 text-sm hover:bg-gray-50 disabled:opacity-50">
                <span>
                  <span className="font-medium text-gray-800 block">Export subscriptions (CSV)</span>
                  <span className="text-xs text-gray-400">Spreadsheet-friendly, all owners</span>
                </span>
                <span style={{ color: '#e1251b' }} className="text-sm font-semibold">{busy === 'csv' ? '…' : 'Download'}</span>
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Restore</p>
            <button onClick={handlePickImport} disabled={!!busy} className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 text-sm hover:bg-gray-50 disabled:opacity-50">
              <span>
                <span className="font-medium text-gray-800 block">Import from backup (JSON)</span>
                <span className="text-xs text-gray-400">Replaces all current data</span>
              </span>
              <span style={{ color: '#e1251b' }} className="text-sm font-semibold">Choose file</span>
            </button>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {isTauri() && onCheckUpdates && (
            <>
              <div className="border-t border-gray-100" />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">App Updates</p>
                <button onClick={handleCheckUpdates} disabled={checking} className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 text-sm hover:bg-gray-50 disabled:opacity-50">
                  <span className="font-medium text-gray-800">Check for updates</span>
                  <span style={{ color: '#e1251b' }} className="text-sm font-semibold">{checking ? 'Checking…' : 'Check'}</span>
                </button>
                {updateMsg && <p className="text-xs text-gray-500 mt-2">{updateMsg}</p>}
              </div>
            </>
          )}

          <p className="text-center text-xs text-gray-300 pt-2">
            MITS SubTracker{appVersion ? ` v${appVersion}` : ''}
          </p>
        </div>
      </div>

      {confirmImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <p className="text-gray-900 font-semibold mb-2">Replace all data?</p>
            <p className="text-sm text-gray-500 mb-5">
              This will import <b>{confirmImport.subCount}</b> subscription{confirmImport.subCount === 1 ? '' : 's'} and <b>{confirmImport.clientCount}</b> client{confirmImport.clientCount === 1 ? '' : 's'}, replacing everything currently stored. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmImport(null)} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={doImport} disabled={busy === 'import'} className="flex-1 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60" style={{ background: '#e1251b' }}>
                {busy === 'import' ? 'Importing…' : 'Replace & Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
