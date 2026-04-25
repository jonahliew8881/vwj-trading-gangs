import React, { useState } from 'react'
import EditPositionModal from './EditPositionModal'

const HEADERS = [
  'Ticker','Mkt','Acct','Qty','Entry','Current',
  'Stop','Target','Commission','Net P&L','R:R','Signal'
]

const CURRENCY_SYMBOL = { HK: 'HK$', US: '$' }

export default function PositionsTable({ positions, loading, onRefresh }) {
  const [editTarget, setEditTarget] = useState(null)

  if (loading) return (
    <Empty>// Loading positions...</Empty>
  )
  if (positions.length === 0) return (
    <Empty>// No open positions. Click + Add to start.</Empty>
  )

  return (
    <>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr>
              {HEADERS.map(h => (
                <th key={h} style={{
                  padding: '6px 7px', textAlign: 'left',
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: '7px', fontWeight: 700,
                  letterSpacing: '1.5px', textTransform: 'uppercase',
                  color: 'var(--cy-muted)',
                  borderBottom: '1px solid var(--cy-border)',
                }}>
                  {h}
                </th>
              ))}
              <th style={{ borderBottom: '1px solid var(--cy-border)' }} />
            </tr>
          </thead>
          <tbody>
            {positions.map(p => (
              <PositionRow
                key={p.id}
                position={p}
                onEdit={() => setEditTarget(p)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <EditPositionModal
          position={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => { setEditTarget(null); onRefresh() }}
        />
      )}
    </>
  )
}

function PositionRow({ position: p, onEdit }) {
  const sym    = CURRENCY_SYMBOL[p.market] || 'HK$'
  const gross  = (p.current_price - p.entry_price) * p.quantity
  const netPnL = gross - (p.commission || 0)
  const risk   = p.entry_price - p.stop_loss
  const reward = p.target_price - p.entry_price
  const rr     = risk > 0 ? (reward / risk).toFixed(1) : '—'
  const pnlPct = ((netPnL / (p.entry_price * p.quantity)) * 100).toFixed(1)

  const tdStyle = {
    padding: '7px 7px',
    borderBottom: '1px solid rgba(26,42,58,0.5)',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '11px',
  }

  return (
    <tr
      onMouseEnter={e => e.currentTarget.querySelectorAll('td').forEach(td => td.style.background = 'rgba(0,212,255,0.03)')}
      onMouseLeave={e => e.currentTarget.querySelectorAll('td').forEach(td => td.style.background = 'transparent')}
    >
      <td style={tdStyle}>
        <span style={{ color: 'var(--cy-accent)', fontWeight: 600, fontSize: '12px' }}>{p.ticker}</span>
      </td>
      <td style={tdStyle}><MarketTag market={p.market} /></td>
      <td style={{ ...tdStyle, fontFamily: "'Montserrat', sans-serif", fontSize: '8px', color: 'var(--cy-muted)' }}>
        {p.account}
      </td>
      <td style={tdStyle}>{p.quantity}</td>
      <td style={tdStyle}>{sym}{p.entry_price.toFixed(2)}</td>
      <td style={tdStyle}>{sym}{p.current_price?.toFixed(2) ?? '—'}</td>
      <td style={{ ...tdStyle, color: 'var(--cy-red)' }}>{sym}{p.stop_loss.toFixed(2)}</td>
      <td style={{ ...tdStyle, color: 'var(--cy-green)' }}>{sym}{p.target_price.toFixed(2)}</td>
      <td style={{ ...tdStyle, color: 'var(--cy-red)' }}>
        {p.commission ? `-${sym}${p.commission.toLocaleString()}` : '—'}
      </td>
      <td style={{ ...tdStyle, color: netPnL >= 0 ? 'var(--cy-green)' : 'var(--cy-red)' }}>
        {netPnL >= 0 ? '+' : '-'}{sym}{Math.abs(netPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        <span style={{ fontSize: '9px', marginLeft: '4px' }}>
          {netPnL >= 0 ? '+' : ''}{pnlPct}%
        </span>
      </td>
      <td style={{ ...tdStyle, color: 'var(--cy-yellow)' }}>{rr}x</td>
      <td style={tdStyle}><SignalBadge alert={p.exit_alert} /></td>
      <td style={tdStyle}>
        <button onClick={onEdit} style={{
          padding: '2px 7px',
          background: 'rgba(0,212,255,0.06)',
          border: '1px solid var(--cy-border)',
          color: 'var(--cy-muted)',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '7px', fontWeight: 700,
          cursor: 'pointer',
        }}>
          Edit
        </button>
      </td>
    </tr>
  )
}

function MarketTag({ market }) {
  const isHK = market === 'HK'
  return (
    <span style={{
      display: 'inline-block', padding: '1px 5px',
      fontFamily: "'Montserrat', sans-serif",
      fontSize: '7px', fontWeight: 700, letterSpacing: '1px',
      background: isHK ? 'rgba(0,212,255,0.1)' : 'rgba(255,107,53,0.1)',
      color: isHK ? 'var(--cy-accent)' : 'var(--cy-accent2)',
      border: `1px solid ${isHK ? 'rgba(0,212,255,0.2)' : 'rgba(255,107,53,0.2)'}`,
    }}>
      {market}
    </span>
  )
}

function SignalBadge({ alert }) {
  if (!alert) return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 5px',
      fontFamily: "'Montserrat', sans-serif", fontSize: '7px', fontWeight: 700,
      background: 'rgba(0,255,136,0.08)', color: 'var(--cy-green)',
      border: '1px solid rgba(0,255,136,0.2)', letterSpacing: '0.5px',
    }}>
      ✓ Hold
    </span>
  )
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 5px',
      fontFamily: "'Montserrat', sans-serif", fontSize: '7px', fontWeight: 700,
      background: 'rgba(255,51,85,0.1)', color: 'var(--cy-red)',
      border: '1px solid rgba(255,51,85,0.3)', letterSpacing: '0.5px',
    }}>
      ⚠ {alert}
    </span>
  )
}

function Empty({ children }) {
  return (
    <div style={{
      padding: '20px', textAlign: 'center',
      color: 'var(--cy-muted)',
      fontFamily: "'Share Tech Mono', monospace", fontSize: '11px',
    }}>
      {children}
    </div>
  )
}
