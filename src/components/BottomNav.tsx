type Tab = 'dashboard' | 'log' | 'coach' | 'history'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      <button className={`nav-item ${active === 'dashboard' ? 'active' : ''}`} onClick={() => onChange('dashboard')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        Today
      </button>
      <button className={`nav-item ${active === 'log' ? 'active' : ''}`} onClick={() => onChange('log')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        Add Food
      </button>
      <button className={`nav-item ${active === 'coach' ? 'active' : ''}`} onClick={() => onChange('coach')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Coach
      </button>
      <button className={`nav-item ${active === 'history' ? 'active' : ''}`} onClick={() => onChange('history')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        History
      </button>
    </nav>
  )
}
