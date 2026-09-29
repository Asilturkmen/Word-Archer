import { describe, it, expect } from 'vitest'
import { PACKS, WordSource, MIX, lower } from '../src/lib/words.js'
import { mulberry32 } from '../src/lib/rng.js'

describe('word packs', () => {
  for (const [lang, pack] of Object.entries(PACKS)) {
    it(`${lang}: valid, unique words per tier`, () => {
      const re = lang === 'tr' ? /^[a-zçğıöşü]+$/ : /^[a-z]+$/
      const all = [...pack.easy, ...pack.medium, ...pack.hard]
      expect(new Set(all).size).toBe(all.length)
      for (const w of all) expect(w).toMatch(re)
      for (const w of pack.easy) expect([...w].length).toBeLessThanOrEqual(4)
      for (const w of pack.hard) expect([...w].length).toBeGreaterThanOrEqual(8)
      expect(pack.easy.length).toBeGreaterThan(150)
    })
  }
})

describe('WordSource', () => {
  it('does not repeat a word within the recent window', () => {
    const s = new WordSource({ lang: 'en', rng: mulberry32(1) })
    const words = Array.from({ length: 300 }, (_, i) => s.at(i))
    for (let i = 1; i < words.length; i++) expect(words.slice(Math.max(0, i - 8), i)).not.toContain(words[i])
  })

  it('ramps difficulty from start to end mix', () => {
    const s = new WordSource({ difficulty: 'normal', rampWords: 60 })
    expect(s.mixAt(0)).toEqual(MIX.normal[0])
    expect(s.mixAt(60).map((v) => +v.toFixed(3))).toEqual(MIX.normal[1])
  })

  it('lower() respects Turkish dotted/dotless i', () => {
    expect(lower('IŞIK', 'tr')).toBe('ışık')
    expect(lower('İĞNE', 'tr')).toBe('iğne')
    expect(lower('IRON', 'en')).toBe('iron')
  })
})
