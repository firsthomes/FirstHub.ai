import { useState } from 'react'
import type { UserSettings } from '../types'
import { saveSettings } from '../utils/storage'

interface Props {
  settings: UserSettings
  onClose: () => void
  onUpdate: () => void
}

export default function Settings({ settings, onClose, onUpdate }: Props) {
  const [apiKey, setApiKey] = useState(settings.apiKey || '')
  const [showKey, setShowKey] = useState(false)

  function save() {
    saveSettings({ ...settings, apiKey: apiKey.trim() })
    onUpdate()
    onClose()
  }

  function clearKey() {
    setApiKey('')
    saveSettings({ ...settings, apiKey: '' })
    onUpdate()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Settings</div>

        <div className="modal-field">
          <label>Anthropic API Key</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              style={{ flex: 1 }}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              style={{
                background: 'var(--bg-input)',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                color: 'var(--text-dim)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
            Get a key at console.anthropic.com. Stored locally on this device only.
            Without a key the coach uses built-in rules.
          </div>
        </div>

        {settings.apiKey && (
          <button
            onClick={clearKey}
            style={{
              background: 'transparent',
              border: '1px solid var(--red-dim)',
              color: 'var(--red)',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              width: '100%',
              marginTop: 4,
            }}
          >
            Clear saved key
          </button>
        )}

        <div className="modal-field" style={{ marginTop: 20 }}>
          <label>Status</label>
          <div style={{
            fontSize: 13,
            color: (apiKey || '').startsWith('sk-ant-') ? 'var(--green)' : 'var(--text-dim)',
            padding: '8px 12px',
            background: 'var(--bg-input)',
            borderRadius: 8,
          }}>
            {(apiKey || '').startsWith('sk-ant-')
              ? 'AI coach enabled (Claude Sonnet 4.6)'
              : 'Using built-in rules (no API key set)'}
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Cancel</button>
          <button className="modal-save" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  )
}
