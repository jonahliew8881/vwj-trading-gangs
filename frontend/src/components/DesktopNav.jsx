import React from 'react'

const TABS = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'sizing',    label: 'Position Sizing' },
  { id: 'screener',  label: 'Screener' },
  { id: 'journal',   label: 'Journal' },
]

export default function DesktopNav({ activeTab, setActiveTab }) {
  return (
    <nav style={{
      display: 'flex',
      background: 'var(--cy-panel)',
      borderBottom: '1px solid var(--cy-border)',
      flexShrink: 0,
    }}>
      {TABS.map(tab => (
        <NavButton
          key={tab.id}
          label={tab.label}
          active={activeTab === tab.id}
          onClick={() => setActiveTab(tab.id)}
        />
      ))}
    </nav>
  )
}

function NavButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px',
        background: 'none',
        border: 'none',
        borderRight: '1px solid var(--cy-border)',
        borderBottom: `2px solid ${active ? 'var(--cy-accent)' : 'transparent'}`,
        color: active ? 'var(--cy-accent)' : 'var(--cy-muted)',
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { if (!active) e.target.style.color = 'var(--cy-text)' }}
      onMouseLeave={e => { if (!active) e.target.style.color = 'var(--cy-muted)' }}
    >
      {label}
    </button>
  )
}
