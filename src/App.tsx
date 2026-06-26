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
            onClick={() => setShowSettings(true)}
            style={{
              background: 'var(--bg-card)',
              border: 'none',
              borderRadius: 20,
              padding: 6,
              cursor: 'pointer',
              color: settings.apiKey ? 'var(--green)' : 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
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
