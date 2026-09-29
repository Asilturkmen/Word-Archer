import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Stage from './components/Stage.jsx'
import { AppCtx, Toasts } from './components/ui.jsx'
import MenuScreen from './screens/MenuScreen.jsx'
import GameScreen from './screens/GameScreen.jsx'
import ResultsScreen from './screens/ResultsScreen.jsx'
import BoardScreen from './screens/BoardScreen.jsx'
import StatsScreen from './screens/StatsScreen.jsx'
import { SettingsModal, HelpModal } from './screens/Modals.jsx'
import { makeT } from './i18n.js'
import { loadData, saveData, clearData, toHistoryEntry, boardKey, bestFor, totals, STORAGE_KEY } from './lib/storage.js'
import { newlyUnlocked, ACHIEVEMENTS } from './lib/achievements.js'
import { submitScore, onlineEnabled, isSubmittable } from './lib/online.js'
import { preloadAll } from './lib/assets.js'
import { hashString, todayKey } from './lib/rng.js'
import { sfx } from './lib/audio.js'
import Icon from './components/Icon.jsx'

function useMedia(query) {
  const get = () => typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false
  const [v, setV] = useState(get)
  useEffect(() => {
    if (!window.matchMedia) return
    const m = window.matchMedia(query)
    const on = () => setV(m.matches)
    m.addEventListener ? m.addEventListener('change', on) : m.addListener(on)
    return () => (m.removeEventListener ? m.removeEventListener('change', on) : m.removeListener(on))
  }, [query])
  return v
}

let toastId = 0

