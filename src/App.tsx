import { useState, useCallback } from 'react'
import type { Phase, WeightEntry } from './types'
import { getDay, todayKey, getSettings, saveSettings, getWeights } from './utils/storage'
import BottomNav from './components/BottomNav'
import Dashboard from './components/Dashboard'
import FoodLogger from './components/FoodLogger'
import CoachChat from './components/CoachChat'
import History from './components/History'

type Tab = 'dashboard' | 'log' | 'coach' | 'history'

function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)

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
        <button className="phase-badge" onClick={togglePhase}>
          {settings.phase === 'lean-bulk' ? 'Lean Bulk' : 'Maintenance'}
        </button>
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
    </div>
  )
}

export default App
