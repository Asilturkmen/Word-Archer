import React from 'react'

// Bağımlılıksız SVG çizgi grafiği.
// series: [{ points:[{x,y}], color, width, dash, area }]; marks: [{x,y}] (hata işaretleri)
export default function LineChart({ series, marks = [], width = 420, height = 150, xLabel, yLabel, xFmt = (v) => v, emptyText = '' }) {
  const pad = { l: 34, r: 10, t: 12, b: 22 }
  const all = series.flatMap((s) => s.points)
  if (Math.max(0, ...series.map((s) => s.points.length)) < 2) {
    return <div className="chart-empty" style={{ width, height }}>{emptyText}</div>
  }
  const xs = all.map((p) => p.x), ys = all.map((p) => p.y)
  const x0 = Math.min(...xs), x1 = Math.max(...xs)
  const yMax = niceMax(Math.max(10, ...ys))
  const W = width - pad.l - pad.r, H = height - pad.t - pad.b
  const sx = (x) => pad.l + (x1 === x0 ? W / 2 : ((x - x0) / (x1 - x0)) * W)
  const sy = (y) => pad.t + H - (Math.max(0, y) / yMax) * H
  const ticks = [0, yMax / 2, yMax]
  const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('')

  return (
    <svg className="chart" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={yLabel}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={width - pad.r} y1={sy(v)} y2={sy(v)} className="chart-grid" />
          <text x={pad.l - 6} y={sy(v) + 4} textAnchor="end" className="chart-tick">{Math.round(v)}</text>
        </g>
      ))}
      <text x={pad.l} y={height - 5} className="chart-tick">{xFmt(x0)}</text>
      <text x={width - pad.r} y={height - 5} textAnchor="end" className="chart-tick">{xFmt(x1)}</text>
      {xLabel && <text x={pad.l + W / 2} y={height - 5} textAnchor="middle" className="chart-tick">{xLabel}</text>}
      {series.map((s, i) => (
        <g key={i}>
          {s.area && (
            <path d={`${path(s.points)}L${sx(s.points[s.points.length - 1].x)},${sy(0)}L${sx(s.points[0].x)},${sy(0)}Z`} fill={s.color} opacity=".12" />
          )}
          <path d={path(s.points)} fill="none" stroke={s.color} strokeWidth={s.width || 2.5} strokeDasharray={s.dash} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      ))}
      {marks.map((m, i) => (
        <g key={i} className="chart-mark" transform={`translate(${sx(m.x)},${sy(m.y)})`}>
          <path d="M-3.5,-3.5L3.5,3.5M3.5,-3.5L-3.5,3.5" />
        </g>
      ))}
    </svg>
  )
}

function niceMax(v) {
  const steps = [20, 40, 60, 80, 100, 120, 150, 200, 250, 300]
  return steps.find((s) => s >= v) || Math.ceil(v / 100) * 100
}
