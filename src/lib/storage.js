// Kalıcı yerel veri (profil, ayarlar, geçmiş, rekorlar, başarımlar).
// Tüm erişimler try/catch içinde: gizli sekme / engelli depolama oyunu bozmaz.
export const STORAGE_KEY = 'word-archer:v2'
const KEY = STORAGE_KEY
const MAX_HISTORY = 200

export const DEFAULT_SETTINGS = {
  lang: null, // null -> tarayıcı dilinden seç
  volume: 0.7,
  muted: false,
  liveWpm: true,
  shake: true,
  reduceMotion: null, // null -> işletim sistemi tercihini izle
  mode: 'classic',
  duration: 60,
  difficulty: 'normal',
}

function randomName(lang) {
  return (lang === 'tr' ? 'Okçu' : 'Archer') + Math.floor(1000 + Math.random() * 9000)
}

export function detectLang() {
  try {
    const l = (navigator.languages && navigator.languages[0]) || navigator.language || 'en'
    return l.toLowerCase().startsWith('tr') ? 'tr' : 'en'
  } catch { return 'en' }
}

function read(key) {
  try { return localStorage.getItem(key) } catch { return null }
}

export function loadData() {
  let data = null
  try { data = JSON.parse(read(KEY) || 'null') } catch { data = null }
  if (!data || typeof data !== 'object') data = {}
  const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) }

  // v1 (tek dosyalık prototip) verisinden taşı
  if (!data.migrated) {
    const oldLang = read('wg_lang')
    const oldUser = read('wg_user')
    if (oldLang && !settings.lang) settings.lang = oldLang === 'tr' ? 'tr' : 'en'
    if (oldUser && !data.profile) data.profile = { name: sanitizeName(oldUser) || null }
  }
  if (!settings.lang) settings.lang = detectLang()

  const profile = { name: null, ...(data.profile || {}) }
  if (!profile.name) profile.name = randomName(settings.lang)

  return {
    settings,
    profile,
    history: Array.isArray(data.history) ? data.history : [],
    achievements: data.achievements && typeof data.achievements === 'object' ? data.achievements : {},
    seenHelp: !!data.seenHelp,
    migrated: true,
  }
}

export function saveData(data) {
  try {
    const trimmed = { ...data, history: data.history.slice(-MAX_HISTORY) }
    localStorage.setItem(KEY, JSON.stringify(trimmed))
    return true
  } catch { return false }
}

export function clearData() {
  try {
    localStorage.removeItem(KEY)
    ;['wg_best', 'wg_user', 'wg_lang'].forEach((k) => localStorage.removeItem(k))
  } catch { /* yoksay */ }
}

export function sanitizeName(s) {
  const n = String(s || '').replace(/[^\p{L}\p{N} _.-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 16)
  return n.length >= 2 ? n : ''
}

// Geçmişte kaydedilecek sade kayıt (grafik örnekleri hariç)
export function toHistoryEntry(run) {
  const { samples, missed, ...rest } = run
  return rest
}

// Aynı "tahtadaki" koşular: mod + süre + zorluk + dil (günlükte tarih + dil).
// Farklı zorluk/dil skorları birbirini geçmesin.
export function boardKey(run) {
  const lang = run.lang || 'en'
  if (run.mode === 'daily') return `daily:${run.dailyKey}:${lang}`
  if (run.mode === 'classic') return `classic:${run.duration}:${run.difficulty || 'normal'}:${lang}`
  return `${run.mode}:${run.difficulty || 'normal'}:${lang}`
}

export function bestFor(history, key) {
  let best = null
  for (const h of history) {
    if (!h.ranked || boardKey(h) !== key) continue
    if (!best || h.score > best.score) best = h
  }
  return best
}

export function totals(history) {
  const t = { games: 0, time: 0, words: 0, kills: 0, bestWpm: 0, avgWpm: 0, avgAcc: 0 }
  for (const h of history) {
    t.games++
    t.time += h.elapsed || 0
    t.words += h.correctWords || 0
    t.kills += h.kills || 0
    if (h.elapsed >= 10000 && h.wpm > t.bestWpm) t.bestWpm = h.wpm
  }
  const recent = history.filter((h) => h.elapsed >= 10000).slice(-10)
  if (recent.length) {
    t.avgWpm = Math.round(recent.reduce((a, h) => a + h.wpm, 0) / recent.length)
    t.avgAcc = Math.round((recent.reduce((a, h) => a + h.acc, 0) / recent.length) * 10) / 10
  }
  return t
}
