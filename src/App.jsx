import React from 'react'
import { css } from './css.js'
import { STR } from './i18n.js'
import { WORDS, LB_ALL, LB_WEEK } from './data.js'
import { Sprite } from './sprite.js'

// Sık kullanılan unicode ikonlar
const BOW = '🏹' // yay & ok (Word Archer)
const SKULL = '☠'  // ☠
const STAR = '★'   // ★
const PLAY = '▶'   // ▶
const LARR = '←'   // ←

// ─────────────────────────────────────────────────────────────
//  Word Gladiator — single-player typing arena ("Warm Colosseum")
//  · MonkeyType tarzı akan kelime yazımı; bir kelimeyi bitir -> öldür.
//  · TR/EN; Türkçe'de UI fontu Pixelify Sans'a geçer.
//  · Karakter sanatı = boş yuvalar (#gladiator-sprite / #enemy-sprite).
//  · Auth + leaderboard şimdilik localStorage/mock; Supabase için
//    "// Supabase" işaretli yerlere bağlanacak.
// ─────────────────────────────────────────────────────────────
export default class App extends React.Component {
  static defaultProps = {
    language: 'en',
    gameDuration: 60,
    difficulty: 'normal',
    sunbeams: true,
  }

  state = {
    lang: 'en',            // en | tr
    screen: 'menu',        // menu | game | over | board
    showAuth: false, authTab: 'login', authError: '', passHidden: true,
    showHelp: false,
    lbTab: 'all',          // all | week | mine
    user: null,
    score: 0, totalDamage: 0, misses: 0, timeLeft: 60, totalChars: 0,
    queue: [], active: 0, typed: '',
    best: 0, wpm: 0, displayScore: 0, scorePop: false,
  }

  get props_() { return this.props }
  get duration() { return this.props.gameDuration ?? 60 }
  dict() { return STR[this.state.lang] || STR.en }

  // ── refs ──
  setInput = el => { this.inputEl = el }
  setGladOver = el => { this.gladOverEl = el }
  setScreen = el => { this.screenEl = el }       // arena (ekran sarsıntısı uygulanır)
  setPlayerFx = el => { this.playerFxEl = el }    // oyuncu sarmalayıcı (atış transform'u)
  setEnemyFx = el => { this.enemyFxEl = el }      // düşman sarmalayıcı (sarsılma/geri savrulma)
  setFxLayer = el => { this.fxLayerEl = el }      // ok/kıvılcım/hasar katmanı
  setUserInput = el => { this.userInput = el }
  setPassInput = el => { this.passInput = el }

  // ── gerçek çok-kareli sprite kurucular (CraftPix okçu + LuizMelo goblin) ──
  buildArcher(el, scale) {
    const s = new Sprite(el, { frameW: 96, frameH: 76, scale, smooth: false })
    s.add('idle',  { url: '/sprites/archer/Idle.png',   frames: 6,  fps: 8, loop: true })
     .add('shoot', { url: '/sprites/archer/Shot_1.png', frames: 14, fps: 24 })
     .add('hit',   { url: '/sprites/archer/Hurt.png',   frames: 3,  fps: 12 })
     .add('death', { url: '/sprites/archer/Dead.png',   frames: 3,  fps: 8 })
    return s
  }
  buildGoblin(el, scale) {
    const s = new Sprite(el, { frameW: 59, frameH: 43, scale, smooth: false })
    s.add('idle', { url: '/sprites/goblin/Idle.png',    frames: 4, fps: 6, loop: true })
     .add('hit',  { url: '/sprites/goblin/TakeHit.png', frames: 4, fps: 16 })
     .add('death',{ url: '/sprites/goblin/Death.png',   frames: 4, fps: 8 })
    return s
  }
  setPlayerSpriteEl = el => {
    if (el) { this.playerSprite = this.buildArcher(el, 2.0); this.playerSprite.play('idle') }
    else if (this.playerSprite) { this.playerSprite.stop(); this.playerSprite = null }
  }
  setEnemySpriteEl = el => {
    if (el) { this.enemySprite = this.buildGoblin(el, 2.6); this.enemySprite.play('idle') }
    else if (this.enemySprite) { this.enemySprite.stop(); this.enemySprite = null }
  }
  setVictoryEl = el => {
    if (el) { this.victorySprite = this.buildArcher(el, 2.3); this.victorySprite.play('idle') }
    else if (this.victorySprite) { this.victorySprite.stop(); this.victorySprite = null }
  }
  setMenuPlayerEl = el => {
    if (el) { this.menuPlayer = this.buildArcher(el, 1.7); this.menuPlayer.play('idle') }
    else if (this.menuPlayer) { this.menuPlayer.stop(); this.menuPlayer = null }
  }
  setMenuEnemyEl = el => {
    if (el) { this.menuEnemy = this.buildGoblin(el, 2.2); this.menuEnemy.play('idle') }
    else if (this.menuEnemy) { this.menuEnemy.stop(); this.menuEnemy = null }
  }

  // Geçilen kelimelerin durumu (10ff renklendirmesi): { [queueIndex]: 'ok' | 'bad' }
  marks = {}

