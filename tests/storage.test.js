import { describe, it, expect } from 'vitest'
import { sanitizeName, boardKey, bestFor, totals, toHistoryEntry } from '../src/lib/storage.js'
import { newlyUnlocked } from '../src/lib/achievements.js'

const run = (o) => ({
  mode: 'classic', duration: 60, ranked: true, score: 100, wpm: 50, acc: 95, elapsed: 60000,
  kills: 2, correctWords: 30, bestStreak: 12, level: 3, endReason: 'time', date: 1, ...o,
})

describe('storage helpers', () => {
  it('sanitizes nicknames', () => {
    expect(sanitizeName('  Okçu <b>42</b> ')).toBe('Okçu b42b')
    expect(sanitizeName('a')).toBe('')
    expect(sanitizeName('x'.repeat(30)).length).toBe(16)
  })

  it('groups runs into boards and finds the best', () => {
    expect(boardKey(run({ difficulty: 'hard', lang: 'tr' }))).toBe('classic:60:hard:tr')
    expect(boardKey(run({ mode: 'daily', dailyKey: '2026-09-29', lang: 'tr' }))).toBe('daily:2026-09-29:tr')
    expect(boardKey(run({ mode: 'survival', difficulty: 'easy', lang: 'en' }))).toBe('survival:easy:en')
    const base = { difficulty: 'normal', lang: 'en' }
    const h = [
      run({ ...base, score: 5 }), run({ ...base, score: 50 }), run({ ...base, score: 99, ranked: false }),
      run({ ...base, score: 70, duration: 30 }), run({ ...base, score: 80, difficulty: 'easy' }), run({ ...base, score: 90, lang: 'tr' }),
    ]
    expect(bestFor(h, 'classic:60:normal:en').score).toBe(50)
  })

  it('computes totals', () => {
    const t = totals([run({ wpm: 40 }), run({ wpm: 60, kills: 5 }), run({ wpm: 200, elapsed: 3000 })])
    expect(t.games).toBe(3)
    expect(t.bestWpm).toBe(60)
    expect(t.avgWpm).toBe(50)
    expect(t.kills).toBe(9)
  })

  it('drops heavy fields from history entries', () => {
    const e = toHistoryEntry({ ...run({}), samples: [1], missed: [2] })
    expect(e.samples).toBeUndefined()
    expect(e.missed).toBeUndefined()
  })

  it('unlocks achievements once', () => {
    const r = run({ wpm: 65, bestStreak: 26 })
    const ids = newlyUnlocked(r, { games: 1, kills: 2 }, {})
    expect(ids).toEqual(expect.arrayContaining(['first_blood', 'combo_10', 'combo_25', 'wpm_40', 'wpm_60']))
    expect(ids).not.toContain('wpm_80')
    expect(newlyUnlocked(r, { games: 1, kills: 2 }, { first_blood: 1 })).not.toContain('first_blood')
  })
})
