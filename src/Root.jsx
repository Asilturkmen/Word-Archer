import React, { useEffect, useState } from 'react'
import App from './App.jsx'

// Oyun 1000×660 sabit tasarımda. İçeriği en-boy oranını koruyarak ölçekliyoruz,
// ama ARKA PLAN tüm pencereyi kaplıyor → kenarlarda siyah bar kalmıyor (responsive).
const STAGE_W = 1000
const STAGE_H = 660

export default function Root() {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const fit = () =>
      setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // arka plan tüm ekranı doldurur (siyah bar yok); kenar/yedek rengi gökyüzü tonu
        backgroundColor: '#8fbfe0',
        backgroundImage: "url('/background.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* (global karartma katmanı kaldırıldı — sadece kelime bloğunun kendi koyu zemini var) */}

      {/* ölçeklenen oyun sahnesi — arka plan şeffaf, alttaki görsel görünür */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: STAGE_W,
          height: STAGE_H,
          flex: 'none',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <App language="en" gameDuration={60} difficulty="normal" sunbeams={true} />
      </div>
    </div>
  )
}