export default function App() {
  const [data, setData] = useState(loadData)
  const [screen, setScreen] = useState('menu') // menu | game | results | board | stats
  const [modal, setModal] = useState(null) // settings | help | null
  const [gameCfg, setGameCfg] = useState(null)
  const [gameKey, setGameKey] = useState(0)
  const [run, setRun] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [toasts, setToasts] = useState([])
  const backTo = useRef('menu')

  const osReduced = useMedia('(prefers-reduced-motion: reduce)')
  const isTouch = useMedia('(hover: none) and (pointer: coarse)')
  const isPortraitTouch = useMedia('(hover: none) and (pointer: coarse) and (orientation: portrait)')
  const [rotateDismissed, setRotateDismissed] = useState(false)
  const settings = data.settings
  const reduced = settings.reduceMotion ?? osReduced
  const t = useMemo(() => makeT(settings.lang), [settings.lang])

  // ── kalıcılık (+ başka sekmede yapılan değişiklikleri al; üzerine yazma) ──
  const fromOtherTab = useRef(false)
  useEffect(() => {
    if (fromOtherTab.current) { fromOtherTab.current = false; return }
    saveData(data)
  }, [data])
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      fromOtherTab.current = true
      setData(loadData())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // ── yükleme ──
  useEffect(() => {
    let alive = true
    preloadAll((p) => alive && setProgress(p)).then(() => alive && setLoaded(true))
    return () => { alive = false }
  }, [])

  // ── ses ──
  useEffect(() => { sfx.setVolume(settings.volume); sfx.setMuted(settings.muted) }, [settings.volume, settings.muted])
  useEffect(() => {
    const unlock = () => sfx.unlock()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock) }
  }, [])

  // ── belge dili / başlık ──
  useEffect(() => {
    document.documentElement.lang = settings.lang
    document.title = `Word Archer — ${t('titleSuffix')}`
  }, [settings.lang, t])

  // ── ilk açılışta nasıl oynanır ──
  useEffect(() => {
    if (loaded && !data.seenHelp) {
      setModal('help')
      setData((d) => ({ ...d, seenHelp: true }))
    }
  }, [loaded]) // eslint-disable-line react-hooks/exhaustive-deps

  const toast = useCallback((item) => {
    const id = ++toastId
    setToasts((ts) => [...ts.slice(-2), { ...item, id }])
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), item.ms || 3000)
  }, [])

  const updateSettings = useCallback((patch) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } })), [])
  const setName = useCallback((name) => setData((d) => ({ ...d, profile: { ...d.profile, name } })), [])
  const resetAll = useCallback(() => {
    clearData()
    const fresh = loadData()
    setData({ ...fresh, seenHelp: true, settings: { ...fresh.settings, lang: settings.lang } })
    toast({ icon: 'check', title: t('resetDone') })
  }, [settings.lang, t, toast])

  // ── oyun akışı ──
  const startGame = useCallback(() => {
    const s = data.settings
    const cfg = { mode: s.mode, duration: s.duration, difficulty: s.difficulty, lang: s.lang }
    if (s.mode === 'daily') {
      cfg.dailyKey = todayKey()
      cfg.seed = hashString(`word-archer:${cfg.dailyKey}:${s.lang}`)
    }
    setGameCfg(cfg)
    setGameKey((k) => k + 1)
    setModal(null)
    setScreen('game')
  }, [data.settings])

  const onGameEnd = useCallback((result) => {
    // hiç yazmadan bitirilen tur kaydedilmez (geçmişi / başarımları şişirmesin)
    if (result.elapsed === 0) { setScreen('menu'); return }
    if (result.endReason === 'quit') result.ranked = false
    const key = boardKey(result)
    const prevBest = result.ranked ? bestFor(data.history, key) : null
    const isBest = result.ranked && result.score > 0 && (!prevBest || result.score > prevBest.score)
    const history = [...data.history, toHistoryEntry(result)]
    const unlocked = newlyUnlocked(result, totals(history), data.achievements)
    const now = Date.now()
    const achievements = { ...data.achievements }
    unlocked.forEach((id) => { achievements[id] = now })
    setData((d) => ({ ...d, history, achievements }))

    const willSubmit = onlineEnabled && isSubmittable(result)
    setRun({ result, prevBest, isBest, unlocked, online: willSubmit ? 'sending' : null })
    setScreen('results')

    if (isBest) setTimeout(() => sfx.record(), 350)
    unlocked.forEach((id, i) => {
      setTimeout(() => {
        sfx.unlockAch()
        const a = ACHIEVEMENTS.find((x) => x.id === id)
        toast({ icon: a.icon, title: t('achUnlocked'), text: t(`ach_${id}`), kind: 'gold' })
      }, 700 + i * 650)
    })
    if (willSubmit) {
      submitScore(result, data.profile.name)
        .then(() => setRun((r) => (r && r.result === result ? { ...r, online: 'sent' } : r)))
        .catch(() => setRun((r) => (r && r.result === result ? { ...r, online: 'error' } : r)))
    }
  }, [data.history, data.achievements, data.profile.name, t, toast])

  const goMenu = useCallback(() => { setScreen('menu') }, [])
  const open = useCallback((s) => { backTo.current = screen; setScreen(s) }, [screen])
  const back = useCallback(() => setScreen(backTo.current === 'game' ? 'menu' : backTo.current || 'menu'), [])

  const ctx = {
    t, settings, updateSettings, profile: data.profile, setName, data, reduced, osReduced, isTouch,
    toast, openModal: setModal, modalOpen: !!modal, resetAll,
  }

  return (
    <AppCtx.Provider value={ctx}>
      <Stage bgReady={loaded}>
        <div className={`app ${reduced ? 'reduced' : ''}`}>
          {!loaded && (
            <div className="loader">
              <div className="logo small"><span>WORD ARCHER</span></div>
              <div className="loader-bar"><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>
            </div>
          )}
          {loaded && screen === 'menu' && <MenuScreen onPlay={startGame} onOpen={open} />}
          {loaded && screen === 'game' && gameCfg && (
            <GameScreen key={gameKey} config={gameCfg} onEnd={onGameEnd} onQuit={goMenu} onRestart={startGame} />
          )}
          {loaded && screen === 'results' && run && (
            <ResultsScreen run={run} onPlay={startGame} onMenu={goMenu} onOpen={open} />
          )}
          {loaded && screen === 'board' && <BoardScreen onBack={back} />}
          {loaded && screen === 'stats' && <StatsScreen onBack={back} />}

          {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
          {modal === 'help' && <HelpModal onClose={() => setModal(null)} />}
          <Toasts items={toasts} />
        </div>
      </Stage>
      {isPortraitTouch && !rotateDismissed && (
        <div className="rotate-note" role="status">
          <Icon name="restart" size={20} />
          <span>{t('rotateNote')}</span>
          <button type="button" aria-label={t('close')} onClick={() => setRotateDismissed(true)}><Icon name="close" size={18} /></button>
        </div>
      )}
    </AppCtx.Provider>
  )
}
