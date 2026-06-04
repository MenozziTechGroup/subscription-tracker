// Dual-mode data layer.
// - In the Tauri desktop app: uses SQLite via tauri-plugin-sql.
// - In a plain browser (Vite preview): falls back to localStorage so the
//   web preview keeps working for fast iteration.

let _db = null
let _loadPromise = null

export function isTauri() {
  return typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__
}

export async function getDb() {
  if (!isTauri()) return null
  if (_db) return _db
  if (!_loadPromise) {
    _loadPromise = (async () => {
      const { default: Database } = await import('@tauri-apps/plugin-sql')
      _db = await Database.load('sqlite:subtracker.db')
      return _db
    })()
  }
  return _loadPromise
}

// ---- localStorage helpers (browser fallback) ----

export function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function lsSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ---- row <-> app object mappers (SQLite is snake_case + 0/1 ints) ----

export function rowToSub(r) {
  return {
    id: r.id,
    clientId: r.client_id ?? null,
    name: r.name,
    amount: r.amount,
    currency: r.currency,
    cycle: r.cycle,
    category: r.category,
    type: r.type,
    startDate: r.start_date,
    url: r.url ?? '',
    paymentMethod: r.payment_method ?? 'Not Specified',
    tags: safeParseArray(r.tags),
    notes: r.notes ?? '',
    active: !!r.active,
    recurring: !!r.recurring,
    monthlyEquivalent: r.monthly_equivalent ?? null,
  }
}

export function rowToClient(r) {
  return {
    id: r.id,
    name: r.name,
    company: r.company ?? '',
    email: r.email ?? '',
    phone: r.phone ?? '',
    notes: r.notes ?? '',
  }
}

function safeParseArray(v) {
  if (Array.isArray(v)) return v
  try {
    const parsed = JSON.parse(v ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
