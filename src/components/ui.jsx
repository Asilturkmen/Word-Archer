import React, { createContext, forwardRef, useContext, useEffect, useRef } from 'react'
import Icon from './Icon.jsx'
import { sfx } from '../lib/audio.js'

// Uygulama geneli bağlam: t(), ayarlar, profil, veri, toast, modal açma
export const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

export const Button = forwardRef(function Button({ variant = 'ghost', size, icon, children, className = '', onClick, kbd, ...rest }, ref) {
  const handle = (e) => { sfx.click(); onClick && onClick(e) }
  return (
    <button
      ref={ref}
      type="button"
      className={`btn btn-${variant} ${size ? 'btn-' + size : ''} ${className}`}
      onClick={handle}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 20 : 16} />}
      {children != null && <span>{children}</span>}
      {kbd && <kbd>{kbd}</kbd>}
    </button>
  )
})

export function IconButton({ icon, label, onClick, className = '', active, ...rest }) {
  const handle = (e) => { sfx.click(); onClick && onClick(e) }
  return (
    <button type="button" className={`icon-btn ${active ? 'on' : ''} ${className}`} onClick={handle} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={18} />
    </button>
  )
}

// Seçim hapları (radyo grubu)
export function Pills({ value, options, onChange, label, small }) {
  return (
    <div className={`pills ${small ? 'pills-sm' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`pill ${value === o.value ? 'on' : ''}`}
          onClick={() => { sfx.click(); onChange(o.value) }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="toggle-row">
      <span className="toggle-text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`switch ${checked ? 'on' : ''}`}
        onClick={() => { sfx.click(); onChange(!checked) }}
      >
        <span />
      </button>
    </label>
  )
}

// Erişilebilir modal: arka plan karartma, ESC ile kapanma, odak tuzağı, odağı geri verme.
export function Modal({ title, onClose, children, width = 520, footer }) {
  const { t } = useApp()
  const ref = useRef(null)
  useEffect(() => {
    const prev = document.activeElement
    const el = ref.current
    const first = el && el.querySelector('[data-autofocus]') || el && el.querySelector('button, input, select, [tabindex]:not([tabindex="-1"])')
    first && first.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); onClose() }
      if (e.key === 'Tab' && el) {
        const f = [...el.querySelectorAll('button, input, select, a[href], [tabindex]:not([tabindex="-1"])')].filter((n) => !n.disabled)
        if (!f.length) return
        const a = f[0], b = f[f.length - 1]
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus() }
        else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus() }
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      prev && prev.focus && prev.focus()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref} style={{ width }}>
        <div className="modal-head">
          <h2>{title}</h2>
          <IconButton icon="close" label={t('close')} onClick={onClose} />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Toasts({ items }) {
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.kind || ''}`}>
          {t.icon && <Icon name={t.icon} size={18} />}
          <div>
            {t.title && <strong>{t.title}</strong>}
            {t.text && <span>{t.text}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Kbd({ children }) { return <kbd>{children}</kbd> }
