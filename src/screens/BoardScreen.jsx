import React, { useEffect, useMemo, useState } from 'react'
import { DURATIONS, DIFFICULTIES } from '../lib/engine.js'
import { boardKey } from '../lib/storage.js'
import { todayKey } from '../lib/rng.js'
import { onlineEnabled, fetchTop } from '../lib/online.js'
import Icon from '../components/Icon.jsx'
import { useApp, Button, Pills } from '../components/ui.jsx'

export default function BoardScreen({ onBack }) {
  const { t, settings, profile, data } = useApp()
  const [source, setSource] = useState(onlineEnabled ? 'global' : 'local')
  const [mode, setMode] = useState(settings.mode === 'zen' ? 'classic' : settings.mode)
  const [duration, setDuration] = useState(settings.duration)
  const [period, setPeriod] = useState('all')
  const [difficulty, setDifficulty] = useState(settings.difficulty)
  const [remote, setRemote] = useState({ state: 'idle', rows: [] })
  const today = todayKey()
  const key = boardKey({ mode, duration, difficulty, lang: settings.lang, dailyKey: today })

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onBack() } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onBack])

  const localRows = useMemo(() => data.history
    .filter((h) => h.ranked && boardKey(h) === key)
    .sort((a, b) => b.score - a.score || a.date - b.date)
    .slice(0, 10)
    .map((h) => ({ name: profile.name, score: h.score, wpm: h.wpm, acc: h.acc, date: h.date, me: true })), [data.history, key, profile.name])

  useEffect(() => {
    if (source !== 'global' || !onlineEnabled) return
    const ctl = new AbortController()
    setRemote({ state: 'loading', rows: [] })
    fetchTop({ mode, duration, difficulty, lang: settings.lang, period: mode === 'daily' ? 'all' : period, dailyKey: today }, ctl.signal)
      .then((rows) => setRemote({
        state: 'ok',
        rows: rows.map((r) => ({ name: r.name, score: r.score, wpm: r.wpm, acc: Number(r.accuracy), date: Date.parse(r.created_at), me: r.name === profile.name })),
      }))
      .catch((err) => { if (err.name !== 'AbortError') setRemote({ state: 'error', rows: [] }) })
    return () => ctl.abort()
  }, [source, mode, duration, difficulty, period, settings.lang, today, profile.name])

  const rows = source === 'global' ? remote.rows : localRows
  const state = source === 'global' ? remote.state : 'ok'
  const fmtDate = (d) => new Date(d).toLocaleDateString(settings.lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })

  return (
    <div className="screen panel-screen">
      <div className="panel board-panel">
        <div className="panel-head">
          <Button icon="back" onClick={onBack} kbd="Esc">{t('back')}</Button>
          <h2 className="pixel">{t('leaderboard')}</h2>
          <span className="spacer" />
        </div>

        <div className="board-filters">
          {onlineEnabled && (
            <Pills label={t('source')} value={source} onChange={setSource}
              options={[{ value: 'global', label: t('global') }, { value: 'local', label: t('myRecords') }]} />
          )}
          <Pills label={t('mode')} value={mode} onChange={setMode}
            options={['classic', 'survival', 'daily'].map((m) => ({ value: m, label: t(`mode_${m}`) }))} />
          {mode === 'classic' && (
            <Pills small label={t('duration')} value={duration} onChange={setDuration} options={DURATIONS.map((d) => ({ value: d, label: `${d}s` }))} />
          )}
          {mode !== 'daily' && (
            <Pills small label={t('difficulty')} value={difficulty} onChange={setDifficulty} options={DIFFICULTIES.map((d) => ({ value: d, label: t(`diff_${d}`) }))} />
          )}
          {source === 'global' && mode !== 'daily' && (
            <Pills small label={t('period')} value={period} onChange={setPeriod} options={[{ value: 'all', label: t('allTime') }, { value: 'week', label: t('thisWeek') }]} />
          )}
        </div>
        <div className="board-note"><Icon name={source === 'global' ? 'globe' : 'user'} size={13} /> {t('boardLangNote', { lang: settings.lang.toUpperCase() })}{mode === 'daily' && ` · ${today}`}</div>

        <div className="table" role="table">
          <div className="tr th" role="row">
            <span>#</span><span>{t('player')}</span><span className="num">{t('score')}</span><span className="num">WPM</span><span className="num">{t('accuracyShort')}</span><span className="num">{t('date')}</span>
          </div>
          <div className="tbody">
            {state === 'loading' && <div className="table-msg">{t('loading')}</div>}
            {state === 'error' && <div className="table-msg bad">{t('loadFailed')}</div>}
            {state === 'ok' && rows.length === 0 && (
              <div className="table-msg">{source === 'local' ? t('noLocalRecords') : t('noGlobalRecords')}</div>
            )}
            {state === 'ok' && rows.map((r, i) => (
              <div key={i} role="row" className={`tr ${i < 3 ? `rank${i + 1}` : ''} ${r.me && source === 'global' ? 'me' : ''}`}>
                <span className="rank pixel">{i === 0 ? <Icon name="trophy" size={15} /> : i + 1}</span>
                <span className="name">{r.name}</span>
                <span className="num pixel">{r.score}</span>
                <span className="num">{r.wpm}</span>
                <span className="num">{r.acc}%</span>
                <span className="num muted">{fmtDate(r.date)}</span>
              </div>
            ))}
          </div>
        </div>
        {!onlineEnabled && <div className="board-foot muted">{t('localOnlyNote')}</div>}
      </div>
    </div>
  )
}
