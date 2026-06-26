import { useState, useRef } from 'react'
import type { UserSettings } from '../types'
import { saveSettings } from '../utils/storage'
import { importCSV, type ImportSummary } from '../utils/csvImport'

interface Props {
  settings: UserSettings
  onClose: () => void
  onUpdate: () => void
}

export default function Settings({ settings, onClose, onUpdate }: Props) {
  const [apiKey, setApiKey] = useState(settings.apiKey || '')
  const [showKey, setShowKey] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportSummary | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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

  async function handleFile(file: File) {
    setImporting(true)
    setImportError(null)
    setImportResult(null)
    try {
      const text = await file.text()
      const result = importCSV(text)
      setImportResult(result)
      onUpdate()
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : 'Failed to import')
    } finally {
      setImporting(false)
    }
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

        <div className="modal-field" style={{ marginTop: 20 }}>
          <label>Import History (CSV)</label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 500,
              cursor: importing ? 'wait' : 'pointer',
              width: '100%',
              opacity: importing ? 0.6 : 1,
            }}
          >
            {importing ? 'Importing...' : 'Choose CSV file'}
          </button>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
            Import weights and food entries from a chat export. Re-importing the same
            file is safe — it replaces previous imports without touching manual entries.
          </div>

          {importResult && (
            <div style={{
              marginTop: 10,
              padding: '10px 12px',
              background: 'var(--green-dim)',
              color: 'var(--green)',
              borderRadius: 8,
              fontSize: 12,
              lineHeight: 1.5,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                Imported {importResult.foods} food entries, {importResult.weights} weights, across {importResult.days} days.
              </div>
              {importResult.unmatched.length > 0 && (
                <div style={{ marginTop: 6, color: 'var(--text)', opacity: 0.85 }}>
                  Couldn't match {importResult.unmatched.length} item{importResult.unmatched.length === 1 ? '' : 's'}:
                  {' '}
                  <span style={{ fontStyle: 'italic' }}>{importResult.unmatched.slice(0, 5).join(', ')}</span>
                  {importResult.unmatched.length > 5 && '…'}
                </div>
              )}
            </div>
          )}

          {importError && (
            <div style={{
              marginTop: 10,
              padding: '10px 12px',
              background: 'var(--red-dim)',
              color: 'var(--red)',
              borderRadius: 8,
              fontSize: 12,
            }}>
              {importError}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Close</button>
          <button className="modal-save" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  )
}
