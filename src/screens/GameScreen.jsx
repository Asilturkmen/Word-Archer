import React, { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Game, COMBO_TIERS, nextTierAt, REACH_DIST } from '../lib/engine.js'
import { SPRITES, ENEMY_SCALE } from '../lib/assets.js'
import { sfx } from '../lib/audio.js'
import SpriteView from '../components/SpriteView.jsx'
import Icon from '../components/Icon.jsx'
import { useApp, Button, Kbd } from '../components/ui.jsx'

// ── sahne yerleşimi (1000×660 sahne pikseli) ──
const FEET_Y = 624
const ARCHER_SCALE = 2.5
const RELEASE_MS = 200 // yay bırakma karesi
const FLIGHT_MS = 150 // okun uçuş süresi
const IMPACT_MS = RELEASE_MS + FLIGHT_MS
const MULT_COLORS = ['#f5e6c8', '#ffd24a', '#ff9a3c', '#ff5a3c']

function enemyGeom(kind) {
  const d = SPRITES[kind], s = ENEMY_SCALE[kind]
  return {
    scale: s,
    w: d.frameW * s,
    h: d.frameH * s,
    cxPx: (d.frameW - d.cx) * s, // ayna çevrildiği için merkez sağdan ölçülür
    headPx: (d.frameH - d.top) * s,
    footPx: d.footPad * s,
  }
}
const ARCHER = (() => {
  const d = SPRITES.archer
  return { w: d.frameW * ARCHER_SCALE, h: d.frameH * ARCHER_SCALE, cxPx: d.cx * ARCHER_SCALE }
})()

