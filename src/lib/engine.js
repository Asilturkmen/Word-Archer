// ─────────────────────────────────────────────────────────────
//  Oyun motoru — React'ten bağımsız, saf JS (test edilebilir).
//  Görünüm katmanı olayları dinler ('shoot','hit','kill','miss','hurt',
//  'combo','spawn','start','pause','resume','end','change') ve
//  her karede update(dt) çağırır.
// ─────────────────────────────────────────────────────────────
import { WordSource, lower } from './words.js'
import { mulberry32, randomSeed } from './rng.js'

export const MODES = {
  classic: { timed: true, walking: false, hearts: 0, ranked: true },
  daily: { timed: true, walking: false, hearts: 0, ranked: true, duration: 60, difficulty: 'normal' },
  survival: { timed: false, walking: true, hearts: 3, ranked: true },
  zen: { timed: false, walking: false, hearts: 0, ranked: false },
}
export const DURATIONS = [15, 30, 60, 120]
export const DIFFICULTIES = ['easy', 'normal', 'hard']

// Kombo: art arda doğru kelime sayısı eşikleri -> x1..x4 çarpan
export const COMBO_TIERS = [0, 5, 15, 30]
export function multiplierFor(streak) {
  let m = 1
  for (let i = 1; i < COMBO_TIERS.length; i++) if (streak >= COMBO_TIERS[i]) m = i + 1
  return m
}
export function nextTierAt(streak) {
  return COMBO_TIERS.find((t) => t > streak) ?? null
}

// Hayatta Kal mesafeleri (sahne pikseli)
export const SPAWN_DIST = 600
export const STAND_DIST = 470
export const REACH_DIST = 78
export const KNOCKBACK = 16
export const HURT_KNOCKBACK = 250
export const HURT_STUN = 900
const DIFF_SPEED = { easy: 0.8, normal: 1, hard: 1.25 }

export function survivalSpeed(level, difficulty = 'normal') {
  return Math.min(95, 17 + 3.4 * (level - 1)) * (DIFF_SPEED[difficulty] || 1)
}

export class Game {
  constructor(opts = {}) {
    const mode = MODES[opts.mode] ? opts.mode : 'classic'
    this.mode = mode
    this.cfg = MODES[mode]
    this.lang = opts.lang === 'tr' ? 'tr' : 'en'
    this.duration = this.cfg.duration ?? (opts.duration || 60)
    this.difficulty = this.cfg.difficulty ?? (DIFFICULTIES.includes(opts.difficulty) ? opts.difficulty : 'normal')
    this.seed = opts.seed ?? randomSeed()
    this.dailyKey = opts.dailyKey || null
    const wordRng = mulberry32(this.seed)
    this.enemyRng = mulberry32(this.seed ^ 0x9e3779b9)
    const ramp = mode === 'survival' ? 110 : mode === 'zen' ? 80 : Math.max(20, this.duration)
    this.source = new WordSource({ lang: this.lang, difficulty: this.difficulty, rng: wordRng, rampWords: ramp })

    this.listeners = new Set()
    this.status = 'ready' // ready | running | paused | ended
    this.endReason = null
    this.elapsed = 0
    this.index = 0
    this.typed = ''
    this.history = []
    this.score = 0
    this.streak = 0
    this.bestStreak = 0
    this.kills = 0
    this.level = 1
    this.hearts = this.cfg.hearts
    this.keys = { correct: 0, incorrect: 0 }
    this.correctChars = 0
    this.rawChars = 0
    this.samples = []
    this._secErrors = 0
    this._nextSample = 1000
    this._lastSec = null
    this._eid = 0
    this.enemy = this._makeEnemy(1)
    this.version = 0
  }