  componentDidMount() {
    const best = parseInt(localStorage.getItem('wg_best') || '0', 10)
    const user = localStorage.getItem('wg_user')
    const lang = localStorage.getItem('wg_lang') || this.props.language || 'en'
    this.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    this.trauma = 0
    this.setState({ best: isNaN(best) ? 0 : best, user: user || null, lang })
    document.addEventListener('keydown', this.onKey)
  }
  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKey)
    clearInterval(this.timer)
    if (this.shakeRAF) cancelAnimationFrame(this.shakeRAF)
    ;[this.playerSprite, this.enemySprite, this.victorySprite, this.menuPlayer, this.menuEnemy].forEach(s => s && s.stop())
  }
  componentDidUpdate() {
    if (this._lastScreen !== this.state.screen) {
      this._lastScreen = this.state.screen
      const el = document.querySelector('.wg-scrn')
      if (el && el.animate) el.animate([{ transform: 'translateY(10px)' }, { transform: 'none' }], { duration: 300, easing: 'ease-out' })
    }
  }

  onKey = (e) => {
    if (e.key === 'Escape') {
      if (this.state.showHelp) return this.setState({ showHelp: false })
      if (this.state.showAuth) return this.setState({ showAuth: false, authError: '' })
      if (this.state.screen === 'game') return this.endGame()
      if (this.state.screen !== 'menu') return this.setState({ screen: 'menu' })
    }
  }

  // ── word generation (Supabase-agnostic, local pools) ──
  getWord(pack, tl) {
    const r = Math.random()
    let pool
    if (this.props.difficulty === 'hardcore') pool = r < 0.5 ? pack.hard : pack.medium
    else if (tl > 40) pool = pack.easy
    else if (tl > 20) pool = r < 0.6 ? pack.medium : pack.easy
    else pool = r < 0.6 ? pack.hard : pack.medium
    return pool[Math.floor(Math.random() * pool.length)]
  }
  generate(n, tl) {
    const pack = WORDS[this.state.lang] || WORDS.en
    const out = []
    for (let i = 0; i < n; i++) out.push(this.getWord(pack, tl))
    return out
  }

  onPlay = () => {
    clearInterval(this.timer)
    this.marks = {}
    this.trauma = 0
    const dur = this.duration
    this.setState({
      screen: 'game', score: 0, totalDamage: 0, misses: 0, timeLeft: dur, totalChars: 0,
      queue: this.generate(36, dur), active: 0, typed: '',
    }, () => {
      this.timer = setInterval(this.tick, 1000)
      setTimeout(() => { if (this.inputEl) { this.inputEl.value = ''; this.inputEl.focus() } }, 60)
    })
  }

  tick = () => {
    this.setState(s => {
      const t = s.timeLeft - 1
      if (t <= 0) { clearInterval(this.timer); setTimeout(this.endGame, 0); return { timeLeft: 0 } }
      return { timeLeft: t }
    })
  }

  focusInput = () => { if (this.inputEl) this.inputEl.focus() }

  clearNative = (e) => { e.target.value = '' }  // görünmez input boş kalsın

  // ── 10fastfingers tarzı yazım ──
  // Kelimelerin ÜZERİNDE yazarsın (imleç harf harf ilerler). Kelimeyi yazıp
  // BOŞLUK'a basınca gönderilir: doğruysa öldürme + skor, yanlışsa "yanlış" sayılır.
  // Uzunlukla otomatik geçiş YOK; ilerleme her zaman Boşluk ile olur.
  onGameKey = (e) => {
    if (this.state.screen !== 'game' || this.state.timeLeft <= 0) return
    const w = this.state.queue[this.state.active] || ''
    if (e.key === 'Backspace') {
      e.preventDefault()
      this.setState(s => ({ typed: s.typed.slice(0, -1) }))
      return
    }
    // Boşluk / Enter -> kelimeyi gönder (kelimeye başlamadıysak yok sayılır)
    if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
      e.preventDefault()
      if (this.state.typed.length === 0) return
      this.submitWord(this.state.typed)
      return
    }
    if (e.key.length !== 1) return  // Shift / ok tuşları / Ctrl vb. yoksay
    e.preventDefault()
    if (!w) return
    const next = this.state.typed + e.key
    if (next.length > w.length + 8) return  // aşırı taşmayı sınırla
    this.setState({ typed: next })
  }
  submitWord = (text) => {
    if (!text || text.length === 0) { this.setState({ typed: '' }); return }
    const w = this.state.queue[this.state.active] || ''
    if (text.toLowerCase() === w.toLowerCase()) this.completeWord()
    else this.missWord()
  }

  // Doğru kelime -> 1 HASAR. Öldürme/respawn yok; hasar birikir. Görseller asenkron oynar.
  completeWord = () => {
    const w = this.state.queue[this.state.active] || ''
    this.marks[this.state.active] = 'ok'
    this.fire()  // oyuncu atış + mermi + (çarpma asenkron)
    this.setState(s => {
      let q = s.queue; let active = s.active + 1
      if (active > q.length - 10) q = q.concat(this.generate(20, s.timeLeft))
      return { totalDamage: s.totalDamage + 1, score: s.score + 1, totalChars: s.totalChars + w.length, typed: '', active, queue: q, scorePop: true }
    }, () => { this.focusInput() })
    setTimeout(() => this.setState({ scorePop: false }), 400)
  }

  // Yanlış/eksik kelime -> "yanlış" say, sıradakine geç (atış/hasar yok).
  missWord = () => {
    this.marks[this.state.active] = 'bad'
    if (this.playerFxEl && !this.reduced) {
      this.playerAnim && this.playerAnim.cancel()
      this.playerAnim = this.playerFxEl.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }],
        { duration: 150, easing: 'ease-out' }
      )
    }
    this.setState(s => {
      let q = s.queue; let active = s.active + 1
      if (active > q.length - 10) q = q.concat(this.generate(20, s.timeLeft))
      return { active, queue: q, typed: '', misses: s.misses + 1 }
    }, () => { this.focusInput() })
  }

  // ── savaş efektleri (60fps, Web Animations API + havuzlanmış DOM) ──
  // fxLayer-yerel (ölçeklenmemiş) koordinatta bir elemanın merkezini döndürür
  localPos(el) {
    const layer = this.fxLayerEl
    if (!layer || !el) return { x: 0, y: 0 }
    const lr = layer.getBoundingClientRect()
    const scale = (lr.width / layer.offsetWidth) || 1
    const r = el.getBoundingClientRect()
    return { x: (r.left + r.width / 2 - lr.left) / scale, y: (r.top + r.height / 2 - lr.top) / scale }
  }

  fire = () => {
    // okçu: yay çekme + bırakma animasyonu (bir kez), sonra idle'a döner
    if (this.playerSprite) this.playerSprite.replayOnce('shoot', () => this.playerSprite && this.playerSprite.play('idle'))
    // oku, yay bırakma karesiyle senkron olacak şekilde küçük bir gecikmeyle fırlat
    const shoot = () => {
      if (!this.fxLayerEl || !this.playerFxEl || !this.enemyFxEl) return
      const p = this.localPos(this.playerFxEl), e = this.localPos(this.enemyFxEl)
      const muzzle = { x: p.x + 30, y: p.y - 8 }   // okçunun yay eli hizası
      const target = { x: e.x - 12, y: e.y - 4 }   // düşman gövdesi
      this.spawnPuff(muzzle)
      this.spawnArrow(muzzle, target)
    }
    if (this.reduced) shoot()
    else setTimeout(shoot, 230)   // her atış kendi okunu fırlatır (1 kelime = 1 ok)
  }

  // yay teli "twang" pufu (barut patlaması değil)
  spawnPuff = (at) => {
    const layer = this.fxLayerEl; if (!layer || this.reduced) return
    const m = document.createElement('div'); m.className = 'wg-puff'
    const sz = 15
    m.style.left = (at.x - sz / 2) + 'px'; m.style.top = (at.y - sz / 2) + 'px'
    m.style.width = sz + 'px'; m.style.height = sz + 'px'
    m.style.background = 'radial-gradient(circle, rgba(255,255,255,.85) 0%, rgba(255,255,255,0) 70%)'
    layer.appendChild(m)
    const a = m.animate([
      { opacity: .9, transform: 'scale(.4)' },
      { opacity: 0, transform: 'scale(1.3)' },
    ], { duration: 120, easing: 'ease-out' })
    a.finished.then(() => m.remove()).catch(() => m.remove())
  }

  // gerçek ok (ahşap gövde + uç + tüy)
  spawnArrow = (from, to) => {
    const layer = this.fxLayerEl; if (!layer) return
    const dx = to.x - from.x, dy = to.y - from.y
    const ang = Math.atan2(dy, dx) * 180 / Math.PI
    const b = document.createElement('div'); b.className = 'wg-bolt'
    b.style.left = from.x + 'px'; b.style.top = from.y + 'px'
    b.style.width = '34px'; b.style.height = '3px'; b.style.marginTop = '-1.5px'
    b.style.background = 'linear-gradient(90deg, #6a4a2a 0%, #8a5a2e 70%, #b5895a 100%)'
    b.style.transformOrigin = 'left center'
    b.style.transform = `rotate(${ang}deg)`
    const head = document.createElement('div'); head.className = 'wg-arrowhead'
    const fl = document.createElement('div'); fl.className = 'wg-arrowfletch'
    b.appendChild(fl); b.appendChild(head)
    layer.appendChild(b)
    const dur = this.reduced ? 1 : Math.max(95, Math.min(180, Math.hypot(dx, dy) / 4.5))
    const a = b.animate([
      { transform: `translate(0,0) rotate(${ang}deg)` },
      { transform: `translate(${dx}px,${dy}px) rotate(${ang}deg)` },
    ], { duration: dur, easing: 'linear' })
    a.finished.then(() => { b.remove(); this.onImpact(to) }).catch(() => b.remove())
  }

  onImpact = (at) => {
    this.enemyHit()
    this.spawnSparks(at)
    this.spawnRing(at)
    this.spawnFloater(at, '+1')
    this.addTrauma(0.26)
  }

  enemyHit = () => {
    // goblin "Take Hit" sprite animasyonu (bir kez) -> idle
    if (this.enemySprite) this.enemySprite.replayOnce('hit', () => this.enemySprite && this.enemySprite.play('idle'))
    const fx = this.enemyFxEl
    if (fx && !this.reduced) {
      this.enemyAnim && this.enemyAnim.cancel()
      this.enemyAnim = fx.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(11px)', offset: 0.22 },   // oyuncudan uzağa savrulma
        { transform: 'translateX(-3px)', offset: 0.6 },
        { transform: 'translateX(0)' },
      ], { duration: 300, easing: 'cubic-bezier(0.34,1.56,0.64,1)' })
    }
    const inner = fx && fx.firstChild
    if (inner) {
      this.enemyFlash && this.enemyFlash.cancel()
      this.enemyFlash = inner.animate([
        { filter: 'brightness(3.2) saturate(0)' },
        { filter: 'brightness(1) saturate(1)' },
      ], { duration: 160, easing: 'ease-out' })
    }
  }

  spawnSparks = (at) => {
    const layer = this.fxLayerEl; if (!layer || this.reduced) return
    if (layer.querySelectorAll('.wg-spark').length > 50) return
    for (let i = 0; i < 9; i++) {
      const s = document.createElement('div'); s.className = 'wg-spark'
      const sz = 2 + Math.random() * 4
      s.style.left = at.x + 'px'; s.style.top = at.y + 'px'
      s.style.width = sz + 'px'; s.style.height = sz + 'px'
      s.style.background = i % 2 ? '#fff4d0' : '#f0a030'
      s.style.boxShadow = '0 0 6px rgba(240,160,48,.7)'
      layer.appendChild(s)
      const ang = Math.PI + (Math.random() - 0.5) * 1.7      // geriye (oyuncuya) doğru koni
      const sp = 45 + Math.random() * 120
      const ex = Math.cos(ang) * sp, ey = Math.sin(ang) * sp + 55  // yerçekimi etkisi
      const life = 300 + Math.random() * 240
      const a = s.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${ex}px,${ey}px) scale(.3)`, opacity: 0 },
      ], { duration: life, easing: 'cubic-bezier(0.2,0.6,0.3,1)' })
      a.finished.then(() => s.remove()).catch(() => s.remove())
    }
  }

  spawnRing = (at) => {
    const layer = this.fxLayerEl; if (!layer || this.reduced) return
    const r = document.createElement('div'); r.className = 'wg-ring'
    r.style.left = (at.x - 4) + 'px'; r.style.top = (at.y - 4) + 'px'
    r.style.width = '8px'; r.style.height = '8px'; r.style.border = '2px solid #ffd24a'
    layer.appendChild(r)
    const a = r.animate([
      { transform: 'scale(.4)', opacity: .85 },
      { transform: 'scale(3.4)', opacity: 0 },
    ], { duration: 250, easing: 'ease-out' })
    a.finished.then(() => r.remove()).catch(() => r.remove())
  }

  spawnFloater = (at, text) => {
    const layer = this.fxLayerEl; if (!layer) return
    if (layer.querySelectorAll('.wg-floater').length > 8) return  // taşmayı önle
    const f = document.createElement('div'); f.className = 'wg-floater'
    f.textContent = text
    f.style.left = at.x + 'px'; f.style.top = at.y + 'px'
    f.style.fontSize = '23px'; f.style.color = '#ffd24a'
    f.style.textShadow = '0 2px 5px rgba(0,0,0,.85)'
    const jx = (Math.random() * 2 - 1) * 10, rot = (Math.random() * 2 - 1) * 8
    layer.appendChild(f)
    const a = f.animate([
      { transform: `translate(-50%,-50%) scale(.5) rotate(${rot}deg)`, opacity: 0 },
      { transform: `translate(calc(-50% + ${jx}px),-95%) scale(1.18) rotate(${rot}deg)`, opacity: 1, offset: 0.22 },
      { transform: `translate(calc(-50% + ${jx}px),-165%) scale(1) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: 820, easing: 'cubic-bezier(0.2,0.7,0.3,1)' })
    a.finished.then(() => f.remove()).catch(() => f.remove())
  }

  // ekran sarsıntısı — trauma modeli (offset = max*trauma^2)
  addTrauma = (t) => {
    if (this.reduced) return
    this.trauma = Math.min(1, (this.trauma || 0) + t)
    if (!this.shakeRAF) this.shakeRAF = requestAnimationFrame(this.shakeStep)
  }
  shakeStep = () => {
    const el = this.screenEl
    this.trauma = Math.max(0, (this.trauma || 0) - 0.045)
    if (el) {
      if (this.trauma > 0) {
        const s = 6 * this.trauma * this.trauma
        el.style.transform = `translate(${(Math.random() * 2 - 1) * s}px,${(Math.random() * 2 - 1) * s}px)`
      } else { el.style.transform = '' }
    }
    this.shakeRAF = this.trauma > 0 ? requestAnimationFrame(this.shakeStep) : null
  }

  replay = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls) }

  endGame = () => {
    clearInterval(this.timer)
    if (this.state.screen === 'over') return
    const wpm = Math.round(this.state.totalChars / 5 / (this.duration / 60))
    const best = Math.max(this.state.best, this.state.totalDamage)
    // ── Supabase: saveScore(totalDamage) when authenticated ──
    localStorage.setItem('wg_best', String(best))
    this.setState({ screen: 'over', wpm, best, displayScore: 0 }, () => {
      this.replay(this.gladOverEl, 'wg-victory')
      this.countUp(this.state.totalDamage)
    })
  }

  countUp = (target) => {
    const start = performance.now(), dur = 1200
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      this.setState({ displayScore: Math.round(target * eased) })
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  // ── navigation ──
  goMenu = () => { clearInterval(this.timer); this.setState({ screen: 'menu', showHelp: false }) }
  goBack = () => this.setState({ screen: this.prevScreen || 'menu' })
  openLeaderboard = () => { this.prevScreen = this.state.screen; this.setState({ screen: 'board' }) }
  toggleHelp = () => this.setState(s => ({ showHelp: !s.showHelp }))
  tabAll = () => this.setState({ lbTab: 'all' })
  tabWeek = () => this.setState({ lbTab: 'week' })
  tabMine = () => this.setState({ lbTab: 'mine' })

  setLang = (l) => { localStorage.setItem('wg_lang', l); this.setState({ lang: l }) }
  setEn = () => this.setLang('en')
  setTr = () => this.setLang('tr')

  // ── auth (mock; structured for Supabase auth) ──
  openLogin = () => this.setState({ showAuth: true, authTab: 'login', authError: '' })
  closeAuth = () => this.setState({ showAuth: false, authError: '' })
  closeAuthBg = () => this.setState({ showAuth: false, authError: '' })
  stop = (e) => { e.stopPropagation() }
  authLogin = () => this.setState({ authTab: 'login', authError: '' })
  authRegister = () => this.setState({ authTab: 'register', authError: '' })
  onAuthKey = (e) => { if (e.key === 'Enter') this.submitAuth() }
  playGuest = () => this.setState({ showAuth: false, authError: '' })
  logout = () => { localStorage.removeItem('wg_user'); this.setState({ user: null, lbTab: 'all' }) }
  togglePass = () => {
    const i = this.passInput; if (i) i.type = i.type === 'text' ? 'password' : 'text'
    this.setState(s => ({ passHidden: i ? i.type === 'password' : !s.passHidden }))
  }

  submitAuth = () => {
    const t = this.dict()
    const name = (this.userInput && this.userInput.value || '').trim()
    const pass = (this.passInput && this.passInput.value || '').trim()
    if (!name || !pass) return this.setState({ authError: t.errFill })
    if (name.length < 3) return this.setState({ authError: t.errName })
    if (pass.length < 4) return this.setState({ authError: t.errPass })
    // ── Supabase: loginUser / registerUser here ──
    localStorage.setItem('wg_user', name)
    this.setState({ user: name, showAuth: false, authError: '' })
  }

  render() {
    const s = this.state
    const t = this.dict()
    const dur = this.duration

    // timer
    const pct = Math.max(0, (s.timeLeft / dur) * 100)
    const barColor = s.timeLeft > dur * 0.5 ? '#f0a030' : s.timeLeft > 10 ? '#e0a040' : '#e05020'
    const low = s.timeLeft <= 10 && s.screen === 'game'
    const timerTextColor = low ? '#e05020' : '#f5e6c8'
    const timerAnim = low ? 'pulse .7s ease-in-out infinite' : 'none'
    const scoreAnim = s.scorePop ? 'scorePop .4s ease-out' : 'none'

    // 10fastfingers tarzı: kelimelerin ÜZERİNDE yazarsın. Geçilen kelimeler komple
    // yeşil/kırmızı; aktif kelime harf harf renklenir (doğru yeşil, yanlış kırmızı) + imleç.
    const q = s.queue, active = s.active, typed = s.typed
    const start = Math.max(0, active - 4), end = Math.min(q.length, start + 22)
    const eq = (a, b) => a.toLowerCase() === b.toLowerCase()
    const activeWord = q[active] || ''
    let currentHasError = typed.length > activeWord.length
    for (let j = 0; !currentHasError && j < Math.min(typed.length, activeWord.length); j++) {
      if (!eq(typed[j], activeWord[j])) currentHasError = true
    }
    const flowWords = []
    for (let i = start; i < end; i++) {
      const word = q[i] || ''
      if (i < active) {
        flowWords.push({ mode: 'plain', text: word, color: this.marks[i] === 'ok' ? '#7bc87a' : '#ff6b5a' })
      } else if (i > active) {
        flowWords.push({ mode: 'plain', text: word, color: '#d8c4a4' })
      } else {
        const upto = Math.max(word.length, typed.length)
        const cells = []
        for (let j = 0; j < upto; j++) {
          const cursor = j === typed.length
          if (j < typed.length) {
            if (j < word.length) {
              const ok = eq(typed[j], word[j])
              cells.push({ ch: word[j], color: ok ? '#7bc87a' : '#ff6b5a', bg: ok ? 'transparent' : 'rgba(224,80,32,.28)', cursor })
            } else {
              cells.push({ ch: typed[j], color: '#ff6b5a', bg: 'rgba(224,80,32,.28)', cursor })
            }
          } else {
            cells.push({ ch: word[j], color: '#fff8f0', bg: 'transparent', cursor })
          }
        }
        flowWords.push({ mode: 'active', cells, trailingCursor: typed.length >= cells.length, wbg: 'rgba(245,230,200,.10)' })
      }
    }

    // leaderboard rows
    const medal = (r) => r === 1 ? '#f0a030' : r === 2 ? '#c8c8c8' : r === 3 ? '#cd9060' : '#f5e6c8'
    let rows = [], showJoinBanner = false, showMineBanner = false
    if (s.lbTab === 'mine') {
      if (s.user) rows = [{ rank: 1, name: s.user + ' (' + t.you + ')', score: s.best, kills: s.best, color: '#f0a030', star: false, bg: '#4a2e18', leftBorder: '3px solid #f0a030' }]
      else showMineBanner = true
    } else {
      const base = (s.lbTab === 'week' ? LB_WEEK : LB_ALL).slice().sort((a, b) => b.score - a.score)
      rows = base.map((p, i) => ({
        rank: i + 1, name: p.name, score: p.score, kills: p.score,
        color: medal(i + 1), star: i === 0,
        bg: i % 2 ? 'transparent' : 'rgba(255,255,255,.03)', leftBorder: '3px solid transparent',
      }))
      if (s.user) {
        const inList = rows.find(r => r.name === s.user)
        if (!inList && s.best > 0) rows.push({ rank: '—', name: s.user + ' (' + t.you + ')', score: s.best, kills: s.best, color: '#f0a030', star: false, bg: '#4a2e18', leftBorder: '3px solid #f0a030' })
        else if (inList) { inList.name += ' (' + t.you + ')'; inList.bg = '#4a2e18'; inList.leftBorder = '3px solid #f0a030' }
      } else showJoinBanner = true
    }

    // tab/toggle helpers
    const active2 = (on) => on ? '#f0a030' : '#b8956a'
    const border = (on) => on ? '#f0a030' : 'transparent'
    const tabBg = (on) => on ? '#f0a030' : 'transparent'
    const tabFg = (on) => on ? '#2c1810' : '#b8956a'

    // UI fontu: temiz/okunaklı Rubik (her iki dilde Türkçe karakter destekli).
    // Marka başlığı "WORD ARCHER" ayrıca Press Start 2P kullanır (sabit yazılı).
    const pixelFont = "'Rubik', system-ui, sans-serif"
    const PF = "var(--pf,'Rubik',system-ui,sans-serif)"

    const isMenu = s.screen === 'menu', isGame = s.screen === 'game', isOver = s.screen === 'over', isBoard = s.screen === 'board'
    const authBtnLabel = s.authTab === 'login' ? t.enterArena : t.joinArena

    return (
      <div style={{ ...css(`--pf:${pixelFont};`), width: '100%', height: '100%', position: 'relative', background: 'transparent', overflow: 'hidden', fontFamily: "'Segoe UI',system-ui,sans-serif", color: '#f5e6c8', textShadow: '0 1px 3px rgba(0,0,0,.95), 0 2px 6px rgba(0,0,0,.75)' }}>

        {/* ═══════════ SCREEN 1 · MAIN MENU ═══════════ */}
        {isMenu && (
          <div className="wg-scrn" data-screen-label="Menu" style={css('position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;')}>
            {/* language toggle (top-left) */}
            <div style={css('position:absolute;top:18px;left:20px;z-index:5;display:flex;border:2px solid #8b6b4a;background:rgba(22,13,6,.82);')}>
              <button onClick={this.setEn} style={{ ...css('cursor:pointer;border:none;font-size:10px;padding:8px 11px;'), fontFamily: PF, background: tabBg(s.lang === 'en'), color: tabFg(s.lang === 'en') }}>EN</button>
              <button onClick={this.setTr} style={{ ...css('cursor:pointer;border:none;border-left:2px solid #8b6b4a;font-size:10px;padding:8px 11px;'), fontFamily: PF, background: tabBg(s.lang === 'tr'), color: tabFg(s.lang === 'tr') }}>TR</button>
            </div>

            {/* top-right account */}
            <div style={css('position:absolute;top:18px;right:20px;z-index:5;')}>
              {s.user ? (
                <div style={css('display:flex;align-items:center;gap:10px;background:#4a2e18;border:2px solid #8b6b4a;padding:8px 12px;')}>
                  <span style={css('color:#f0a030;font-size:13px;')}>{BOW}</span>
                  <span style={{ fontFamily: PF, fontSize: '9px', color: '#f0a030' }}>{s.user}</span>
                  <button onClick={this.logout} title="Log out" style={{ ...css('cursor:pointer;background:none;border:none;color:#b8956a;font-size:10px;'), fontFamily: PF }}>[x]</button>
                </div>
              ) : (
                <button className="wg-ghost" onClick={this.openLogin} style={{ ...css('cursor:pointer;background:rgba(22,13,6,.82);border:2px solid #f0a030;color:#f0a030;font-size:10px;padding:9px 14px;'), fontFamily: PF }}>{t.login}</button>
              )}
            </div>

            {/* title */}
            <div style={css('margin-top:64px;text-align:center;z-index:2;')}>
              <h1 style={css("font-family:'Press Start 2P',monospace;font-size:32px;line-height:1.4;color:#f0a030;text-shadow:3px 3px 0 #8b5a00;letter-spacing:1px;")}>
                <span style={css('color:#e05020;')}>{BOW}</span> WORD ARCHER <span style={css('color:#e05020;')}>{BOW}</span>
              </h1>
              <p style={{ ...css('font-size:12px;color:#f3e2bd;margin-top:18px;letter-spacing:1px;'), fontFamily: PF }}>{t.tagline}</p>
            </div>

            {/* character slots — karakterler arena taş platformunda durur (havada uçmaz) */}
            <div style={css('margin-top:14px;display:flex;flex-direction:column;align-items:center;z-index:2;')}>
              <div style={css('display:flex;align-items:flex-end;justify-content:center;gap:80px;height:150px;position:relative;z-index:2;')}>
                <div style={css('position:relative;display:flex;align-items:flex-end;')}>
                  <div style={css('position:absolute;left:50%;bottom:0;width:96px;height:14px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse at center, rgba(0,0,0,.5) 0%, rgba(0,0,0,0) 70%);z-index:0;')} />
                  <div ref={this.setMenuPlayerEl} className="wg-sprite" style={css('position:relative;z-index:1;')} />
                </div>
                <div style={css('position:relative;display:flex;align-items:flex-end;')}>
                  <div style={css('position:absolute;left:50%;bottom:0;width:84px;height:13px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse at center, rgba(0,0,0,.5) 0%, rgba(0,0,0,0) 70%);z-index:0;')} />
                  <div ref={this.setMenuEnemyEl} className="wg-sprite wg-flip" style={css('position:relative;z-index:1;')} />
                </div>
              </div>
              {/* arena açık taş platformu (parlak sahneye uygun) */}
              <div style={css('width:470px;max-width:88%;height:30px;margin-top:-10px;border-radius:8px;background:linear-gradient(#ecd6a4,#bd9560);border:2px solid #7a5a32;box-shadow:0 12px 26px rgba(0,0,0,.4), inset 0 3px 0 rgba(255,250,235,.55);z-index:1;')} />
            </div>

            {/* buttons */}
            <div style={css('margin-top:26px;display:flex;flex-direction:column;align-items:center;gap:12px;z-index:3;')}>
              <button className="wg-goldbtn" onClick={this.onPlay} style={{ ...css('cursor:pointer;background:#f0a030;color:#2c1810;font-size:16px;padding:18px 56px;border:none;box-shadow:4px 4px 0 #8b5a00;transition:transform .15s,box-shadow .15s;'), fontFamily: PF }}>{PLAY} {t.play}</button>
              <div style={css('display:flex;gap:12px;')}>
                <button className="wg-ghost" onClick={this.openLeaderboard} style={{ ...css('cursor:pointer;background:rgba(22,13,6,.82);border:2px solid #8b6b4a;color:#f5e6c8;font-size:11px;padding:12px 24px;'), fontFamily: PF }}>{t.leaderboard}</button>
                <button className="wg-ghost" onClick={this.toggleHelp} style={{ ...css('cursor:pointer;background:rgba(22,13,6,.82);border:2px solid #8b6b4a;color:#f5e6c8;font-size:11px;padding:12px 24px;'), fontFamily: PF }}>{t.howTo}</button>
              </div>
            </div>

            {/* how-to-play popover */}
            {s.showHelp && (
              <div onClick={this.toggleHelp} style={css('position:absolute;inset:0;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;z-index:8;')}>
                <div style={css('background:rgba(20,12,6,.97);border:2px solid #5c3d24;border-radius:12px;max-width:480px;padding:28px;box-shadow:0 16px 40px rgba(0,0,0,.6);')}>
                  <h3 style={{ ...css('font-size:14px;color:#f0a030;margin-bottom:16px;'), fontFamily: PF }}>{t.helpTitle}</h3>
                  <p style={css('font-size:15px;line-height:1.9;color:#fbf2dd;')}>{t.helpA} <span style={css('color:#7bc87a;')}>{t.helpType}</span> {t.helpB} <span style={css('color:#f0a030;')}>{dur} {t.seconds}</span> {t.helpC}</p>
                  <p style={css('font-size:12px;color:#b8956a;margin-top:16px;')}>{t.helpEsc}</p>
                  <p style={css('font-size:10px;color:#7a5e42;margin-top:14px;')}>Archer art: CraftPix.net · Goblin: LuizMelo (CC0)</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ SCREEN 2 · GAME ═══════════ */}
        {isGame && (
          <div className="wg-scrn" data-screen-label="Game" onClick={this.focusInput} style={css('position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;')}>
            {/* arena */}
            <div style={css('position:relative;flex:1;display:flex;flex-direction:column;overflow:hidden;')}>
              {/* tek birleşik panel: üst süre çizgisi + stat satırı (HASAR·SÜRE·YANLIŞ) + kelimeler */}
              <div style={css('padding:20px 0 8px;display:flex;flex-direction:column;align-items:center;')}>
                <div style={{ ...css('width:90%;max-width:880px;background:rgba(16,9,4,.82);border-radius:14px;overflow:hidden;'), border: `2px solid ${currentHasError ? '#e05020' : '#5c3d24'}`, transition: 'border-color .12s ease', boxShadow: '0 8px 24px rgba(0,0,0,.35)' }}>
                  {/* süre ilerleme çizgisi — panelin üst kenarı */}
                  <div style={css('height:4px;background:rgba(0,0,0,.45);')}>
                    <div style={{ ...css('height:100%;transition:width 1s linear,background .4s;'), width: `${pct.toFixed(2)}%`, background: barColor }}></div>
                  </div>
                  {/* stat satırı */}
                  <div style={css('display:flex;align-items:center;justify-content:space-between;padding:9px 18px;border-bottom:1px solid rgba(92,61,36,.55);')}>
                    <div style={css('display:flex;align-items:baseline;gap:7px;')}>
                      <span style={{ ...css('font-size:9px;letter-spacing:.5px;color:#b8956a;'), fontFamily: PF }}>{t.damage}</span>
                      <span style={{ ...css('font-size:19px;color:#f0a030;'), fontFamily: PF, animation: scoreAnim }}>{s.totalDamage}</span>
                    </div>
                    <div style={{ ...css('font-size:18px;'), fontFamily: PF, animation: timerAnim, color: timerTextColor }}>{s.timeLeft}s</div>
                    <div style={css('display:flex;align-items:baseline;gap:7px;')}>
                      <span style={{ ...css('font-size:19px;color:#ff6b5a;'), fontFamily: PF }}>{s.misses}</span>
                      <span style={{ ...css('font-size:9px;letter-spacing:.5px;color:#b8956a;'), fontFamily: PF }}>{t.wrong}</span>
                    </div>
                  </div>
                  {/* kelimeler — üzerinde yazarak ilerlersin */}
                  <div style={css('padding:18px 24px;min-height:96px;display:flex;flex-wrap:wrap;justify-content:center;align-content:flex-start;gap:8px 14px;line-height:1.5;')}>
                    {flowWords.map((w, wi) => (
                      w.mode === 'active' ? (
                        <span key={wi} style={{ ...css('display:inline-flex;align-items:center;padding:3px 9px;border-radius:6px;font-size:26px;font-weight:500;'), fontFamily: PF, background: w.wbg }}>
                          {w.cells.map((c, j) => (
                            <React.Fragment key={j}>
                              {c.cursor && <span className="wg-cursor"></span>}
                              <span style={{ color: c.color, background: c.bg, borderRadius: '3px' }}>{c.ch}</span>
                            </React.Fragment>
                          ))}
                          {w.trailingCursor && <span className="wg-cursor"></span>}
                        </span>
                      ) : (
                        <span key={wi} style={{ ...css('padding:3px 9px;border-radius:6px;font-size:26px;font-weight:500;'), fontFamily: PF, color: w.color }}>{w.text}</span>
                      )
                    ))}
                  </div>
                </div>
              </div>

              {/* arena sahnesi (ekran sarsıntısı buraya uygulanır; kelime bloğu DIŞARIDA kalır) */}
              <div ref={this.setScreen} style={css('position:relative;flex:1;display:flex;align-items:flex-end;justify-content:center;gap:120px;padding:0 90px;will-change:transform;')}>
                {/* oyuncu — okçu (solda, sağa bakar, yay çeker) */}
                <div ref={this.setPlayerFx} style={css('display:inline-block;transform-origin:center bottom;')}>
                  <div ref={this.setPlayerSpriteEl} className="wg-sprite" />
                </div>
                {/* düşman — goblin (sağda, sola bakar, sabit hedef; ölmez, sarsılır) */}
                <div ref={this.setEnemyFx} style={css('display:inline-block;transform-origin:center bottom;')}>
                  <div ref={this.setEnemySpriteEl} className="wg-sprite wg-flip" />
                </div>
                <div style={css('position:absolute;left:0;right:0;bottom:0;height:4px;background:#e8c87a;opacity:.55;')}></div>
                {/* mermi / kıvılcım / hasar sayıları katmanı */}
                <div ref={this.setFxLayer} className="wg-fxlayer" />
              </div>

              {/* görünmez giriş — tıklayınca odak buraya gelir, tuşları yakalar (ayrı kutu görünmez) */}
              <input ref={this.setInput} className="wg-input" type="text" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} onKeyDown={this.onGameKey} onChange={this.clearNative} style={css('position:absolute;inset:0;opacity:0;border:none;cursor:text;background:transparent;')} />
            </div>
          </div>
        )}

        {/* ═══════════ SCREEN 3 · GAME OVER ═══════════ */}
        {isOver && (
          <div className="wg-scrn" data-screen-label="Round Complete" style={css('position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;overflow:hidden;')}>
            <h1 style={{ ...css('font-size:20px;color:#f0a030;text-shadow:2px 2px 0 #8b5a00;z-index:2;'), fontFamily: PF }}>{t.roundComplete}</h1>

            <div style={css('background:rgba(74,46,24,.92);border:2px solid #5c3d24;border-radius:10px;padding:22px 36px;text-align:center;min-width:380px;z-index:2;')}>
              <div style={{ ...css('font-size:58px;color:#f0a030;text-shadow:3px 3px 0 #8b5a00;'), fontFamily: PF }}>{s.displayScore}</div>
              <div style={{ ...css('font-size:10px;color:#b8956a;letter-spacing:1px;margin-top:8px;'), fontFamily: PF }}>{t.yourScore}</div>
              <div style={css('height:1px;background:#5c3d24;margin:20px 0;')}></div>
              <div style={css('display:flex;gap:14px;justify-content:center;')}>
                <div style={css('background:#5a3820;border:1px solid #5c3d24;border-radius:8px;padding:14px 20px;min-width:96px;')}>
                  <div style={{ ...css('font-size:9px;color:#b8956a;'), fontFamily: PF }}>{t.damage}</div>
                  <div style={{ ...css('font-size:20px;color:#f0a030;margin-top:8px;'), fontFamily: PF }}>{s.totalDamage}</div>
                </div>
                <div style={css('background:#5a3820;border:1px solid #5c3d24;border-radius:8px;padding:14px 20px;min-width:96px;')}>
                  <div style={{ ...css('font-size:9px;color:#b8956a;'), fontFamily: PF }}>{t.wrong}</div>
                  <div style={{ ...css('font-size:20px;color:#ff6b5a;margin-top:8px;'), fontFamily: PF }}>{s.misses}</div>
                </div>
                <div style={css('background:#5a3820;border:1px solid #5c3d24;border-radius:8px;padding:14px 20px;min-width:96px;')}>
                  <div style={{ ...css('font-size:9px;color:#b8956a;'), fontFamily: PF }}>WPM</div>
                  <div style={{ ...css('font-size:20px;color:#f5e6c8;margin-top:8px;'), fontFamily: PF }}>{s.wpm}</div>
                </div>
                <div style={css('background:#5a3820;border:1px solid #5c3d24;border-radius:8px;padding:14px 20px;min-width:96px;')}>
                  <div style={{ ...css('font-size:9px;color:#b8956a;'), fontFamily: PF }}>{t.best}</div>
                  <div style={{ ...css('font-size:20px;color:#f0a030;margin-top:8px;'), fontFamily: PF }}>{s.best}</div>
                </div>
              </div>
            </div>

            {/* victory slot — okçu zafer pozu */}
            <div style={css('z-index:2;')}>
              <div ref={this.setGladOver} className="wg-victory" style={css('display:inline-block;transform-origin:center bottom;')}>
                <div ref={this.setVictoryEl} className="wg-sprite" />
              </div>
            </div>

            <div style={css('display:flex;flex-direction:column;align-items:center;gap:12px;z-index:2;')}>
              <button className="wg-goldbtn" onClick={this.onPlay} style={{ ...css('cursor:pointer;background:#f0a030;color:#2c1810;font-size:15px;padding:16px 48px;min-width:280px;border:none;box-shadow:4px 4px 0 #8b5a00;transition:transform .15s,box-shadow .15s;'), fontFamily: PF }}>{t.playAgain}</button>
              <div style={css('display:flex;gap:12px;')}>
                <button className="wg-ghost" onClick={this.openLeaderboard} style={{ ...css('cursor:pointer;background:rgba(22,13,6,.82);border:2px solid #8b6b4a;color:#f5e6c8;font-size:11px;padding:11px 18px;'), fontFamily: PF }}>{t.leaderboard}</button>
                <button className="wg-ghost" onClick={this.goMenu} style={{ ...css('cursor:pointer;background:rgba(22,13,6,.82);border:2px solid #8b6b4a;color:#f5e6c8;font-size:11px;padding:11px 18px;'), fontFamily: PF }}>{t.mainMenu}</button>
              </div>
            </div>

            {!s.user && (
              <div style={css('display:flex;align-items:center;gap:12px;background:#4a2e18;border-left:4px solid #f0a030;padding:12px 16px;z-index:2;')}>
                <span style={css('font-size:13px;color:#f5e6c8;')}>{t.guestSave} <span style={css('color:#f0a030;')}>{t.guestCreate}</span></span>
                <button className="wg-ghost" onClick={this.openLogin} style={{ ...css('cursor:pointer;background:rgba(22,13,6,.82);border:2px solid #8b6b4a;color:#f5e6c8;font-size:9px;padding:8px 12px;'), fontFamily: PF }}>{t.login}</button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ SCREEN 4 · LEADERBOARD ═══════════ */}
        {isBoard && (
          <div className="wg-scrn" data-screen-label="Leaderboard" style={css('position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;background:rgba(14,9,4,.88);')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between;background:rgba(26,15,8,.82);border-bottom:2px solid #5c3d24;padding:16px 22px;')}>
              <button className="wg-ghost" onClick={this.goBack} style={{ ...css('cursor:pointer;background:rgba(22,13,6,.82);border:2px solid #8b6b4a;color:#f5e6c8;font-size:10px;padding:9px 13px;'), fontFamily: PF }}>{LARR} {t.back}</button>
              <h2 style={{ ...css('font-size:14px;color:#f0a030;'), fontFamily: PF }}>{t.leaderboard}</h2>
              <div style={css('width:70px;')}></div>
            </div>

            <div style={css('display:flex;gap:4px;padding:16px 22px 0;')}>
              <button className="wg-tab" onClick={this.tabAll} style={{ ...css('cursor:pointer;background:none;border:none;font-size:11px;padding:8px 14px;'), fontFamily: PF, borderBottom: `3px solid ${border(s.lbTab === 'all')}`, color: active2(s.lbTab === 'all') }}>{t.allTime}</button>
              <button className="wg-tab" onClick={this.tabWeek} style={{ ...css('cursor:pointer;background:none;border:none;font-size:11px;padding:8px 14px;'), fontFamily: PF, borderBottom: `3px solid ${border(s.lbTab === 'week')}`, color: active2(s.lbTab === 'week') }}>{t.thisWeek}</button>
              <button className="wg-tab" onClick={this.tabMine} style={{ ...css('cursor:pointer;background:none;border:none;font-size:11px;padding:8px 14px;'), fontFamily: PF, borderBottom: `3px solid ${border(s.lbTab === 'mine')}`, color: active2(s.lbTab === 'mine') }}>{t.myScores}</button>
            </div>

            <div style={css('flex:1;overflow:auto;padding:8px 22px 22px;')}>
              <div style={{ ...css('display:grid;grid-template-columns:48px 1fr 90px 80px;background:#5a3820;border-bottom:2px solid #5c3d24;font-size:9px;color:#b8956a;padding:12px 14px;'), fontFamily: PF }}>
                <span>#</span><span>{t.player}</span><span style={css('text-align:right;')}>{t.score}</span><span style={css('text-align:right;')}>{t.damage}</span>
              </div>
              {rows.map((r, ri) => (
                <div key={ri} style={{ ...css('display:grid;grid-template-columns:48px 1fr 90px 80px;align-items:center;padding:13px 14px;font-size:14px;'), background: r.bg, borderLeft: r.leftBorder }}>
                  <span style={{ ...css('font-size:11px;'), fontFamily: PF, color: r.color }}>{r.rank}</span>
                  <span style={{ ...css('display:flex;align-items:center;gap:7px;font-weight:600;'), color: r.color }}>
                    {r.star && <span style={css('color:#f0a030;')}>{STAR}</span>}
                    {r.name}
                  </span>
                  <span style={{ ...css('text-align:right;font-size:11px;'), fontFamily: PF, color: r.color }}>{r.score}</span>
                  <span style={{ ...css('text-align:right;font-size:11px;color:#b8956a;'), fontFamily: PF }}>{r.kills}</span>
                </div>
              ))}

              {showJoinBanner && (
                <div style={css('margin-top:16px;text-align:center;background:#4a2e18;border-left:4px solid #f0a030;padding:14px;font-size:13px;color:#f5e6c8;')}>{t.loginToJoin}</div>
              )}
              {showMineBanner && (
                <div style={css('margin-top:16px;text-align:center;background:#4a2e18;border-left:4px solid #f0a030;padding:14px;font-size:13px;color:#f5e6c8;')}>{t.loginFirst}</div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ AUTH OVERLAY ═══════════ */}
        {s.showAuth && (
          <div onClick={this.closeAuthBg} style={css('position:absolute;inset:0;z-index:100;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;')}>
            <div onClick={this.stop} style={css('position:relative;background:#4a2e18;border:2px solid #5c3d24;border-radius:16px;width:420px;padding:34px;')}>
              <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;')}>
                <div style={css("font-family:'Press Start 2P',monospace;font-size:13px;color:#f0a030;")}><span style={css('color:#e05020;')}>{BOW}</span> WORD ARCHER</div>
                <button onClick={this.closeAuth} style={{ ...css('cursor:pointer;background:none;border:none;color:#b8956a;font-size:12px;'), fontFamily: PF }}>X</button>
              </div>

              <div style={css('display:flex;gap:4px;margin-bottom:20px;border-bottom:1px solid #5c3d24;')}>
                <button onClick={this.authLogin} style={{ ...css('cursor:pointer;flex:1;background:none;border:none;font-size:11px;padding:10px 0;'), fontFamily: PF, borderBottom: `3px solid ${border(s.authTab === 'login')}`, color: active2(s.authTab === 'login') }}>{t.login}</button>
                <button onClick={this.authRegister} style={{ ...css('cursor:pointer;flex:1;background:none;border:none;font-size:11px;padding:10px 0;'), fontFamily: PF, borderBottom: `3px solid ${border(s.authTab === 'register')}`, color: active2(s.authTab === 'register') }}>{t.register}</button>
              </div>

              <label style={{ ...css('display:block;font-size:9px;color:#b8956a;margin-bottom:8px;'), fontFamily: PF }}>{t.username}</label>
              <input ref={this.setUserInput} className="wg-auth" type="text" autoComplete="off" onKeyDown={this.onAuthKey} style={css("width:100%;background:#3d2410;border:1px solid #8b6b4a;border-radius:4px;color:#f5e6c8;font-size:15px;padding:14px;margin-bottom:16px;font-family:'Segoe UI',sans-serif;")} />

              <label style={{ ...css('display:block;font-size:9px;color:#b8956a;margin-bottom:8px;'), fontFamily: PF }}>{t.password}</label>
              <div style={css('position:relative;margin-bottom:6px;')}>
                <input ref={this.setPassInput} className="wg-auth" type="password" autoComplete="off" onKeyDown={this.onAuthKey} style={css("width:100%;background:#3d2410;border:1px solid #8b6b4a;border-radius:4px;color:#f5e6c8;font-size:15px;padding:14px 46px 14px 14px;font-family:'Segoe UI',sans-serif;")} />
                <button onClick={this.togglePass} title="Show/Hide" style={css('position:absolute;right:8px;top:50%;transform:translateY(-50%);cursor:pointer;background:none;border:none;padding:6px;display:flex;color:#b8956a;')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                    {s.passHidden && <line x1="2" y1="2" x2="22" y2="22" />}
                  </svg>
                </button>
              </div>

              {s.authError && (
                <div className="wg-err" style={css('color:#e05020;font-size:12px;margin-bottom:12px;')}>{s.authError}</div>
              )}

              <button className="wg-goldbtn" onClick={this.submitAuth} style={{ ...css('cursor:pointer;width:100%;background:#f0a030;color:#2c1810;font-size:12px;padding:16px;border:none;box-shadow:3px 3px 0 #8b5a00;transition:transform .15s,box-shadow .15s;margin-top:8px;'), fontFamily: PF }}>{authBtnLabel}</button>

              <div style={css('display:flex;align-items:center;gap:10px;margin:18px 0;')}>
                <div style={css('flex:1;height:1px;background:#5c3d24;')}></div>
                <span style={css('font-size:11px;color:#b8956a;')}>{t.or}</span>
                <div style={css('flex:1;height:1px;background:#5c3d24;')}></div>
              </div>
              <button className="wg-ghost" onClick={this.playGuest} style={{ ...css('cursor:pointer;width:100%;background:transparent;border:2px solid #8b6b4a;color:#b8956a;font-size:11px;padding:14px;'), fontFamily: PF }}>{t.continueGuest}</button>
            </div>
          </div>
        )}

      </div>
    )
  }
}
