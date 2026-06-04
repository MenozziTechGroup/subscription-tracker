import { getDb, isTauri, lsGet, lsSet, rowToSub, rowToClient } from './db'

const LS_SUBS = 'subscription-tracker-v1'
const LS_CLIENTS = 'subtracker-clients-v1'
const LS_TAGS = 'subtracker-tags-v1'
const LS_SETTINGS = 'subtracker-settings-v1'

const uid = () => crypto.randomUUID()

// ============================================================
// SUBSCRIPTIONS
// ============================================================

export async function getSubscriptions() {
  if (isTauri()) {
    const db = await getDb()
    const rows = await db.select('SELECT * FROM subscriptions ORDER BY created_at ASC')
    return rows.map(rowToSub)
  }
  return lsGet(LS_SUBS, [])
}

export async function createSubscription(sub) {
  const record = { ...sub, id: sub.id ?? uid() }
  if (isTauri()) {
    const db = await getDb()
    await db.execute(
      `INSERT INTO subscriptions
       (id, client_id, name, amount, currency, cycle, category, type, start_date, url, payment_method, tags, notes, active, recurring, monthly_equivalent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        record.id, record.clientId ?? null, record.name, record.amount, record.currency,
        record.cycle, record.category, record.type, record.startDate, record.url ?? '',
        record.paymentMethod ?? 'Not Specified', JSON.stringify(record.tags ?? []),
        record.notes ?? '', record.active ? 1 : 0, record.recurring ? 1 : 0,
        record.monthlyEquivalent ?? null,
      ]
    )
  } else {
    const all = lsGet(LS_SUBS, [])
    lsSet(LS_SUBS, [...all, record])
  }
  return record
}

export async function updateSubscription(sub) {
  if (isTauri()) {
    const db = await getDb()
    await db.execute(
      `UPDATE subscriptions SET
        client_id=$2, name=$3, amount=$4, currency=$5, cycle=$6, category=$7, type=$8,
        start_date=$9, url=$10, payment_method=$11, tags=$12, notes=$13, active=$14, recurring=$15,
        monthly_equivalent=$16
       WHERE id=$1`,
      [
        sub.id, sub.clientId ?? null, sub.name, sub.amount, sub.currency, sub.cycle,
        sub.category, sub.type, sub.startDate, sub.url ?? '',
        sub.paymentMethod ?? 'Not Specified', JSON.stringify(sub.tags ?? []),
        sub.notes ?? '', sub.active ? 1 : 0, sub.recurring ? 1 : 0,
        sub.monthlyEquivalent ?? null,
      ]
    )
  } else {
    const all = lsGet(LS_SUBS, [])
    lsSet(LS_SUBS, all.map((s) => (s.id === sub.id ? sub : s)))
  }
  return sub
}

export async function deleteSubscription(id) {
  if (isTauri()) {
    const db = await getDb()
    await db.execute('DELETE FROM subscriptions WHERE id=$1', [id])
  } else {
    const all = lsGet(LS_SUBS, [])
    lsSet(LS_SUBS, all.filter((s) => s.id !== id))
  }
}

// ============================================================
// CLIENTS
// ============================================================

export async function getClients() {
  if (isTauri()) {
    const db = await getDb()
    const rows = await db.select('SELECT * FROM clients ORDER BY name ASC')
    return rows.map(rowToClient)
  }
  return lsGet(LS_CLIENTS, [])
}

export async function createClient(client) {
  const record = { ...client, id: client.id ?? uid() }
  if (isTauri()) {
    const db = await getDb()
    await db.execute(
      `INSERT INTO clients (id, name, company, email, phone, notes)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [record.id, record.name, record.company ?? '', record.email ?? '', record.phone ?? '', record.notes ?? '']
    )
  } else {
    const all = lsGet(LS_CLIENTS, [])
    lsSet(LS_CLIENTS, [...all, record])
  }
  return record
}

export async function updateClient(client) {
  if (isTauri()) {
    const db = await getDb()
    await db.execute(
      `UPDATE clients SET name=$2, company=$3, email=$4, phone=$5, notes=$6 WHERE id=$1`,
      [client.id, client.name, client.company ?? '', client.email ?? '', client.phone ?? '', client.notes ?? '']
    )
  } else {
    const all = lsGet(LS_CLIENTS, [])
    lsSet(LS_CLIENTS, all.map((c) => (c.id === client.id ? client : c)))
  }
  return client
}