  // ── olaylar ──
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn) }
  _emit(type, data) { for (const fn of this.listeners) fn(type, data, this) }
  _changed() { this.version++; this._emit('change') }

  // ── okuma yardımcıları ──
  wordAt(i) { return this.source.at(i) }
  get target() { return this.wordAt(this.index) }
  get multiplier() { return multiplierFor(this.streak) }
  get timeLeft() { return this.cfg.timed ? Math.max(0, this.duration * 1000 - this.elapsed) : null }
  norm(s) { return lower(s, this.lang) }

  // Yazılan kısım hedefin doğru bir öneki mi?
  get typedOk() {
    const t = this.norm(this.typed), w = this.norm(this.target)
    return w.startsWith(t)
  }

  // ── durum geçişleri ──
  start() {
    if (this.status !== 'ready') return
    this.status = 'running'
    this._emit('start')
    this._changed()
  }
  pause() {
    if (this.status !== 'running') return
    this.status = 'paused'
    this._emit('pause')
    this._changed()
  }
  resume() {
    if (this.status !== 'paused') return
    this.status = 'running'
    this._emit('resume')
    this._changed()
  }
  end(reason = 'quit') {
    if (this.status === 'ended') return
    const wasRunning = this.status !== 'ready'
    this.status = 'ended'
    this.endReason = reason
    if (wasRunning && this.elapsed > 0 && (!this.samples.length || this.samples[this.samples.length - 1].t * 1000 < this.elapsed - 250)) {
      this._pushSample(this.elapsed)
    }
    this._emit('end', { reason })
    this._changed()
  }

  // ── yazım girişi ──
  // Görünmez input'un tam değerini alır (mobil klavye / IME / yapıştırma uyumlu).
  // Boşluk = kelimeyi gönder.
  input(value) {
    if (this.status === 'ended' || this.status === 'paused') return
    const v = String(value).replace(/[\r\n\t]/g, ' ')
    if (!/\s/.test(v)) { this._setTyped(v); return }
    const segs = v.split(/\s/)
    for (let i = 0; i < segs.length - 1; i++) {
      this._setTyped(segs[i])
      if (this.typed.length) this.submit()
      if (this.status === 'ended') return
    }
    this._setTyped(segs[segs.length - 1])
  }

  _setTyped(v) {
    const prev = this.typed
    const target = this.target
    if (v.length > target.length + 10) v = v.slice(0, target.length + 10)
    if (v === prev) return
    let common = 0
    while (common < prev.length && common < v.length && prev[common] === v[common]) common++
    if (v.length > common) {
      if (this.status === 'ready') this.start()
      if (this.status !== 'running') return
      const tn = this.norm(target)
      for (let j = common; j < v.length; j++) {
        if (j < tn.length && this.norm(v[j]) === tn[j]) this.keys.correct++
        else { this.keys.incorrect++; this._secErrors++ }
      }
    }
    this.typed = v
    this._emit('type', { ok: this.typedOk })
    this._changed()
  }

  submit() {
    if (this.status !== 'running' || !this.typed) return
    const word = this.target
    const typed = this.typed
    const ok = this.norm(typed) === this.norm(word)
    this.rawChars += typed.length + 1
    this.history.push({ word, typed, ok, t: this.elapsed })
    this.index++
    this.typed = ''
    if (ok) {
      this.correctChars += word.length + 1
      const prevMult = this.multiplier
      this.streak++
      if (this.streak > this.bestStreak) this.bestStreak = this.streak
      const mult = this.multiplier
      const pts = word.length * 10 * mult
      this.score += pts
      this._emit('shoot', { word, mult, pts, enemyId: this.enemy.id })
      if (mult > prevMult) this._emit('combo', { mult })
      this._damage(mult)
    } else {
      // eksik bırakılan harfler de hata sayılır (önek gönderip %100 doğruluk alınmasın)
      const missing = Math.max(0, word.length - typed.length)
      this.keys.incorrect += missing
      this._secErrors += missing || 0
      const lost = this.streak
      this.streak = 0
      this._emit('miss', { word, typed, lostStreak: lost })
    }
    this._changed()
  }

  _damage(dmg) {
    const e = this.enemy
    e.hp = Math.max(0, e.hp - dmg)
    if (this.cfg.walking) e.dist = Math.min(SPAWN_DIST, e.dist + KNOCKBACK + 6 * (dmg - 1))
    this._emit('hit', { enemy: e, dmg })
    if (e.hp <= 0) {
      this.kills++
      const bonus = 100 * e.level * (e.elite ? 2 : 1)
      this.score += bonus
      this.level++
      this.enemy = this._makeEnemy(this.level)
      this._emit('kill', { enemy: e, bonus, next: this.enemy })
      this._emit('spawn', { enemy: this.enemy })
    }
  }

  _makeEnemy(level) {
    const elite = level % 5 === 0
    const kind = elite ? 'elite' : level <= 2 ? 'goblin' : this.enemyRng() < 0.5 ? 'goblin' : 'skeleton'
    const walking = this.cfg.walking
    const base = walking ? 3 + (level - 1) : 4 + 2 * (level - 1)
    const maxHp = Math.round(base * (elite ? 1.5 : 1))
    return {
      id: ++this._eid, kind, elite, level, maxHp, hp: maxHp,
      dist: walking ? SPAWN_DIST : STAND_DIST,
      speed: walking ? survivalSpeed(level, this.difficulty) : 0,
      stun: walking ? 500 : 0,
    }
  }

  _pushSample(ms) {
    const t = ms / 1000
    const min = t / 60
    this.samples.push({
      t: Math.round(t * 10) / 10,
      wpm: Math.round(this.correctChars / 5 / min),
      raw: Math.round(this.rawChars / 5 / min),
      errors: this._secErrors,
    })
    this._secErrors = 0
  }

  // ── zaman ilerletme ──
  update(dtMs) {
    if (this.status !== 'running') return
    const dt = Math.max(0, Math.min(dtMs, 100))
    this.elapsed += dt
    if (this.cfg.timed && this.elapsed >= this.duration * 1000) this.elapsed = this.duration * 1000
    while (this.elapsed >= this._nextSample) {
      this._pushSample(this._nextSample)
      this._nextSample += 1000
    }

    if (this.cfg.walking) {
      const e = this.enemy
      if (e.stun > 0) e.stun = Math.max(0, e.stun - dt)
      else e.dist -= (e.speed * dt) / 1000
      if (e.dist <= REACH_DIST) {
        e.dist = REACH_DIST + HURT_KNOCKBACK
        e.stun = HURT_STUN
        this.hearts--
        const lost = this.streak
        this.streak = 0
        this._emit('hurt', { hearts: this.hearts, lostStreak: lost, enemy: e })
        if (this.hearts <= 0) { this.end('dead'); return }
        this._changed()
      }
    }

    if (this.cfg.timed) {
      const sec = Math.ceil(this.timeLeft / 1000)
      if (sec !== this._lastSec) { this._lastSec = sec; this._emit('second', { sec }); this._changed() }
      if (this.timeLeft <= 0) this.end('time')
    } else {
      const sec = Math.floor(this.elapsed / 1000)
      if (sec !== this._lastSec) { this._lastSec = sec; this._changed() }
    }
  }

  // ── sonuç ──
  result() {
    const minutes = this.elapsed / 60000
    const keysTotal = this.keys.correct + this.keys.incorrect
    const correctWords = this.history.filter((h) => h.ok).length
    return {
      mode: this.mode,
      duration: this.cfg.timed ? this.duration : 0,
      difficulty: this.difficulty,
      lang: this.lang,
      dailyKey: this.dailyKey,
      ranked: this.cfg.ranked,
      score: this.score,
      wpm: minutes > 0 ? Math.round(this.correctChars / 5 / minutes) : 0,
      raw: minutes > 0 ? Math.round(this.rawChars / 5 / minutes) : 0,
      acc: keysTotal ? Math.round((this.keys.correct / keysTotal) * 1000) / 10 : 0,
      kills: this.kills,
      level: this.level,
      bestStreak: this.bestStreak,
      correctWords,
      wrongWords: this.history.length - correctWords,
      elapsed: Math.round(this.elapsed),
      samples: this.samples.slice(),
      missed: this.history.filter((h) => !h.ok).slice(-8).map(({ word, typed }) => ({ word, typed })),
      endReason: this.endReason,
      date: Date.now(),
    }
  }
}
