import { describe, it, expect } from 'vitest'
import { Game, multiplierFor, nextTierAt, survivalSpeed, REACH_DIST, SPAWN_DIST } from '../src/lib/engine.js'

const typeWord = (g, w = g.target) => { g.input(w); g.input(w + ' ') }
const collect = (g) => {
  const ev = []
  g.subscribe((type, d) => { if (type !== 'change') ev.push([type, d]) })
  return ev
}

describe('combo', () => {
  it('maps streaks to multipliers', () => {
    expect([0, 4, 5, 14, 15, 29, 30, 99].map(multiplierFor)).toEqual([1, 1, 2, 2, 3, 3, 4, 4])
    expect(nextTierAt(0)).toBe(5)
    expect(nextTierAt(30)).toBeNull()
  })
})

describe('Game — classic', () => {
  it('waits for the first keystroke before the clock runs', () => {
    const g = new Game({ mode: 'classic', duration: 15, seed: 1 })
    g.update(5000)
    expect(g.status).toBe('ready')
    expect(g.elapsed).toBe(0)
    g.input(g.target[0])
    expect(g.status).toBe('running')
    g.update(50)
    expect(g.elapsed).toBe(50)
  })

  it('scores a correct word with length × 10 × multiplier and fires an arrow', () => {
    const g = new Game({ mode: 'classic', seed: 2 })
    const ev = collect(g)
    const w = g.target
    typeWord(g)
    expect(g.index).toBe(1)
    expect(g.typed).toBe('')
    expect(g.streak).toBe(1)
    expect(g.score).toBe(w.length * 10)
    expect(g.keys).toEqual({ correct: w.length, incorrect: 0 })
    const types = ev.map((e) => e[0])
    expect(types).toContain('shoot')
    expect(types).toContain('hit')
    expect(g.enemy.hp).toBe(g.enemy.maxHp - 1)
  })

  it('treats a wrong word as a miss, resets the combo and counts missing letters as errors', () => {
    const g = new Game({ mode: 'classic', seed: 3 })
    typeWord(g)
    typeWord(g)
    expect(g.streak).toBe(2)
    const w = g.target
    g.input(w.slice(0, 1))
    g.input(w.slice(0, 1) + ' ')
    expect(g.streak).toBe(0)
    expect(g.history.at(-1).ok).toBe(false)
    expect(g.keys.incorrect).toBe(w.length - 1)
  })

  it('ignores a space with nothing typed', () => {
    const g = new Game({ mode: 'classic', seed: 4 })
    g.input(' ')
    expect(g.index).toBe(0)
    expect(g.status).toBe('ready')
  })

  it('handles several words pasted at once', () => {
    const g = new Game({ mode: 'classic', seed: 5 })
    const a = g.wordAt(0), b = g.wordAt(1), c = g.wordAt(2)
    g.input(`${a} ${b} ${c.slice(0, 2)}`)
    expect(g.index).toBe(2)
    expect(g.typed).toBe(c.slice(0, 2))
    expect(g.history.every((h) => h.ok)).toBe(true)
  })

  it('kills enemies, awards a bonus and spawns the next one with more HP', () => {
    const g = new Game({ mode: 'classic', seed: 6 })
    const ev = collect(g)
    const firstHp = g.enemy.maxHp
    for (let i = 0; i < firstHp; i++) typeWord(g)
    expect(g.kills).toBe(1)
    expect(g.level).toBe(2)
    expect(g.enemy.maxHp).toBeGreaterThan(firstHp)
    const kill = ev.find((e) => e[0] === 'kill')
    expect(kill[1].bonus).toBe(100)
    expect(kill[1].next).toBe(g.enemy)
  })

  it('makes every 5th enemy an elite', () => {
    const g = new Game({ mode: 'classic', seed: 7 })
    while (g.level < 5) typeWord(g)
    expect(g.enemy.elite).toBe(true)
    expect(g.enemy.kind).toBe('elite')
  })

  it('ends when the time runs out and computes WPM / accuracy', () => {
    const g = new Game({ mode: 'classic', duration: 15, seed: 8 })
    let chars = 0
    const tick = (ms) => { for (let k = 0; k < ms / 100; k++) g.update(100) }
    for (let i = 0; i < 10; i++) { chars += g.target.length + 1; typeWord(g); tick(1000) }
    tick(6000)
    expect(g.status).toBe('ended')
    expect(g.endReason).toBe('time')
    const r = g.result()
    expect(r.elapsed).toBe(15000)
    expect(r.wpm).toBe(Math.round(chars / 5 / 0.25))
    expect(r.acc).toBe(100)
    expect(r.correctWords).toBe(10)
    expect(r.samples.length).toBe(15)
  })

  it('does not accept input while paused and does not advance time', () => {
    const g = new Game({ mode: 'classic', seed: 9 })
    g.input(g.target[0])
    g.pause()
    g.input(g.target.slice(0, 2))
    g.update(1000)
    expect(g.typed.length).toBe(1)
    expect(g.elapsed).toBe(0)
    g.resume()
    g.update(100)
    expect(g.elapsed).toBe(100)
  })

  it('compares Turkish letters with Turkish casing rules', () => {
    const g = new Game({ mode: 'classic', lang: 'tr', seed: 10 })
    g.source.words[0] = 'ışık'
    g.input('IŞIK ')
    expect(g.history[0].ok).toBe(true)
  })
})

describe('Game — daily', () => {
  it('is deterministic for the same seed and forces 60s normal', () => {
    const a = new Game({ mode: 'daily', seed: 1234, duration: 15, difficulty: 'hard' })
    const b = new Game({ mode: 'daily', seed: 1234 })
    const wa = Array.from({ length: 50 }, (_, i) => a.wordAt(i))
    const wb = Array.from({ length: 50 }, (_, i) => b.wordAt(i))
    expect(wa).toEqual(wb)
    expect(a.duration).toBe(60)
    expect(a.difficulty).toBe('normal')
  })
})

describe('Game — survival', () => {
  it('enemies walk in, hurt the archer on reach and the game ends at 0 hearts', () => {
    const g = new Game({ mode: 'survival', seed: 11 })
    const ev = collect(g)
    g.input(g.target[0])
    expect(g.enemy.dist).toBe(SPAWN_DIST)
    let guard = 0
    while (g.status === 'running' && guard++ < 100000) g.update(50)
    expect(g.status).toBe('ended')
    expect(g.endReason).toBe('dead')
    expect(g.hearts).toBe(0)
    expect(ev.filter((e) => e[0] === 'hurt').length).toBe(3)
  })

  it('hits push the enemy back', () => {
    const g = new Game({ mode: 'survival', seed: 12 })
    g.input(g.target[0])
    for (let k = 0; k < 40; k++) g.update(100)
    const d0 = g.enemy.dist
    expect(d0).toBeLessThan(SPAWN_DIST)
    g.input(g.target + ' ')
    expect(g.enemy.dist).toBeGreaterThan(d0)
  })

  it('speeds up with level and difficulty', () => {
    expect(survivalSpeed(5)).toBeGreaterThan(survivalSpeed(1))
    expect(survivalSpeed(1, 'hard')).toBeGreaterThan(survivalSpeed(1, 'easy'))
    expect(REACH_DIST).toBeLessThan(SPAWN_DIST)
  })
})
