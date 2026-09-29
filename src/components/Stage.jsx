import React, { useEffect, useState } from 'react'
import { asset, BACKGROUND } from '../lib/assets.js'

// Oyun 1000×660 sabit tasarımda; içerik en-boy oranı korunarak ölçeklenir,
// arka plan görseli ise tüm pencereyi kaplar (kenarlarda siyah bant kalmaz).
export const STAGE_W = 1000
export const STAGE_H = 660

function fit() {
  const vv = window.visualViewport
  const w = vv ? vv.width : window.innerWidth
  const h = vv ? vv.height : window.innerHeight
  return Math.min(w / STAGE_W, h / STAGE_H)
}

export default function Stage({ children, bgReady }) {
  const [scale, setScale] = useState(fit)
  useEffect(() => {
    const on = () => setScale(fit())
    window.addEventListener('resize', on)
    window.visualViewport && window.visualViewport.addEventListener('resize', on)
    return () => {
      window.removeEventListener('resize', on)
      window.visualViewport && window.visualViewport.removeEventListener('resize', on)
    }
  }, [])

  return (
    <div className="viewport">
      <div className="bg bg-tiny" style={{ backgroundImage: `url('${asset('background-tiny.webp')}')` }} />
      <div className={`bg bg-full ${bgReady ? 'ready' : ''}`} style={{ backgroundImage: `url('${BACKGROUND}')` }} />
      <div className="stage" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}