export default function GameScreen({ config, onEnd, onQuit, onRestart }) {
  const { t, settings, reduced } = useApp()
  const [game] = useState(() => new Game(config))
  const subscribe = useCallback((cb) => game.subscribe((type) => { if (type === 'change') cb() }), [game])
  useSyncExternalStore(subscribe, () => game.version)

  const walking = game.cfg.walking
  const archerX = walking ? 150 : 250
  const shakeOn = settings.shake && !reduced

  // ── görünüm durumu ──
  const [shown, setShown] = useState(() => ({ enemy: game.enemy, hp: game.enemy.maxHp }))
  const [corpses, setCorpses] = useState([])
  const [splash, setSplash] = useState(null)
  const [ending, setEnding] = useState(null)
  const shownRef = useRef(shown)
  shownRef.current = shown

  const inputRef = useRef(null)
  const archerRef = useRef(null)
  const enemyRef = useRef(null)
  const enemyWrapRef = useRef(null)
  const fxRef = useRef(null)
  const arenaRef = useRef(null)
  const barRef = useRef(null)
  const flashRef = useRef(null)
  const view = useRef({ disp: game.enemy.dist + 220, busy: false, trauma: 0, tabAt: 0 })
  const timers = useRef(new Set())
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  const later = useCallback((ms, fn) => {
    const id = setTimeout(() => { timers.current.delete(id); fn() }, ms)
    timers.current.add(id)
  }, [])
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current.clear() }, [])

  const focusInput = useCallback(() => { inputRef.current && inputRef.current.focus({ preventScroll: true }) }, [])
  useEffect(() => { focusInput() }, [focusInput])

  // ── efekt yardımcıları (havuzsuz ama sınırlı DOM; Web Animations API) ──
  const enemyPos = () => {
    const e = shownRef.current.enemy, g = enemyGeom(e.kind)
    const x = archerX + view.current.disp
    return { x, body: FEET_Y - g.headPx * 0.5, head: FEET_Y - g.headPx }
  }

  const addTrauma = (v) => {
    if (!shakeOn) return
    view.current.trauma = Math.min(1, view.current.trauma + v)
  }

  const spawn = (cls, x, y, style = {}) => {
    const layer = fxRef.current
    if (!layer) return null
    const el = document.createElement('div')
    el.className = cls
    el.style.left = x + 'px'
    el.style.top = y + 'px'
    Object.assign(el.style, style)
    layer.appendChild(el)
    return el
  }
  const animate = (el, frames, opts) => {
    if (!el) return
    const a = el.animate(frames, opts)
    a.finished.then(() => el.remove()).catch(() => el.remove())
  }

  const floater = (x, y, text, color = '#ffd24a', size = 24) => {
    const layer = fxRef.current
    if (!layer || layer.querySelectorAll('.fx-floater').length > 10) return
    const el = spawn('fx-floater', x, y, { color, fontSize: size + 'px' })
    el.textContent = text
    const jx = (Math.random() * 2 - 1) * 14, rot = (Math.random() * 2 - 1) * 7
    if (reduced) { animate(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 700 }); return }
    animate(el, [
      { transform: `translate(-50%,-50%) scale(.5) rotate(${rot}deg)`, opacity: 0 },
      { transform: `translate(calc(-50% + ${jx}px),-110%) scale(1.15) rotate(${rot}deg)`, opacity: 1, offset: 0.2 },
      { transform: `translate(calc(-50% + ${jx}px),-190%) scale(1) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: 900, easing: 'cubic-bezier(.2,.7,.3,1)' })
  }

  const sparks = (x, y, n, colors) => {
    if (reduced || !fxRef.current || fxRef.current.querySelectorAll('.fx-spark').length > 70) return
    for (let i = 0; i < n; i++) {
      const sz = 2 + Math.random() * 4
      const el = spawn('fx-spark', x, y, { width: sz + 'px', height: sz + 'px', background: colors[i % colors.length] })
      const ang = Math.PI + (Math.random() - 0.5) * 2.2
      const sp = 40 + Math.random() * 130
      animate(el, [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * sp}px,${Math.sin(ang) * sp + 60}px) scale(.3)`, opacity: 0 },
      ], { duration: 320 + Math.random() * 260, easing: 'cubic-bezier(.2,.6,.3,1)' })
    }
  }

  const ring = (x, y, color = '#ffd24a', size = 3.4) => {
    if (reduced) return
    const el = spawn('fx-ring', x - 5, y - 5, { borderColor: color })
    animate(el, [{ transform: 'scale(.4)', opacity: 0.9 }, { transform: `scale(${size})`, opacity: 0 }], { duration: 260, easing: 'ease-out' })
  }

  const arrow = (mult) => {
    const from = { x: archerX - ARCHER.cxPx + 62 * ARCHER_SCALE, y: FEET_Y - 38 * ARCHER_SCALE }
    const p = enemyPos()
    const to = { x: p.x - 14, y: p.body }
    const dx = to.x - from.x, dy = to.y - from.y
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI
    const el = spawn(`fx-arrow ${mult >= 3 ? 'fire' : ''}`, from.x, from.y, { transform: `rotate(${ang}deg)` })
    if (!el) return
    el.innerHTML = '<i class="fletch"></i><i class="head"></i>'
    animate(el, [
      { transform: `translate(0,0) rotate(${ang}deg)` },
      { transform: `translate(${dx}px,${dy}px) rotate(${ang}deg)` },
    ], { duration: reduced ? 1 : FLIGHT_MS, easing: 'linear' })
  }

  const enemyFlinch = () => {
    const sp = enemyRef.current
    if (!sp || !sp.el) return
    if (!reduced) {
      sp.el.animate([{ filter: 'brightness(2) saturate(.4)' }, { filter: 'none' }], { duration: 140, easing: 'ease-out' })
      if (!walking) {
        sp.el.parentElement.animate([
          { transform: 'translateX(0)' }, { transform: 'translateX(12px)', offset: 0.22 },
          { transform: 'translateX(-3px)', offset: 0.6 }, { transform: 'translateX(0)' },
        ], { duration: 300, easing: 'cubic-bezier(.34,1.56,.64,1)' })
      }
    }
    view.current.busy = true
    sp.once('hit', null, () => { view.current.busy = false })
  }

  // ── oyun olayları -> görsel/ses ──
  useEffect(() => game.subscribe((type, d) => {
    switch (type) {
      case 'shoot': {
        archerRef.current && archerRef.current.once('shoot', 'idle')
        sfx.shoot(d.mult)
        later(reduced ? 0 : RELEASE_MS, () => arrow(d.mult))
        later(reduced ? 0 : IMPACT_MS, () => {
          const p = enemyPos()
          sfx.hit(d.mult)
          sparks(p.x - 10, p.body, 7 + d.mult * 2, ['#fff4d0', '#f0a030'])
          ring(p.x - 10, p.body)
          floater(p.x + 30, p.head - 58, `+${d.pts}`, MULT_COLORS[d.mult - 1], 20 + d.mult * 2)
          addTrauma(0.18 + d.mult * 0.04)
        })
        break
      }
      case 'hit': {
        const id = d.enemy.id, hp = d.enemy.hp
        later(reduced ? 0 : IMPACT_MS, () => {
          if (shownRef.current.enemy.id !== id) return
          setShown((s) => (s.enemy.id === id ? { ...s, hp } : s))
          if (hp > 0) enemyFlinch()
        })
        break
      }
      case 'kill': {
        const { enemy, bonus, next } = d
        later(reduced ? 0 : IMPACT_MS + 20, () => {
          const p = enemyPos()
          sfx.kill()
          sparks(p.x, p.body, 18, ['#ffd24a', '#fff4d0', '#ff9a3c'])
          ring(p.x, p.body, '#ffd24a', 5)
          floater(p.x, p.head - 90, `+${bonus}`, '#ffd24a', 30)
          addTrauma(0.42)
          setCorpses((c) => [...c.slice(-3), { id: enemy.id, kind: enemy.kind, x: p.x }])
          later(1400, () => setCorpses((c) => c.filter((k) => k.id !== enemy.id)))
          view.current.disp = next.dist + 220
          view.current.busy = false
          setShown({ enemy: next, hp: next.hp })
        })
        break
      }
      case 'miss': {
        sfx.miss()
        const a = archerRef.current
        if (a && a.el && !reduced) a.el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(0)' }], { duration: 160 })
        if (d.lostStreak >= 5) {
          sfx.comboBreak()
          setSplash({ key: Date.now(), text: t('comboBroken'), kind: 'bad' })
        }
        break
      }
      case 'combo':
        sfx.combo(d.mult)
        setSplash({ key: Date.now(), text: t('comboUp', { n: d.mult }), kind: `m${d.mult}` })
        break
      case 'hurt': {
        sfx.hurt()
        archerRef.current && archerRef.current.once('hit', 'idle')
        const sp = enemyRef.current
        if (sp) { view.current.busy = true; sp.once('attack', null, () => { view.current.busy = false }) }
        if (flashRef.current && !reduced) flashRef.current.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 520, easing: 'ease-out' })
        addTrauma(0.7)
        floater(archerX, FEET_Y - ARCHER.h + 10, '-1 ♥', '#ff6b5a', 26)
        if (d.lostStreak >= 5) setSplash({ key: Date.now(), text: t('comboBroken'), kind: 'bad' })
        break
      }
      case 'second':
        if (d.sec <= 5 && d.sec > 0) sfx.tick(d.sec <= 3)
        break
      case 'end': {
        setEnding(d.reason)
        if (d.reason === 'dead') archerRef.current && archerRef.current.once('death', null)
        sfx.over(d.reason !== 'dead')
        const wait = d.reason === 'quit' ? 350 : reduced ? 800 : 1600
        later(wait, () => onEndRef.current(game.result()))
        break
      }
      default:
    }
  }), [game]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── kare döngüsü: motor + düşman konumu + süre çubuğu + sarsıntı ──
  useEffect(() => {
    let raf, last = performance.now()
    const loop = (now) => {
      const dt = Math.min(now - last, 100)
      last = now
      game.update(dt)
      const v = view.current
      const e = shownRef.current.enemy
      const wrap = enemyWrapRef.current
      if (wrap) {
        v.disp += (e.dist - v.disp) * (1 - Math.exp(-dt / (walking ? 70 : 110)))
        const g = enemyGeom(e.kind)
        wrap.style.transform = `translate(${(archerX + v.disp - g.cxPx).toFixed(1)}px, ${(FEET_Y - g.h + g.footPx).toFixed(1)}px)`
        const moving = Math.abs(e.dist - v.disp) > 4 || (walking && e === game.enemy && e.stun === 0 && game.status === 'running')
        const sp = enemyRef.current
        if (sp && !v.busy) sp.play(moving ? 'walk' : 'idle')
        if (walking && arenaRef.current) {
          const danger = Math.max(0, Math.min(1, (300 - (v.disp - REACH_DIST)) / 260))
          arenaRef.current.style.setProperty('--danger', danger.toFixed(2))
        }
      }
      if (barRef.current && game.cfg.timed) barRef.current.style.transform = `scaleX(${game.timeLeft / (game.duration * 1000)})`
      const arena = arenaRef.current
      if (arena) {
        if (v.trauma > 0) {
          v.trauma = Math.max(0, v.trauma - dt * 0.0026)
          const s = 7 * v.trauma * v.trauma
          arena.style.transform = `translate(${((Math.random() * 2 - 1) * s).toFixed(1)}px,${((Math.random() * 2 - 1) * s).toFixed(1)}px)`
        } else if (arena.style.transform) arena.style.transform = ''
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [game, walking, archerX])

  // ── duraklatma: sekme gizlenince / odak kaybolunca ──
  useEffect(() => {
    const onVis = () => { if (document.hidden) game.pause() }
    const onBlurWin = () => game.pause()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', onBlurWin)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', onBlurWin)
    }
  }, [game])

  const resume = useCallback(() => { game.resume(); focusInput() }, [game, focusInput])
  const togglePause = useCallback(() => {
    if (game.status === 'running') game.pause()
    else if (game.status === 'paused') resume()
  }, [game, resume])
  const finish = useCallback(() => { game.resume(); game.end('quit') }, [game])

  const onKeyDown = (e) => {
    const now = performance.now()
    if (game.status === 'ended') { e.preventDefault(); return } // tur kaydedilmeden yeniden başlatma yok
    if (e.key === 'Tab') {
      if (game.status === 'paused') return // duraklatma menüsünde Tab ile gezinilebilsin
      e.preventDefault(); view.current.tabAt = now; return
    }
    if (e.key !== 'Enter') { view.current.tabAt = 0; }
    if (e.key === 'Enter') {
      e.preventDefault()
      const chord = now - view.current.tabAt < 1200
      view.current.tabAt = 0
      if (chord) { onRestart(); return }
      if (game.status === 'paused') { resume(); return }
      game.submit()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      if (game.status === 'ready') onQuit()
      else togglePause()
    }
  }

  // Duraklatma ekranı açılınca odağı "Devam et"e ver (klavyeyle tüm seçeneklere erişilsin)
  const resumeBtnRef = useRef(null)
  useEffect(() => {
    if (game.status === 'paused' && !ending && resumeBtnRef.current) resumeBtnRef.current.focus({ preventScroll: true })
  }, [game.status, ending])

  // Duraklatma ekranı açıkken (odak butonlarda) klavye
  useEffect(() => {
    if (game.status !== 'paused') return
    const onKey = (e) => {
      if (e.target === inputRef.current) return
      if (e.key === 'Escape') { e.preventDefault(); resume() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const onInput = (e) => game.input(e.target.value)
  const onBlur = () => { if (game.status === 'running') game.pause() }
  const restart = () => { if (game.status !== 'ended') onRestart() }
  const keepFocus = (e) => e.preventDefault() // HUD butonları odağı çalmasın

  // ── render ──
  const status = game.status
  const mult = game.multiplier
  const tierNext = nextTierAt(game.streak)
  const tierPrev = COMBO_TIERS[mult - 1]
  const tierPct = tierNext ? ((game.streak - tierPrev) / (tierNext - tierPrev)) * 100 : 100
  const liveWpm = game.elapsed > 2500 ? Math.round(game.correctChars / 5 / (game.elapsed / 60000)) : null
  const secLeft = game.cfg.timed ? Math.ceil(game.timeLeft / 1000) : null
  const low = secLeft != null && secLeft <= 10 && status !== 'ready'
  const e = shown.enemy
  const eg = enemyGeom(e.kind)
  const hpPct = Math.max(0, (shown.hp / e.maxHp) * 100)
  const elapsedFmt = `${Math.floor(game.elapsed / 60000)}:${String(Math.floor(game.elapsed / 1000) % 60).padStart(2, '0')}`

  return (
    <div className="screen game-screen" onMouseDown={(ev) => { if (!ev.target.closest('button')) { ev.preventDefault(); if (status === 'paused') resume(); else focusInput() } }}>
      {/* ── üst panel: süre çubuğu + istatistik + kelimeler ── */}
      <div className={`play-panel ${game.typed && !game.typedOk ? 'err' : ''}`}>
        <div className="timebar">{game.cfg.timed && <div ref={barRef} className={`timebar-fill ${low ? 'low' : ''}`} />}</div>
        <div className="hud">
          <div className="hud-left">
            <div className="stat">
              <span className="stat-label">{t('score')}</span>
              <span key={game.score} className="stat-value pixel pop">{game.score}</span>
            </div>
            <div className="stat stat-sm" title={t('kills')}>
              <Icon name="skull" size={15} />
              <span className="stat-value">{game.kills}</span>
            </div>
          </div>

          <div className="hud-center">
            {game.cfg.timed && <div className={`timer pixel ${low ? 'low' : ''}`}>{secLeft}</div>}
            {walking && (
              <div className="hearts" aria-label={t('hearts', { n: game.hearts })}>
                {Array.from({ length: game.cfg.hearts }, (_, i) => (
                  <span key={i} className={`heart ${i < game.hearts ? 'full' : 'empty'}`}><Icon name="heart" size={20} fill={i < game.hearts} /></span>
                ))}
                <span className="lvl">{t('level')} {game.level}</span>
              </div>
            )}
            {game.mode === 'zen' && <div className="timer pixel zen">{elapsedFmt}</div>}
          </div>

          <div className="hud-right">
            {settings.liveWpm && (
              <div className="stat stat-sm"><span className="stat-value">{liveWpm ?? '–'}</span><span className="stat-label">WPM</span></div>
            )}
            <div className={`combo m${mult}`} title={t('comboHint')}>
              <span className="combo-mult pixel">x{mult}</span>
              <span className="combo-bar"><span style={{ width: `${tierPct}%` }} /></span>
              <span className="combo-streak">{game.streak}</span>
            </div>
            {game.mode === 'zen' && (
              <button type="button" className="btn btn-ghost btn-xs" onMouseDown={keepFocus} onClick={finish}>{t('finish')}</button>
            )}
            <button type="button" className="icon-btn" onMouseDown={keepFocus} onClick={togglePause} aria-label={t('pause')} title={`${t('pause')} (Esc)`}><Icon name="pause" size={16} /></button>
            <button type="button" className="icon-btn" onMouseDown={keepFocus} onClick={restart} aria-label={t('restart')} title={`${t('restart')} (Tab + Enter)`}><Icon name="restart" size={16} /></button>
          </div>
        </div>
        <WordPanel game={game} version={game.version} />
      </div>

      {status === 'ready' && (
        <div className="ready-hint">
          <Icon name="keyboard" size={18} /> {t('startTyping')}
          <span className="sub">{t('spaceToSubmit')}</span>
        </div>
      )}

      {/* ── arena ── */}
      <div ref={arenaRef} className={`arena ${walking ? 'walking' : ''}`}>
        <div className="danger-vignette" />
        <div className="shadow" style={{ left: archerX - 55, top: FEET_Y - 9, width: 110 }} />
        <div className="actor" style={{ transform: `translate(${archerX - ARCHER.cxPx}px, ${FEET_Y - ARCHER.h}px)` }}>
          <SpriteView ref={archerRef} kind="archer" scale={ARCHER_SCALE} />
        </div>

        {corpses.map((c) => {
          const g = enemyGeom(c.kind)
          return (
            <div key={c.id} className="actor corpse" style={{ transform: `translate(${c.x - g.cxPx}px, ${FEET_Y - g.h + g.footPx}px)` }}>
              <SpriteView kind={c.kind} scale={g.scale} initial="death" flip />
            </div>
          )
        })}

        <div ref={enemyWrapRef} className="actor enemy" key={e.id}>
          <div className={`enemy-hp ${e.elite ? 'elite' : ''}`} style={{ left: eg.cxPx - 50, top: eg.h - eg.footPx - eg.headPx - 34 }}>
            <div className="enemy-name">{e.elite && <Icon name="flag" size={11} />}{t(`enemy_${e.kind}`)} · {t('lv')} {e.level}</div>
            <div className="hp-track"><div className="hp-fill" style={{ width: `${hpPct}%` }} /><span>{shown.hp}/{e.maxHp}</span></div>
          </div>
          <div className="enemy-body">
            <SpriteView ref={enemyRef} kind={e.kind} scale={eg.scale} initial={walking ? 'walk' : 'idle'} flip />
          </div>
        </div>

        <div ref={fxRef} className="fx-layer" />
      </div>
      <div ref={flashRef} className="hurt-flash" />

      {splash && <div key={splash.key} className={`splash ${splash.kind}`} onAnimationEnd={() => setSplash(null)}>{splash.text}</div>}

      {ending && (
        <div className="end-banner">
          <div className={`end-text pixel ${ending}`}>{t(ending === 'dead' ? 'defeated' : ending === 'time' ? 'timeUp' : 'finished')}</div>
        </div>
      )}

      {status === 'paused' && !ending && (
        <div className="pause-overlay" onMouseDown={(ev) => { if (ev.target === ev.currentTarget) { ev.preventDefault(); resume() } }}>
          <div className="pause-card">
            <h2 className="pixel">{t('paused')}</h2>
            <p>{t('pausedHint')}</p>
            <div className="pause-actions">
              <Button variant="gold" icon="play" onClick={resume} ref={resumeBtnRef} kbd="Enter">{t('resume')}</Button>
              <Button icon="restart" onClick={restart}>{t('restart')}</Button>
              <Button icon="flag" onClick={finish}>{t('finishRound')}</Button>
              <Button icon="home" onClick={onQuit}>{t('mainMenu')}</Button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        className="type-input"
        type="text"
        value={game.typed}
        onChange={onInput}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="send"
        aria-label={t('typeHere')}
      />
    </div>
  )
}

// ── Kelime paneli: 3 satır görünür; aktif kelime 3. satıra geçince bir satır kaydırılır ──
function WordPanel({ game }) {
  const box = useRef(null)
  const [start, setStart] = useState(0)
  const idx = game.index
  const s = Math.min(start, idx)
  const COUNT = 42

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const act = el.querySelector('[data-active]')
    if (!act) return
    const words = [...el.children]
    const tops = []
    for (const w of words) {
      const tp = w.offsetTop
      if (!tops.some((x) => Math.abs(x - tp) < 4)) tops.push(tp)
    }
    tops.sort((a, b) => a - b)
    const line = tops.findIndex((tp) => Math.abs(tp - act.offsetTop) < 4)
    if (line >= 2) {
      const first = words.find((w) => Math.abs(w.offsetTop - tops[line - 1]) < 4)
      if (first) setStart(Number(first.dataset.i))
    }
  })

  const norm = (c) => game.norm(c)
  const typed = game.typed
  const items = []
  for (let i = s; i < s + COUNT; i++) {
    const word = game.wordAt(i)
    if (i < idx) {
      const h = game.history[i]
      items.push(<span key={i} data-i={i} className={`w ${h && h.ok ? 'done' : 'wrong'}`}>{word}</span>)
    } else if (i > idx) {
      items.push(<span key={i} data-i={i} className="w">{word}</span>)
    } else {
      const cells = []
      const n = Math.max(word.length, typed.length)
      for (let j = 0; j < n; j++) {
        if (j === typed.length) cells.push(<span key="caret" className="caret" />)
        let cls = 'c', ch = word[j]
        if (j < typed.length) {
          if (j < word.length) cls = norm(typed[j]) === norm(word[j]) ? 'c ok' : 'c bad'
          else { cls = 'c extra'; ch = typed[j] }
        }
        cells.push(<span key={j} className={cls}>{ch}</span>)
      }
      if (typed.length >= n) cells.push(<span key="caret" className="caret" />)
      items.push(<span key={i} data-i={i} data-active="" className="w active">{cells}</span>)
    }
  }
  return <div className="words" ref={box} lang={game.lang}>{items}</div>
}
