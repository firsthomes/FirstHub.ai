import { useState, useCallback, useEffect } from 'react'
import type { Phase, WeightEntry } from './types'
import { getDay, todayKey, getSettings, saveSettings, getWeights } from './utils/storage'
import { processURLParams } from './utils/urlParams'
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
  const [toast, setToast] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  useEffect(() => {
    const imported = processURLParams()
    if (imported) {
      const parts: string[] = []
      if (imported.burn != null) parts.push(`burn ${imported.burn} cal`)
      if (imported.weight != null) parts.push(`weight ${imported.weight} kg`)
      setToast(`Synced: ${parts.join(', ')}`)
      setRefreshKey(k => k + 1)
      const t = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'visible') {
        setRefreshKey(k => k + 1)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
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
    <div className="app" data-refresh={refreshKey}>
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
              padding: '10px 16px',
              cursor: 'pointer',
              color: (settings.apiKey || '').length > 0 ? 'var(--green)' : 'var(--text-dim)',
              fontSize: 13,
              fontWeight: 600,
              minHeight: 44,
            }}
            title="Settings"
          >
            ⚙ Set up
          </button>
        </div>
      </header>

      {toast && (
        <div style={{
          position: 'fixed',
          top: 'calc(var(--safe-top) + 60px)',
          left: '50%',
          background: 'rgba(48, 209, 88, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: 22,
          fontSize: 13,
          fontWeight: 600,
          zIndex: 300,
          boxShadow: 'var(--shadow-toast)',
          animation: 'toast-in 0.35s var(--spring)',
          letterSpacing: '-0.1px',
        }}>
          ✓ {toast}
        </div>
      )}

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
