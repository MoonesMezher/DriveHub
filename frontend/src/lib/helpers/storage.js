const PREFIX = 'drivehub_'

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(`${PREFIX}${key}`)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  },

  set(key, value) {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value))
  },

  remove(key) {
    localStorage.removeItem(`${PREFIX}${key}`)
  },

  clear() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  },

  /** Wipe app local/session storage (tokens + drivehub_* keys). */
  clearAll() {
    this.clear()
    try {
      sessionStorage.clear()
    } catch {
      // ignore
    }
  },
}
