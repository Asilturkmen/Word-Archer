import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const run = {
  mode: 'daily', duration: 60, difficulty: 'normal', lang: 'tr', dailyKey: '2026-09-29',
  ranked: true, score: 1234, wpm: 55, acc: 97.5, kills: 6, endReason: 'time',
}

describe('online leaderboard client', () => {
  let online, calls
  beforeEach(async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://demo.supabase.co/')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')
    vi.resetModules()
    calls = []
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      calls.push({ url, init, body: JSON.parse(init.body) })
      const rows = url.includes('/rpc/') ? [{ name: 'Okçu', score: 10, wpm: 40, accuracy: 95.5, created_at: '2026-09-29T10:00:00Z' }] : null
      return { ok: true, status: 200, text: async () => (rows ? JSON.stringify(rows) : '') }
    }))
    online = await import('../src/lib/online.js')
  })
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it('is enabled when both env vars are set', () => {
    expect(online.onlineEnabled).toBe(true)
  })

  it('posts a score matching the table columns', async () => {
    await online.submitScore(run, 'Okçu')
    const c = calls[0]
    expect(c.url).toBe('https://demo.supabase.co/rest/v1/scores')
    expect(c.init.headers.apikey).toBe('anon-key')
    expect(c.init.headers.Prefer).toBe('return=minimal')
    expect(c.body).toEqual({
      name: 'Okçu', mode: 'daily', duration: 60, difficulty: 'normal', lang: 'tr',
      score: 1234, wpm: 55, accuracy: 97.5, kills: 6, seed: '2026-09-29',
    })
  })

  it('calls top_scores with the SQL function parameter names', async () => {
    const rows = await online.fetchTop({ mode: 'classic', duration: 30, lang: 'en', period: 'week' })
    const c = calls[0]
    expect(c.url).toBe('https://demo.supabase.co/rest/v1/rpc/top_scores')
    expect(Object.keys(c.body).sort()).toEqual(['p_difficulty', 'p_duration', 'p_lang', 'p_limit', 'p_mode', 'p_seed', 'p_since'])
    expect(c.body.p_difficulty).toBe('normal')
    expect(c.body.p_duration).toBe(30)
    expect(c.body.p_seed).toBeNull()
    expect(typeof c.body.p_since).toBe('string')
    expect(c.init.headers.Prefer).toBeUndefined()
    expect(rows[0].name).toBe('Okçu')
  })

  it('uses duration 0 for survival and the date seed for daily', async () => {
    await online.fetchTop({ mode: 'survival', duration: 60, lang: 'en' })
    await online.fetchTop({ mode: 'daily', duration: 15, difficulty: 'hard', lang: 'tr', dailyKey: '2026-09-29' })
    expect(calls[0].body.p_duration).toBe(0)
    expect(calls[1].body.p_duration).toBe(60)
    expect(calls[1].body.p_seed).toBe('2026-09-29')
    expect(calls[1].body.p_difficulty).toBe('normal')
  })

  it('never submits unranked, quit or implausible runs', async () => {
    expect(await online.submitScore({ ...run, ranked: false }, 'x')).toBe(false)
    expect(await online.submitScore({ ...run, mode: 'classic', endReason: 'quit' }, 'x')).toBe(false)
    expect(await online.submitScore({ ...run, wpm: 400 }, 'x')).toBe(false)
    expect(await online.submitScore({ ...run, score: 0 }, 'x')).toBe(false)
    expect(calls.length).toBe(0)
  })
})
