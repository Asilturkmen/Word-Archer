import React, { useState } from 'react'
import { sanitizeName } from '../lib/storage.js'
import { onlineEnabled } from '../lib/online.js'
import Icon from '../components/Icon.jsx'
import { useApp, Modal, Button, Pills, Toggle, Kbd } from '../components/ui.jsx'

export function SettingsModal({ onClose }) {
  const { t, settings, updateSettings, profile, setName, resetAll, osReduced } = useApp()
  const [name, setNameDraft] = useState(profile.name)
  const [err, setErr] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  const saveName = () => {
    const clean = sanitizeName(name)
    if (!clean) { setErr(t('nameInvalid')); return false }
    setErr('')
    setName(clean)
    setNameDraft(clean)
    return true
  }
  // Geçersiz bir ad yazılıp kapatılırsa eski ad korunur
  const close = () => { if (name !== profile.name) saveName(); onClose() }

  return (
    <Modal title={t('settings')} onClose={close} width={520}
      footer={<Button variant="gold" onClick={close}>{t('done')}</Button>}>
      <div className="form-row">
        <label htmlFor="nick">{t('nickname')}</label>
        <input id="nick" className="text-input" data-autofocus value={name} maxLength={16}
          onChange={(e) => { setNameDraft(e.target.value); setErr('') }}
          onBlur={() => name !== profile.name && saveName()}
          onKeyDown={(e) => { if (e.key === 'Enter') saveName() }} />
        <small className={err ? 'bad' : 'muted'}>{err || (onlineEnabled ? t('nicknameHintOnline') : t('nicknameHint'))}</small>
      </div>

      <div className="form-row">
        <span className="form-label">{t('language')}</span>
        <Pills value={settings.lang} onChange={(v) => updateSettings({ lang: v })} options={[{ value: 'en', label: 'English' }, { value: 'tr', label: 'Türkçe' }]} />
      </div>

      <div className="form-row">
        <span className="form-label">{t('volume')}</span>
        <div className="volume">
          <button type="button" className="icon-btn" onClick={() => updateSettings({ muted: !settings.muted })} aria-label={settings.muted ? t('unmute') : t('mute')}>
            <Icon name={settings.muted ? 'mute' : 'sound'} size={18} />
          </button>
          <input type="range" min="0" max="1" step="0.05" value={settings.volume} aria-label={t('volume')}
            onChange={(e) => updateSettings({ volume: Number(e.target.value), muted: false })} />
          <span className="muted">{Math.round(settings.volume * 100)}%</span>
        </div>
      </div>

      <Toggle label={t('liveWpm')} checked={settings.liveWpm} onChange={(v) => updateSettings({ liveWpm: v })} />
      <Toggle label={t('screenShake')} checked={settings.shake} onChange={(v) => updateSettings({ shake: v })} />
      <Toggle label={t('reduceMotion')} hint={settings.reduceMotion == null ? t('followsSystem') : null}
        checked={settings.reduceMotion ?? osReduced} onChange={(v) => updateSettings({ reduceMotion: v })} />

      <div className="danger-zone">
        {confirmReset ? (
          <>
            <span>{t('resetConfirm')}</span>
            <Button variant="danger" onClick={() => { resetAll(); onClose() }}>{t('resetYes')}</Button>
            <Button onClick={() => setConfirmReset(false)}>{t('cancel')}</Button>
          </>
        ) : (
          <Button variant="danger-ghost" icon="close" onClick={() => setConfirmReset(true)}>{t('resetData')}</Button>
        )}
      </div>
    </Modal>
  )
}

export function HelpModal({ onClose }) {
  const { t } = useApp()
  return (
    <Modal title={t('howTo')} onClose={onClose} width={600} footer={<Button variant="gold" onClick={onClose}>{t('gotIt')}</Button>}>
      <p className="help-lead">{t('helpLead')}</p>
      <ul className="help-list">
        <li><Icon name="keyboard" size={16} /> <span>{t('help1')}</span></li>
        <li><Icon name="flame" size={16} /> <span>{t('help2')}</span></li>
        <li><Icon name="skull" size={16} /> <span>{t('help3')}</span></li>
        <li><Icon name="heart" size={16} /> <span>{t('help4')}</span></li>
        <li><Icon name="calendar" size={16} /> <span>{t('help5')}</span></li>
      </ul>
      <h3 className="help-h">{t('shortcuts')}</h3>
      <div className="keys">
        <div><Kbd>Space</Kbd><span>{t('keySubmit')}</span></div>
        <div><Kbd>Ctrl</Kbd>+<Kbd>⌫</Kbd><span>{t('keyDelWord')}</span></div>
        <div><Kbd>Esc</Kbd><span>{t('keyPause')}</span></div>
        <div><Kbd>Tab</Kbd>+<Kbd>Enter</Kbd><span>{t('keyRestart')}</span></div>
        <div><Kbd>Enter</Kbd><span>{t('keyPlay')}</span></div>
      </div>
      <p className="credits">{t('credits')}: Archer — CraftPix.net · Goblin — LuizMelo (CC0) · Skeletons — MonoPixelArt</p>
    </Modal>
  )
}
