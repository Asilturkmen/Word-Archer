import React, { useEffect, useMemo } from 'react'
import { totals } from '../lib/storage.js'
import { ACHIEVEMENTS } from '../lib/achievements.js'
import LineChart from '../components/LineChart.jsx'
import Icon from '../components/Icon.jsx'
import { useApp, Button } from '../components/ui.jsx'

export default function StatsScreen({ onBack }) {
  const { t, data, settings } = useApp()
  const tot = useMemo(() => totals(data.history), [data.history])
  const recent = useMemo(() => data.history.filter((h) => h.elapsed >= 10000).slice(-30), [data.history])
  const unlockedCount = ACHIEVEMENTS.filter((a) => data.achievements[a.id]).length

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onBack() } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onBack])

  const mins = Math.round(tot.time / 60000)
  const timeFmt = mins >= 60 ? `${Math.floor(mins / 60)}${t('hShort')} ${mins % 60}${t('mShort')}` : `${mins}${t('mShort')}`
  const fmtDate = (d) => new Date(d).toLocaleDateString(settings.lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="screen panel-screen">
      <div className="panel stats-panel">
        <div className="panel-head">
          <Button icon="back" onClick={onBack} kbd="Esc">{t('back')}</Button>
          <h2 className="pixel">{t('stats')}</h2>
          <span className="spacer" />
        </div>

        <div className="stats-body">
          <div className="stat-tiles">
            <Tile icon="flag" label={t('gamesPlayed')} value={tot.games} />
            <Tile icon="clock" label={t('timePlayed')} value={timeFmt} />
            <Tile icon="check" label={t('wordsTyped')} value={tot.words} />
            <Tile icon="bolt" label={t('bestWpm')} value={tot.bestWpm} />
            <Tile icon="chart" label={t('avgWpm')} value={tot.avgWpm} />
            <Tile icon="target" label={t('avgAcc')} value={`${tot.avgAcc}%`} />
            <Tile icon="skull" label={t('totalKills')} value={tot.kills} />
          </div>

          <div className="card">
            <div className="card-title"><span>{t('wpmTrend')}</span></div>
            <LineChart
              width={740} height={140}
              series={[{ points: recent.map((h, i) => ({ x: i + 1, y: h.wpm })), color: '#f0a030', area: true }]}
              xFmt={(v) => `#${v}`}
              emptyText={t('playMore')}
            />
          </div>

          <div className="card">
            <div className="card-title"><span>{t('achievements')}</span><span className="muted">{unlockedCount}/{ACHIEVEMENTS.length}</span></div>
            <div className="ach-grid">
              {ACHIEVEMENTS.map((a) => {
                const at = data.achievements[a.id]
                return (
                  <div key={a.id} className={`ach ${at ? 'on' : ''}`} title={at ? fmtDate(at) : ''}>
                    <span className="ach-icon"><Icon name={at ? a.icon : 'lock'} size={18} /></span>
                    <span className="ach-text">
                      <strong>{t(`ach_${a.id}`)}</strong>
                      <small>{t(`ach_${a.id}_desc`)}</small>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Tile({ icon, label, value }) {
  return (
    <div className="tile">
      <div className="tile-label"><Icon name={icon} size={12} /> {label}</div>
      <div className="tile-value pixel">{value}</div>
    </div>
  )
}
