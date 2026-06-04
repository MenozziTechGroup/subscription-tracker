import { getAllData, replaceAllData } from './repo'
import { getCategoryById } from './categories'

function download(filename, text, mime) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export async function exportJSON() {
  const data = await getAllData()
  download(`subtracker-backup-${stamp()}.json`, JSON.stringify(data, null, 2), 'application/json')
}

function csvEscape(v) {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function exportCSV(clients = []) {
  const data = await getAllData()
  const clientName = (id) => (id ? (clients.find((c) => c.id === id)?.name ?? 'Unknown') : 'Me (Personal)')
  const headers = ['Name', 'Owner', 'Type', 'Amount', 'Currency', 'Cycle', 'Category', 'Payment Method', 'Start Date', 'Active', 'Recurring', 'Tags', 'URL', 'Notes']
  const rows = data.subscriptions.map((s) => [
    s.name, clientName(s.clientId), s.type, s.amount, s.currency, s.cycle,
    getCategoryById(s.category).label, s.paymentMethod, s.startDate,
    s.active ? 'Yes' : 'No', s.recurring ? 'Yes' : 'No',
    (s.tags ?? []).join('; '), s.url, s.notes,
  ])
  const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n')
  download(`subtracker-subscriptions-${stamp()}.csv`, csv, 'text/csv')
}

export function pickJSONFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return reject(new Error('No file selected'))
      const reader = new FileReader()
      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result))
        } catch {
          reject(new Error('Invalid JSON file'))
        }
      }
      reader.onerror = () => reject(new Error('Could not read file'))
      reader.readAsText(file)
    }
    input.click()
  })
}

export async function importJSON(data) {
  if (!data || (!Array.isArray(data.subscriptions) && !Array.isArray(data.clients))) {
    throw new Error('This does not look like a SubTracker backup file.')
  }
  await replaceAllData(data)
}
