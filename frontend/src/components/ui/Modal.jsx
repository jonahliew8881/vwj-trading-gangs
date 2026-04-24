import React from 'react'

export default function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.8)',
      zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--cy-panel)',
        border: '1px solid var(--cy-accent)',
        padding: '16px',
        width: '100%', maxWidth: '340px',
        position: 'relative',
      }}>
        {/* Corner accents */}
        <div style={{ position: 'absolute', top: -1, left: -1, width: 8, height: 8, borderTop: '2px solid var(--cy-accent)', borderLeft: '2px solid var(--cy-accent)' }} />
        <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderBottom: '2px solid var(--cy-accent)', borderRight: '2px solid var(--cy-accent)' }} />

        <div style={{
          fontFamily: "'Josefin Sans', sans-serif",
          fontSize: '13px', fontWeight: 700,
          letterSpacing: '3px', color: 'var(--cy-accent)',
          marginBottom: '12px', textTransform: 'uppercase',
        }}>
          {title}
        </div>

        <button onClick={onClose} style={{
          position: 'absolute', top: 10, right: 12,
          background: 'none', border: 'none',
          color: 'var(--cy-muted)', fontSize: '16px', cursor: 'pointer',
        }}>
          ✕
        </button>

        {children}
      </div>
    </div>
  )
}
