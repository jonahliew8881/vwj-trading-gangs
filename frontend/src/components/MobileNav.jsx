import React from 'react'

const TABS = [
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'sizing',
    label: 'Sizing',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 7v5l3 3"/>
      </svg>
    ),
  },
  {
    id: 'screener',
    label: 'Screener',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
    ),
  },
  {
    id: 'journal',
    label: 'Journal',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="8" y1="13" x2="16" y2="13"/>
        <line x1="8" y1="17" x2="16" y2="17"/>
      </svg>
    ),
  },
  {
    id: 'options',
    label: 'Options',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3l7.5 7.5M21 3l-7.5 7.5M3 21l7.5-7.5M21 21l-7.5-7.5"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
  },
]

export default function MobileNav({ activeTab, setActiveTab }) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0,
      width: '100%',
      height: '56px',
      background: 'var(--cy-panel)',
      borderTop: '1px solid var(--cy-border)',
      display: 'flex',
      zIndex: 50,
    }}>
      {TABS.map(tab => (
        <MobButton
          key={tab.id}
          tab={tab}
          active={activeTab === tab.id}
          onClick={() => setActiveTab(tab.id)}
        />
      ))}
    </nav>
  )
}

function MobButton({ tab, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        background: 'none',
        border: 'none',
        borderTop: `2px solid ${active ? 'var(--cy-accent)' : 'transparent'}`,
        color: active ? 'var(--cy-accent)' : 'var(--cy-muted)',
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '8px',
        fontWeight: 700,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {tab.icon}
      {tab.label}
    </button>
  )
}
