import React, { useEffect, useState } from 'react'
import LineChart from '../components/LineChart.jsx'
import SpriteView from '../components/SpriteView.jsx'
import Icon from '../components/Icon.jsx'
import { ACHIEVEMENTS } from '../lib/achievements.js'
import { onlineEnabled } from '../lib/online.js'
import { useApp, Button } from '../components/ui.jsx'

export function modeLabel(t, r) {
  const parts = [t(`mode_${r.mode}`)]
  if (r.mode === 'classic') parts.push(`${r.duration}s`)
  if (r.mode === 'daily' && r.dailyKey) parts.push(r.dailyKey)
  if (r.mode !== 'daily') parts.push(t(`diff_${r.difficulty}`))
  return parts.join(' · ')
}

function useCountUp(target, reduced) {
  const [v, setV] = useState(reduced ? target : 0)
  useEffect(() => {
    if (reduced) { setV(target); return }
    let raf
    const start = performance.now(), dur = 1100
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur)
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, reduced])
  return v
}

export default function ResultsScreen({ run, onPlay, onMenu, onOpen }) {
  const { t, reduced, toast, modalOpen } = useApp()
  const r = run.result
  const score = useCountUp(r.score, reduced)
  const survival = r.mode === 'survival'

  useEffect(() => {
    const onKey = (e) => {
      if (modalOpen) return
      const tag = e.target && e.target.tagName
      // Odak bir butondaysa Enter o butonu çalıştırır; değilse yeniden oynatır
      if (e.key === 'Enter' && tag !== 'BUTTON') { e.preventDefault(); onPlay() }
      if (e.key === 'Escape') { e.preventDefault(); onMenu() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onPlay, onMenu, modalOpen])

  const share = async () => {
    const text = t('shareText', { mode: modeLabel(t, r), score: r.score, wpm: r.wpm, acc: r.acc })
    const url = window.location.href.split('#')[0]
    try {
      if (navigator.share) { await navigator.share({ title: 'Word Archer', text, url }); return }
      await navigator.clipboard.writeText(`${text} ${url}`)
      toast({ icon: 'check', title: t('copied') })
    } catch (err) {
      if (err && err.name === 'AbortError') return
      toast({ icon: 'close', title: t('copyFailed'), kind: 'bad' })
    }
  }

  const title = run.isBest ? t('newRecord') : r.endReason === 'dead' ? t('defeated') : t('roundComplete')
  const prev = run.prevBest
  const delta = prev ? r.score - prev.score : null

  const wpmPts = r.samples.map((s) => ({ x: s.t, y: s.wpm }))
  const rawPts = r.samples.map((s) => ({ x: s.t, y: s.raw }))
  const marks = r.samples.filter((s) => s.errors > 0).map((s) => ({ x: s.t, y: s.wpm }))

  return (
    <div className="screen results-screen">
      <header className="results-head">
        <div className="results-archer"><SpriteView kind="archer" scale={1.3} initial={r.endReason === 'dead' ? 'death' : 'idle'} /></div>
        <div>
          <h1 className={`results-title pixel ${run.isBest ? 'record' : ''} ${r.endReason === 'dead' ? 'dead' : ''}`}>{title}</h1>
          <p className="results-sub">{modeLabel(t, r)}{!r.ranked && <span className="unranked"> · {t('unranked')}</span>}</p>
        </div>
      </header>

      <div className="results-grid">
        <section className="card score-card">
          <div className="big-score pixel">{score}</div>
          <div className="big-label">{t('score')}</div>
          <div className="pb-line">
            {r.ranked && (prev
              ? <>{t('prevBest')}: <b>{prev.score}</b> <span className={delta > 0 ? 'up' : delta < 0 ? 'down' : ''}>({delta > 0 ? '+' : ''}{delta})</span></>
              : r.score > 0 && <span className="up">{t('firstRecord')}</span>)}
          </div>
          <div className="stat-grid">
            <Tile label="WPM" value={r.wpm} accent />
            <Tile label={t('accuracy')} value={`${r.acc}%`} />
            <Tile label={t('rawWpm')} value={r.raw} />
            {survival ? <Tile label={t('level')} value={r.level} /> : <Tile label={t('kills')} value={r.kills} />}
            <Tile label={t('bestCombo')} value={r.bestStreak} />
            <Tile label={t('words')} value={<><span className="ok">{r.correctWords}</span><span className="sep">/</span><span className="bad">{r.wrongWords}</span></>} />
          </div>
        </section>

        <section className="card chart-card">
          <div className="card-title">
            <span>{t('wpmOverTime')}</span>
            <span className="legend"><i className="lg-wpm" />WPM <i className="lg-raw" />{t('raw')} <i className="lg-err" />{t('errors')}</span>
          </div>
          <LineChart
            width={410} height={150}
            series={[{ points: rawPts, color: '#b8956a', width: 1.5, dash: '4 4' }, { points: wpmPts, color: '#f0a030', area: true }]}
            marks={marks}
            xFmt={(v) => `${Math.round(v)}s`}
            emptyText={t('notEnoughData')}
          />
          <div className="card-title small"><span>{t('missedWords')}</span></div>
          <div className="missed">
            {r.missed.length === 0
              ? <span className="muted">{r.correctWords > 0 ? t('noMisses') : '—'}</span>
              : r.missed.map((m, i) => (
                <span key={i} className="miss-chip"><s>{m.typed}</s><Icon name="back" size={11} className="flipx" />{m.word}</span>
              ))}
          </div>
        </section>
      </div>

      {run.unlocked.length > 0 && (
        <div className="ach-row">
          {run.unlocked.map((id) => {
            const a = ACHIEVEMENTS.find((x) => x.id === id)
            return <span key={id} className="ach-chip"><Icon name={a.icon} size={14} /> {t(`ach_${id}`)}</span>
          })}
        </div>
      )}

      <div className="results-actions">
        <Button variant="gold" size="lg" icon="restart" onClick={onPlay} kbd="Enter">{t('playAgain')}</Button>
        <Button icon="home" onClick={onMenu} kbd="Esc">{t('mainMenu')}</Button>
        <Button icon="share" onClick={share}>{t('share')}</Button>
        <Button icon="trophy" onClick={() => onOpen('board')}>{t('leaderboard')}</Button>
      </div>

      {onlineEnabled && r.ranked && run.online && (
        <div className={`online-status ${run.online}`}>
          <Icon name="globe" size={13} /> {t(`online_${run.online}`)}
        </div>
      )}
    </div>
  )
}

function Tile({ label, value, accent }) {
  return (
    <div className={`tile ${accent ? 'accent' : ''}`}>
      <div className="tile-label">{label}</div>
      <div className="tile-value pixel">{value}</div>
    </div>
  )
}
