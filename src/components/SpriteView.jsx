import React, { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { Sprite } from '../lib/sprite.js'
import { SPRITES } from '../lib/assets.js'

// <SpriteView kind="archer" scale={2.5} initial="idle" flip ref={r} />
// ref API: play(name), once(name, then='idle'|null), el
const SpriteView = forwardRef(function SpriteView({ kind, scale = 2, initial = 'idle', flip = false, className = '', style }, ref) {
  const elRef = useRef(null)
  const spRef = useRef(null)

  useLayoutEffect(() => {
    const def = SPRITES[kind]
    const s = new Sprite(elRef.current, { frameW: def.frameW, frameH: def.frameH, scale })
    for (const [name, a] of Object.entries(def.anims)) s.add(name, a)
    s.play(initial)
    spRef.current = s
    return () => { s.stop(); spRef.current = null }
  }, [kind, scale]) // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(ref, () => ({
    get el() { return elRef.current },
    get state() { return spRef.current && spRef.current.state },
    play(name) { spRef.current && spRef.current.play(name) },
    once(name, then = 'idle', cb) {
      const s = spRef.current
      if (!s || !s.has(name)) return
      s.replayOnce(name, () => { if (then && spRef.current) spRef.current.play(then); cb && cb() })
    },
  }), [])

  return (
    <div
      ref={elRef}
      className={`sprite ${flip ? 'flip' : ''} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
})

export default SpriteView
