// Asset-agnostik sprite sürücüsü: yatay bir şeridi (her animasyon ayrı PNG, kareler
// yan yana) requestAnimationFrame ile oynatır. Çapuk görüntünün çaresi: gerçek
// çok-kareli animasyon + (isteğe bağlı) kare-başına değişken süre.
//
// def biçimi (state -> tanım):
//   { url, frames, fps }                       // sabit hız
//   { url, frames, durations:[ms,...] }         // kare-başına değişken süre
//   loop:true (idle gibi) | once (atış/vuruş; bitince onDone çağrılır, son kareyi tutar)
export class Sprite {
  constructor(el, { frameW, frameH, scale = 1, smooth = true } = {}) {
    this.el = el
    this.fw = frameW
    this.fh = frameH
    this.scale = scale
    el.style.width = (frameW * scale) + 'px'
    el.style.height = (frameH * scale) + 'px'
    el.style.backgroundRepeat = 'no-repeat'
    el.style.backgroundPositionY = '0px'
    el.style.imageRendering = smooth ? 'auto' : 'pixelated'
    this.defs = {}
    this.state = null
    this.def = null
    this.frame = 0
    this.raf = null
    this.acc = 0
    this.last = 0
    this.onDone = null
  }

  add(name, def) { this.defs[name] = { loop: false, ...def }; return this }

  _applyBg(def) {
    this.el.style.backgroundImage = `url('${def.url}')`
    this.el.style.backgroundSize = `${this.fw * this.scale * def.frames}px ${this.fh * this.scale}px`
  }
  _draw() { this.el.style.backgroundPositionX = `${-this.frame * this.fw * this.scale}px` }
  _holdMs() {
    if (this.def.durations) return this.def.durations[this.frame] ?? (1000 / (this.def.fps || 12))
    return 1000 / (this.def.fps || 12)
  }

  // Bir animasyona geç. loop ise ve zaten oynuyorsa yeniden başlatmaz.
  play(name, onDone) {
    const def = this.defs[name]
    if (!def) return
    if (this.state === name && def.loop && this.raf) return
    this.state = name
    this.def = def
    this.frame = 0
    this.onDone = onDone || null
    this._applyBg(def)
    this._draw()
    this.acc = 0
    this.last = performance.now()
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = requestAnimationFrame(this._tick)
  }

  // Aynı 'once' animasyonu hızlı tekrarda baştan oynat (interruptible).
  replayOnce(name, onDone) {
    this.state = null
    this.play(name, onDone)
  }

  _tick = (now) => {
    const dt = now - this.last
    this.last = now
    this.acc += dt
    let guard = 0
    while (this.acc >= this._holdMs() && guard++ < 8) {
      this.acc -= this._holdMs()
      this.frame++
      if (this.frame >= this.def.frames) {
        if (this.def.loop) {
          this.frame = 0
        } else {
          this.frame = this.def.frames - 1
          this._draw()
          this.raf = null
          const cb = this.onDone; this.onDone = null
          if (cb) cb()
          return
        }
      }
    }
    this._draw()
    this.raf = requestAnimationFrame(this._tick)
  }

  stop() { if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null } }
}
