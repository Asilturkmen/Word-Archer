import React, { useEffect } from 'react'
import { DURATIONS, DIFFICULTIES } from '../lib/engine.js'
import { bestFor, boardKey } from '../lib/storage.js'
import { todayKey } from '../lib/rng.js'
import SpriteView from '../components/SpriteView.jsx'
import Icon from '../components/Icon.jsx'
import { useApp, Button, IconButton, Pills } from '../components/ui.jsx'

const MODE_LIST = [
  { id: 'classic', icon: 'clock' },
  { id: 'survival', icon: 'heart' },
  { id: 'daily', icon: 'calendar' },
  { id: 'zen', icon: 'infinity' },
]

export default function MenuScreen({ onPlay, onOpen }) {
  const { t, settings, updateSettings, profile, data, openModal, modalOpen, isTouch } = useApp()
  const mode = settings.mode
  const today = todayKey()

  const bestKey = boardKey({ mode, duration: settings.duration, difficulty: settings.difficulty, lang: settings.lang, dailyKey: today })
  const best = mode === 'zen' ? null : bestFor(data.history, bestKey)

  useEffect(() => {
    const onKey = (e) => {
      if (modalOpen) return
      if (e.key !== 'Enter') return
      const el = e.target
      const tag = el && el.tagName
      // Seçim düğmelerinde (mod / süre / zorluk) Enter doğrudan oyunu başlatır
      if (tag === 'INPUT' || tag === 'SELECT') return
      if (tag === 'BUTTON' && el.getAttribute('role') !== 'radio') return
      if (tag === 'BUTTON' && el.getAttribute('aria-checked') === 'false') { e.preventDefault(); el.click(); return }
      e.preventDefault()
      onPlay()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onPlay, modalOpen])

  const soundLabel = settings.muted ? t('unmute') : t('mute')

  return (
    <div className="screen menu-screen">
      <div className="topbar">
        <Pills small label={t('language')} value={settings.lang} onChange={(v) => updateSettings({ lang: v })} options={[{ value: 'en', label: 'EN' }, { value: 'tr', label: 'TR' }]} />
        <div className="topbar-right">
          <IconButton icon={settings.muted ? 'mute' : 'sound'} label={soundLabel} onClick={() => updateSettings({ muted: !settings.muted })} />
          <IconButton icon="settings" label={t('settings')} onClick={() => openModal('settings')} />
          <button type="button" className="profile-chip" onClick={() => openModal('settings')} title={t('editName')}>
            <Icon name="user" size={15} />
            <span>{profile.name}</span>
            <Icon name="edit" size={12} />
          </button>
        </div>
      </div>

      <header className="title-block">
        <h1 className="logo">
          <Icon name="bow" size={34} stroke={2.4} className="logo-icon" />
          <span>WORD ARCHER</span>
          <Icon name="bow" size={34} stroke={2.4} className="logo-icon mirror" />
        </h1>
        <p className="tagline">{t('tagline')}</p>
      </header>

      <div className="menu-stage">
        <div className="menu-chars">
          <div className="menu-char"><div className="shadow-sm" /><SpriteView kind="archer" scale={1.6} /></div>
          <div className="menu-char"><div className="shadow-sm" /><SpriteView kind="goblin" scale={2.1} flip /></div>
        </div>
        <div className="platform" />
      </div>

      <div className="mode-cards" role="radiogroup" aria-label={t('mode')}>
        {MODE_LIST.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mode === m.id}
            className={`mode-card ${mode === m.id ? 'on' : ''}`}
            onClick={() => updateSettings({ mode: m.id })}
          >
            <Icon name={m.icon} size={20} />
            <strong>{t(`mode_${m.id}`)}</strong>
            <small>{t(`mode_${m.id}_desc`)}</small>
          </button>
        ))}
      </div>

      <div className="mode-options">
        {mode === 'classic' && (
          <Pills label={t('duration')} value={settings.duration} onChange={(v) => updateSettings({ duration: v })}
            options={DURATIONS.map((d) => ({ value: d, label: `${d}s` }))} />
        )}
        {mode !== 'daily' && (
          <Pills label={t('difficulty')} value={settings.difficulty} onChange={(v) => updateSettings({ difficulty: v })}
            options={DIFFICULTIES.map((d) => ({ value: d, label: t(`diff_${d}`) }))} />
        )}
        {mode === 'daily' && <span className="daily-note"><Icon name="globe" size={14} /> {t('dailyNote', { date: today })}</span>}
        {best && <span className="best-note"><Icon name="trophy" size={14} /> {t('yourBest')}: <b>{best.score}</b> · {best.wpm} WPM</span>}
      </div>

      <Button variant="gold" size="lg" icon="play" className="play-btn" onClick={onPlay} kbd="Enter">{t('play')}</Button>

      <nav className="menu-links">
        <Button icon="trophy" onClick={() => onOpen('board')}>{t('leaderboard')}</Button>
        <Button icon="chart" onClick={() => onOpen('stats')}>{t('stats')}</Button>
        <Button icon="help" onClick={() => openModal('help')}>{t('howTo')}</Button>
      </nav>

      {isTouch && <div className="touch-note"><Icon name="keyboard" size={14} /> {t('touchNote')}</div>}
    </div>
  )
}