export async function deleteClient(id) {
  if (isTauri()) {
    const db = await getDb()
    // Explicit cascade (don't rely on PRAGMA foreign_keys being enabled).
    await db.execute('DELETE FROM subscriptions WHERE client_id=$1', [id])
    await db.execute('DELETE FROM clients WHERE id=$1', [id])
  } else {
    lsSet(LS_CLIENTS, lsGet(LS_CLIENTS, []).filter((c) => c.id !== id))
    lsSet(LS_SUBS, lsGet(LS_SUBS, []).filter((s) => s.clientId !== id))
  }
}

// ============================================================
// TAGS
// ============================================================

export async function getTags() {
  if (isTauri()) {
    const db = await getDb()
    const rows = await db.select('SELECT name FROM tags ORDER BY name ASC')
    return rows.map((r) => r.name)
  }
  return lsGet(LS_TAGS, [])
}

export async function addTag(name) {
  if (isTauri()) {
    const db = await getDb()
    await db.execute('INSERT OR IGNORE INTO tags (id, name) VALUES ($1,$2)', [uid(), name])
  } else {
    const all = lsGet(LS_TAGS, [])
    if (!all.includes(name)) lsSet(LS_TAGS, [...all, name])
  }
}

// ============================================================
// SETTINGS (key/value JSON)
// ============================================================

export async function getSetting(key, fallback = null) {
  if (isTauri()) {
    const db = await getDb()
    const rows = await db.select('SELECT value FROM settings WHERE key=$1', [key])
    if (!rows.length) return fallback
    try { return JSON.parse(rows[0].value) } catch { return fallback }
  }
  const all = lsGet(LS_SETTINGS, {})
  return key in all ? all[key] : fallback
}

export async function setSetting(key, value) {
  if (isTauri()) {
    const db = await getDb()
    await db.execute(
      `INSERT INTO settings (key, value) VALUES ($1,$2)
       ON CONFLICT(key) DO UPDATE SET value=$2`,
      [key, JSON.stringify(value)]
    )
  } else {
    const all = lsGet(LS_SETTINGS, {})
    all[key] = value
    lsSet(LS_SETTINGS, all)
  }
}

// ============================================================
// BACKUP / RESTORE
// ============================================================

export async function getAllData() {
  const [subscriptions, clients, tags, alerts, baseCurrency, rates] = await Promise.all([
    getSubscriptions(), getClients(), getTags(),
    getSetting('alerts', null), getSetting('baseCurrency', null), getSetting('rates', null),
  ])
  return {
    app: 'MITS SubTracker',
    version: 1,
    subscriptions,
    clients,
    tags,
    settings: { alerts, baseCurrency, rates },
  }
}

export async function replaceAllData(data) {
  const subscriptions = Array.isArray(data.subscriptions) ? data.subscriptions : []
  const clients = Array.isArray(data.clients) ? data.clients : []
  const tags = Array.isArray(data.tags) ? data.tags : []
  const settings = data.settings ?? {}

  if (isTauri()) {
    const db = await getDb()
    await db.execute('DELETE FROM subscriptions')
    await db.execute('DELETE FROM clients')
    await db.execute('DELETE FROM tags')
    for (const c of clients) await createClient(c)
    for (const s of subscriptions) await createSubscription(s)
    for (const t of tags) await addTag(t)
  } else {
    lsSet(LS_SUBS, subscriptions)
    lsSet(LS_CLIENTS, clients)
    lsSet(LS_TAGS, tags)
  }
  if (settings.alerts != null) await setSetting('alerts', settings.alerts)
  if (settings.baseCurrency != null) await setSetting('baseCurrency', settings.baseCurrency)
  if (settings.rates != null) await setSetting('rates', settings.rates)
}

// ============================================================
// SEED (first run)
// ============================================================

let _seedPromise = null

export async function seedIfEmpty(sampleSubs, defaultTags) {
  // Module-level guard: React StrictMode invokes effects twice in dev, which
  // would otherwise seed concurrently and create duplicates.
  if (_seedPromise) return _seedPromise
  _seedPromise = (async () => {
    // Seed only once, ever. After first run we respect an empty list so the
    // onboarding screen shows for users who intentionally clear their data.
    const alreadySeeded = await getSetting('seeded', false)
    if (alreadySeeded) return
    const tags = await getTags()
    if (tags.length === 0) {
      for (const t of defaultTags) await addTag(t)
    }
    const existing = await getSubscriptions()
    if (existing.length === 0) {
      for (const s of sampleSubs) await createSubscription(s)
    }
    await setSetting('seeded', true)
  })()
  return _seedPromise
}
