// Ses efektleri — WebAudio ile anında sentezlenir (ses dosyası / lisans gerekmez).
// Tarayıcılar ilk kullanıcı etkileşimine kadar sesi kilitler; unlock() bunu açar.
class Sfx {
  constructor() {
    this.ctx = null
    this.master = null
    this.volume = 0.7
    this.muted = false
    this._noise = null
  }

  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext
        if (!AC) return
        this.ctx = new AC()
        this.master = this.ctx.createGain()
        this.master.connect(this.ctx.destination)
        this._applyGain()
      }
      if (this.ctx.state === 'suspended') this.ctx.resume()
    } catch { /* ses yoksa sessiz devam */ }
  }

  setVolume(v) { this.volume = Math.max(0, Math.min(1, v)); this._applyGain() }
  setMuted(m) { this.muted = !!m; this._applyGain() }
  _applyGain() {
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume * 0.55
  }
  get ready() { return !!this.ctx && !this.muted && this.volume > 0 && this.ctx.state === 'running' }

  _noiseBuf() {
    if (this._noise) return this._noise
    const len = this.ctx.sampleRate * 0.5
    const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = b.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    return (this._noise = b)
  }

  tone({ type = 'sine', f0 = 440, f1 = null, dur = 0.12, vol = 0.3, delay = 0, attack = 0.004 }) {
    if (!this.ready) return
    const c = this.ctx, t = c.currentTime + delay
    const o = c.createOscillator(), g = c.createGain()
    o.type = type
    o.frequency.setValueAtTime(f0, t)
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(this.master)
    o.start(t)
    o.stop(t + dur + 0.02)
  }

  noise({ dur = 0.1, vol = 0.2, type = 'bandpass', f0 = 1500, f1 = null, q = 1, delay = 0 }) {
    if (!this.ready) return
    const c = this.ctx, t = c.currentTime + delay
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain()
    s.buffer = this._noiseBuf()
    f.type = type
    f.Q.value = q
    f.frequency.setValueAtTime(f0, t)
    if (f1) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur)
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    s.connect(f).connect(g).connect(this.master)
    s.start(t)
    s.stop(t + dur + 0.02)
  }

  // ── oyun sesleri ──
  shoot(mult = 1) {
    this.tone({ type: 'triangle', f0: 260 + mult * 30, f1: 110, dur: 0.14, vol: 0.22 })
    this.noise({ type: 'bandpass', f0: 3200, f1: 700, dur: 0.13, vol: 0.12, q: 0.8, delay: 0.02 })
  }
  hit(mult = 1) {
    this.noise({ type: 'lowpass', f0: 900, f1: 120, dur: 0.12, vol: 0.35 })
    this.tone({ type: 'square', f0: 200 + mult * 40, f1: 90, dur: 0.08, vol: 0.08 })
  }
  kill() {
    ;[523, 659, 784, 1047].forEach((f, i) => this.tone({ type: 'triangle', f0: f, dur: 0.12, vol: 0.18, delay: i * 0.06 }))
  }
  miss() {
    this.tone({ type: 'square', f0: 150, f1: 95, dur: 0.13, vol: 0.09 })
  }
  combo(mult) {
    const base = [0, 440, 523, 659, 784][mult] || 784
    this.tone({ type: 'sine', f0: base, dur: 0.1, vol: 0.2 })
    this.tone({ type: 'sine', f0: base * 1.5, dur: 0.16, vol: 0.2, delay: 0.08 })
  }
  comboBreak() {
    this.tone({ type: 'sawtooth', f0: 330, f1: 140, dur: 0.22, vol: 0.07 })
  }
  hurt() {
    this.tone({ type: 'sawtooth', f0: 220, f1: 55, dur: 0.32, vol: 0.18 })
    this.noise({ type: 'lowpass', f0: 600, f1: 80, dur: 0.25, vol: 0.3 })
  }
  tick(urgent = false) {
    this.tone({ type: 'sine', f0: urgent ? 1180 : 880, dur: 0.05, vol: 0.12 })
  }
  over(win = true) {
    const notes = win ? [392, 523, 659] : [330, 262, 196]
    notes.forEach((f, i) => this.tone({ type: 'triangle', f0: f, dur: 0.22, vol: 0.2, delay: i * 0.13 }))
  }
  record() {
    ;[523, 659, 784, 1047, 1319].forEach((f, i) => this.tone({ type: 'triangle', f0: f, dur: 0.18, vol: 0.2, delay: i * 0.08 }))
  }
  unlockAch() {
    this.tone({ type: 'sine', f0: 988, dur: 0.1, vol: 0.16 })
    this.tone({ type: 'sine', f0: 1319, dur: 0.2, vol: 0.16, delay: 0.09 })
  }
  click() {
    this.tone({ type: 'sine', f0: 700, f1: 520, dur: 0.05, vol: 0.08 })
  }
}

export const sfx = new Sfx()
