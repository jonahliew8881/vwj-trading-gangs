import React, { useState } from 'react'
import EntrySignals from '../components/screener/EntrySignals'
import ExitAlerts from '../components/screener/ExitAlerts'

export default function Screener() {
  const [activeTab, setActiveTab] = useState('entry')

  return (
    <div>
      {/* Sub Nav */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--cy-border)',
        marginBottom: '10px',
      }}>
        {['entry', 'exit'].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              padding: '8px 18px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === t ? 'var(--cy-accent)' : 'transparent'}`,
              color: activeTab === t ? 'var(--cy-accent)' : 'var(--cy-muted)',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {t === 'entry' ? 'Entry Signals' : 'Exit Alerts'}
          </button>
        ))}
      </div>

      {activeTab === 'entry' ? <EntrySignals /> : <ExitAlerts />}
    </div>
  )
}
