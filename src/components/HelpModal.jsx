import { useState, useEffect } from 'react'
import { isTauri } from '../data/db'

const SECTIONS = [
  {
    title: 'The three tabs',
    items: [
      ['Dashboard', 'Overview across everything — totals, upcoming renewals, spend by category/owner, and a 12-month spend chart.'],
      ['My Subs', 'Just your personal subscriptions, with search, filters, sort, and bulk actions.'],
      ['Clients', 'Your client roster — open a client to manage their subscriptions and see their own dashboard.'],
    ],
  },
  {
    title: 'Adding a subscription (+ Add)',
    items: [
      ['Type', 'Subscription, Lifetime (one-time), Trial, or Revenue.'],
      ['Owner', 'Me (Personal) or a client — defaults to the client when added from their page.'],
      ['Lifetime tip', 'Add a "comparable monthly plan" price to see when it pays for itself.'],
    ],
  },
  {
    title: 'Card actions',
    items: [
      ['Edit · Pause/Resume · Duplicate · Delete', 'On every card.'],
      ['View payment history', 'Computed billing history with total paid to date.'],
    ],
  },
  {
    title: 'Bulk actions (My Subs)',
    items: [['Select', 'Tick multiple subs, then Pause, Resume, Add Tag, or Delete them all at once.']],
  },
  {
    title: 'Alerts (bell icon)',
    items: [
      ['Renewal reminders', 'Choose how many days ahead (1/3/7/14/30) to be warned.'],
      ['Notifications & Launch at login', 'Fire reminders in the background via the tray.'],
    ],
  },
  {
    title: 'Settings (gear icon)',
    items: [
      ['Base currency', 'All totals convert to it; each sub keeps its own currency.'],
      ['Backup / Restore', 'Export full JSON backup, export CSV, or import a backup.'],
      ['Updates', 'Check for updates manually anytime.'],
    ],
  },
  {
    title: 'Tray & data',
    items: [
      ['Close to tray', 'Closing the window keeps it running so alerts work — right-click the tray → Quit to fully exit.'],
      ['Your data is local', 'Stored only on this computer. Export a backup regularly.'],
    ],
  },
]

export default function HelpModal({ onClose }) {
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (!isTauri()) return
    ;(async () => {
      try {
        const { getVersion } = await import('@tauri-apps/api/app')
        setAppVersion(await getVersion())
      } catch { /* ignore */ }
    })()
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img src="/mits-logo.svg" alt="MITS" className="h-6" />
            <div>
              <h2 className="text-base font-semibold text-gray-900 leading-tight">SubTracker Help</h2>
              <p className="text-xs text-gray-400">How everything works</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-7 h-7 flex items-center justify-center">×</button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {SECTIONS.map((sec) => (
            <div key={sec.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#e1251b' }}>{sec.title}</h3>
              <ul className="space-y-1.5">
                {sec.items.map(([label, desc]) => (
                  <li key={label} className="text-sm">
                    <span className="font-medium text-gray-800">{label}</span>
                    <span className="text-gray-500"> — {desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            MITS SubTracker{appVersion ? ` v${appVersion}` : ''} · © Menozzi IT Solutions
          </p>
        </div>
      </div>
    </div>
  )
}
