// Opsiyonel global sıralama (Supabase REST / PostgREST — SDK bağımlılığı yok).
// VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımlı değilse tamamen kapalıdır
// ve oyun yalnızca yerel rekorlarla çalışır. Şema: supabase/schema.sql
const URL_ = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const onlineEnabled = Boolean(URL_ && KEY)

const headers = () => ({
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
})

async function request(path, body, signal) {
  const minimal = !path.startsWith('rpc/')
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    method: 'POST',
    headers: minimal ? { ...headers(), Prefer: 'return=minimal' } : headers(),
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// Sunucudaki CHECK kısıtlarıyla aynı sınırlar; makul olmayan skorlar hiç gönderilmez.
export function isSubmittable(run) {
  return (
    run.ranked && run.score > 0 && run.wpm <= 250 &&
    (run.mode === 'survival' || run.endReason === 'time')
  )
}

export async function submitScore(run, name) {
  if (!onlineEnabled || !isSubmittable(run)) return false
  await request('scores', {
    name,
    mode: run.mode,
    duration: run.duration,
    difficulty: run.difficulty,
    lang: run.lang,
    score: run.score,
    wpm: run.wpm,
    accuracy: run.acc,
    kills: run.kills,
    seed: run.mode === 'daily' ? run.dailyKey : null,
  })
  return true
}

// period: 'all' | 'week'
export async function fetchTop({ mode, duration, difficulty = 'normal', lang, period = 'all', dailyKey = null, limit = 20 }, signal) {
  if (!onlineEnabled) return []
  const since = period === 'week' ? new Date(Date.now() - 7 * 864e5).toISOString() : null
  const rows = await request('rpc/top_scores', {
    p_mode: mode,
    p_duration: mode === 'classic' ? duration : mode === 'daily' ? 60 : 0,
    p_difficulty: mode === 'daily' ? 'normal' : difficulty,
    p_lang: lang,
    p_since: since,
    p_seed: mode === 'daily' ? dailyKey : null,
    p_limit: limit,
  }, signal)
  return Array.isArray(rows) ? rows : []
}
