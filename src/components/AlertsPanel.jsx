import { useState, useEffect } from 'react'
import { requestNotificationPermission } from '../data/alerts'
import { isTauri } from '../data/db'

const DAY_OPTIONS = [1, 3, 7, 14, 30]

export default function AlertsPanel({ settings, onSave, onClose }) {
  const [local, setLocal] = useState({ ...settings })
  const [permStatus, setPermStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const [autostart, setAutostart] = useState(false)
  const [autostartReady, setAutostartReady] = useState(false)

  useEffect(() => {
    if (!isTauri()) return
    ;(async () => {
      try {
        const { isEnabled } = await import('@tauri-apps/plugin-autostart')
        setAutostart(await isEnabled())
        setAutostartReady(true)
      } catch {
        setAutostartReady(false)
      }
    })()
  }, [])

  async function toggleAutostart() {
    try {
      const { enable, disable } = await import('@tauri-apps/plugin-autostart')
      if (autostart) { await disable(); setAutostart(false) }
      else { await enable(); setAutostart(true) }
    } catch {
      /* autostart unavailable */
    }
  }

  function toggleDay(d) {
    const days = local.daysBeforeRenewal.includes(d)
      ? local.daysBeforeRenewal.filter((x) => x !== d)
      : [...local.daysBeforeRenewal, d].sort((a, b) => a - b)
    setLocal((s) => ({ ...s, daysBeforeRenewal: days }))
  }

  async function handleBrowserToggle() {
    if (!local.browserNotifications) {
      const result = await requestNotificationPermission()
      setPermStatus(result)
      if (result === 'granted') {
        setLocal((s) => ({ ...s, browserNotifications: true }))
      }
    } else {
      setLocal((s) => ({ ...s, browserNotifications: false }))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Alert Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-7 h-7 flex items-center justify-center">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Master toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Enable Alerts</p>
              <p className="text-xs text-gray-400">Show renewal reminders in the app</p>
            </div>
            <button
              onClick={() => setLocal((s) => ({ ...s, enabled: !s.enabled }))}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{ background: local.enabled ? '#e1251b' : '#d1d5db' }}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${local.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {local.enabled && (
            <>
              {/* Days before */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Alert me this many days before renewal</p>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => toggleDay(d)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors`}
                      style={
                        local.daysBeforeRenewal.includes(d)
                          ? { background: '#e1251b', borderColor: '#e1251b', color: '#fff' }
                          : { background: '#fff', borderColor: '#e5e7eb', color: '#374151' }
                      }
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Browser notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Browser Notifications</p>
                  <p className="text-xs text-gray-400">
                    {permStatus === 'unsupported' ? 'Not supported in this browser'
                      : permStatus === 'denied' ? 'Blocked — check browser settings'
                      : 'Notify even when app is in background'}
                  </p>
                </div>
                <button
                  onClick={handleBrowserToggle}
                  disabled={permStatus === 'unsupported' || permStatus === 'denied'}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40"
                  style={{ background: local.browserNotifications ? '#e1251b' : '#d1d5db' }}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${local.browserNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </>
          )}

          {isTauri() && autostartReady && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">Launch at login</p>
                <p className="text-xs text-gray-400">Runs in the tray so renewal alerts fire in the background</p>
              </div>
              <button
                onClick={toggleAutostart}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                style={{ background: autostart ? '#e1251b' : '#d1d5db' }}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${autostart ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => { onSave(local); onClose() }}
              className="flex-1 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition-colors"
              style={{ background: '#e1251b' }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
