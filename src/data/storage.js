const KEY = 'subscription-tracker-v1'

export function loadSubscriptions() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveSubscriptions(subs) {
  localStorage.setItem(KEY, JSON.stringify(subs))
}
