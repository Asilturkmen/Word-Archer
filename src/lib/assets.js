// Asset yolları (vite `base` ile uyumlu — alt dizinde de çalışır) + sprite tanımları.
const BASE = import.meta.env.BASE_URL || '/'
export const asset = (p) => BASE + p.replace(/^\/+/, '')

const anim = (file, frames, fps, extra = {}) => ({ url: asset(file), frames, fps, ...extra })

// frameW/H: tek karenin boyutu. Karakterin kare içindeki kutusu (alfa bbox'tan ölçüldü):
//   cx = gövde merkezi (x), top = başın üstü (y), footPad = ayak altı boşluk (px)
export const SPRITES = {
  archer: {
    frameW: 96, frameH: 76, cx: 34, top: 3, footPad: 0,
    anims: {
      idle: anim('sprites/archer/Idle.png', 6, 8, { loop: true }),
      shoot: anim('sprites/archer/Shot_1.png', 14, 28),
      hit: anim('sprites/archer/Hurt.png', 3, 10),
      death: anim('sprites/archer/Dead.png', 3, 5),
    },
  },
  goblin: {
    frameW: 59, frameH: 43, cx: 22.5, top: 5, footPad: 2,
    anims: {
      idle: anim('sprites/goblin/Idle.png', 4, 6, { loop: true }),
      walk: anim('sprites/goblin/Idle.png', 4, 10, { loop: true }),
      hit: anim('sprites/goblin/TakeHit.png', 4, 16),
      attack: anim('sprites/goblin/TakeHit.png', 4, 10),
      death: anim('sprites/goblin/Death.png', 4, 8),
    },
  },
  skeleton: {
    frameW: 96, frameH: 64, cx: 51, top: 18, footPad: 0,
    anims: {
      idle: anim('sprites/skeleton-white/Idle.png', 8, 8, { loop: true }),
      walk: anim('sprites/skeleton-white/Walk.png', 10, 10, { loop: true }),
      attack: anim('sprites/skeleton-white/Attack1.png', 10, 18),
      hit: anim('sprites/skeleton-white/Hurt.png', 5, 16),
      death: anim('sprites/skeleton-white/Die.png', 13, 16),
    },
  },
  elite: {
    frameW: 96, frameH: 64, cx: 51, top: 18, footPad: 0,
    anims: {
      idle: anim('sprites/skeleton-yellow/Idle.png', 8, 8, { loop: true }),
      walk: anim('sprites/skeleton-yellow/Walk.png', 10, 10, { loop: true }),
      attack: anim('sprites/skeleton-yellow/Attack1.png', 10, 18),
      hit: anim('sprites/skeleton-yellow/Hurt.png', 5, 16),
      death: anim('sprites/skeleton-yellow/Die.png', 13, 16),
    },
  },
}

// Oyun sahnesindeki ölçekler
export const ENEMY_SCALE = { goblin: 3.1, skeleton: 3.0, elite: 3.4 }

export const BACKGROUND = asset('background.webp')

export function preloadAll(onProgress) {
  const urls = new Set([BACKGROUND])
  for (const s of Object.values(SPRITES)) for (const a of Object.values(s.anims)) urls.add(a.url)
  const list = [...urls]
  let done = 0
  const one = (u) => new Promise((resolve) => {
    const img = new Image()
    const finish = () => { done++; onProgress && onProgress(done / list.length); resolve() }
    img.onload = () => (img.decode ? img.decode().catch(() => {}).then(finish) : finish())
    img.onerror = finish
    img.src = u
  })
  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve()
  return Promise.all([...list.map(one), fonts])
}
