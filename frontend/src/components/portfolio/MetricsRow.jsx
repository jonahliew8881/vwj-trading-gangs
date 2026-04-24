import React from 'react'

export default function MetricsRow({ totalValue, unrealizedPnL }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '7px',
      marginBottom: '10px',
    }}>
      <MetricCard
        label="Total Portfolio"
        value={`$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        sub="Open positions"
        accent="var(--cy-green)"
        valueColor="var(--cy-green)"
      />
      <MetricCard
        label="Unrealized P&L"
        value={`${unrealizedPnL >= 0 ? '+' : ''}$${Math.abs(unrealizedPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        sub="Net of commission"
        accent="var(--cy-green)"
        valueColor={unrealizedPnL >= 0 ? 'var(--cy-green)' : 'var(--cy-red)'}
      />
      <MetricCard
        label="Realized P&L (MTD)"
        value="+$0"
        sub="From journal"
        accent="var(--cy-accent)"
        valueColor="var(--cy-accent)"
      />
      <MetricCard
        label="Win Rate"
        value="—"
        sub="Min 30 trades"
        accent="var(--cy-yellow)"
        valueColor="var(--cy-yellow)"
      />
    </div>
  )
}

function MetricCard({ label, value, sub, accent, valueColor }) {
  return (
    <div style={{
      background: 'var(--cy-panel)',
      border: '1px solid var(--cy-border)',
      padding: '9px 11px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '2px', height: '100%',
        background: accent,
      }} />
      <div style={{
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '7px', fontWeight: 700,
        color: 'var(--cy-muted)',
        letterSpacing: '1.5px', textTransform: 'uppercase',
        marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '19px',
        color: valueColor,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '8px', color: 'var(--cy-muted)', marginTop: '2px',
      }}>
        {sub}
      </div>
    </div>
  )
}
