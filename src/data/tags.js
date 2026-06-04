const TAGS_KEY = 'subtracker-tags-v1'

export const DEFAULT_TAGS = [
  'Personal', 'Business', 'Family', 'Essential', 'Nice-to-Have',
  'Annual Deal', 'Free Tier', 'Work Expense', 'Shared', 'Auto-Renew',
]

export function loadTags() {
  try {
    const raw = localStorage.getItem(TAGS_KEY)
    return raw ? JSON.parse(raw) : [...DEFAULT_TAGS]
  } catch {
    return [...DEFAULT_TAGS]
  }
}

export function saveTags(tags) {
  localStorage.setItem(TAGS_KEY, JSON.stringify(tags))
}
