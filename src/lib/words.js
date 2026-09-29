import en from '../data/words-en.js'
import tr from '../data/words-tr.js'

export const PACKS = { en, tr }

// Dile duyarlı küçük harf: Türkçe'de "I" -> "ı", "İ" -> "i" olmalı.
export function lower(s, lang) {
  return lang === 'tr' ? s.toLocaleLowerCase('tr-TR') : s.toLowerCase()
}

// Zorluk başına [başlangıç, bitiş] karışımı: [easy, medium, hard] olasılıkları.
// Tur ilerledikçe (rampWords kelime boyunca) başlangıçtan bitişe doğru kayar.
export const MIX = {
  easy: [[0.8, 0.2, 0], [0.5, 0.45, 0.05]],
  normal: [[0.6, 0.37, 0.03], [0.15, 0.55, 0.3]],
  hard: [[0.2, 0.55, 0.25], [0, 0.4, 0.6]],
}

const TIERS = ['easy', 'medium', 'hard']
const RECENT = 14 // son N kelime tekrar edilmez

export class WordSource {
  constructor({ lang = 'en', difficulty = 'normal', rng = Math.random, rampWords = 60 } = {}) {
    this.pack = PACKS[lang] || PACKS.en
    this.mix = MIX[difficulty] || MIX.normal
    this.rng = rng
    this.ramp = Math.max(1, rampWords)
    this.words = []
  }

  at(i) {
    while (this.words.length <= i) this.words.push(this._next())
    return this.words[i]
  }

  mixAt(i) {
    const p = Math.min(1, i / this.ramp)
    const [a, b] = this.mix
    return a.map((v, k) => v + (b[k] - v) * p)
  }

  _next() {
    const mix = this.mixAt(this.words.length)
    let r = this.rng()
    let tier = 0
    while (tier < 2 && r >= mix[tier]) { r -= mix[tier]; tier++ }
    const pool = this.pack[TIERS[tier]]
    const recent = this.words.slice(-RECENT)
    let w = pool[Math.floor(this.rng() * pool.length)]
    for (let tries = 0; tries < 12 && recent.includes(w); tries++) {
      w = pool[Math.floor(this.rng() * pool.length)]
    }
    return w
  }
}
