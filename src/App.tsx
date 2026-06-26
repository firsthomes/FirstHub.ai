import { useState, useCallback } from 'react'
import type { Phase, WeightEntry } from './types'
import { getDay, todayKey, getSettings, saveSettings, getWeights } from './utils/storage'
import BottomNav from './components/BottomNav'
import Dashboard from './components/Dashboard'
import FoodLogger from './components/FoodLogger'
import CoachChat from './components/CoachChat'
import History from './components/History'
import Settings from './components/Settings'

type Tab = 'dashboard' | 'log' | 'coach' | 'history'

function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  const settings = getSettings()
  const day = getDay(todayKey())
  const weights: WeightEntry[] = getWeights()

  function togglePhase() {
    const newPhase: Phase = settings.phase === 'maintenance' ? 'lean-bulk' : 'maintenance'
    saveSettings({ ...settings, phase: newPhase })
    refresh()
  }

  return (
    <div className="app" key={refreshKey}>
      <header className="app-header">
        <h1>Food Coach</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="phase-badge" onClick={togglePhase}>
            {settings.phase === 'lean-bulk' ? 'Lean Bulk' : 'Maintenance'}
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSettings(true); }}
            style={{
              background: 'var(--bg-card)',
              border: 'none',
              borderRadius: 12,
              padding: '8px 14px',
              cursor: 'pointer',
              color: (settings.apiKey || '').length > 0 ? 'var(--green)' : 'var(--text-dim)',
              fontSize: 13,
              fontWeight: 600,
              minHeight: 32,
            }}
            title="Settings"
          >
            ⚙ Set up
          </button>
        </div>
      </header>

      {tab === 'dashboard' && (
        <Dashboard day={day} phase={settings.phase} weights={weights} onUpdate={refresh} />
      )}
      {tab === 'log' && (
        <FoodLogger day={day} onUpdate={refresh} onDone={() => setTab('dashboard')} />
      )}
      {tab === 'coach' && (
        <CoachChat day={day} phase={settings.phase} />
      )}
      {tab === 'history' && (
        <History />
      )}

      <BottomNav active={tab} onChange={setTab} />

      {showSettings && (
        <Settings
          settings={settings}
          onClose={() => setShowSettings(false)}
          onUpdate={refresh}
        />
      )}
    </div>
  )
}

export default App
