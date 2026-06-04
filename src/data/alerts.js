import { isTauri } from './db'

const ALERTS_KEY = 'subtracker-alerts-v1'

export const DEFAULT_ALERT_SETTINGS = {
  enabled: false,
  daysBeforeRenewal: [1, 3, 7],
  browserNotifications: false,
}

// Kept for the browser fallback / legacy reads; primary storage is now the
// settings table via repo (key 'alerts').
export function loadAlertSettings() {
  try {
    const raw = localStorage.getItem(ALERTS_KEY)
    return raw ? { ...DEFAULT_ALERT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_ALERT_SETTINGS }
  } catch {
    return { ...DEFAULT_ALERT_SETTINGS }
  }
}

export function saveAlertSettings(settings) {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(settings))
}

export async function requestNotificationPermission() {
  if (isTauri()) {
    try {
      const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification')
      if (await isPermissionGranted()) return 'granted'
      const perm = await requestPermission()
      return perm // 'granted' | 'denied' | 'default'
    } catch {
      return 'unsupported'
    }
  }
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

export async function sendBrowserNotification(title, body) {
  if (isTauri()) {
    try {
      const { isPermissionGranted, requestPermission, sendNotification } =
        await import('@tauri-apps/plugin-notification')
      let granted = await isPermissionGranted()
      if (!granted) granted = (await requestPermission()) === 'granted'
      if (granted) sendNotification({ title, body })
    } catch {
      /* notifications unavailable */
    }
    return
  }
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  new Notification(title, { body, icon: '/mits-logo.svg' })
}
