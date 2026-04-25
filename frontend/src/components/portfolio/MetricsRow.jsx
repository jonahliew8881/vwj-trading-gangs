import React from 'react'

export default function MetricsRow({ totalValue, unrealizedPnL, currency = 'HKD' }) {
  const symbol = currency === 'HKD' ? 'HK$' : '$'

  const formatVal = (v, ccy) => {
    const sym = ccy === 'HKD' ? 'HK$' : '$'
    return `${sym}${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '7px',
      marginBottom: '10px',
    }}>
      <MetricCard
        label="Total Portfolio (HKD)"
        value={`HK$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        sub="All accounts · HKD equiv."
        accent="var(--cy-green)"
        valueColor="var(--cy-green)"
      />
      <MetricCard
        label="Unrealized P&L"
        value={`${unrealizedPnL >= 0 ? '+' : '-'}${formatVal(unrealizedPnL, currency)}`}
        sub="Net of commission"
        accent="var(--cy-green)"
        valueColor={unrealizedPnL >= 0 ? 'var(--cy-green)' : 'var(--cy-red)'}
      />
      <MetricCard
        label="Realized P&L (MTD)"
        value="→ Journal"
        sub="See Journal tab"
        accent="var(--cy-accent)"
        valueColor="var(--cy-accent)"
      />
      <MetricCard
        label="Win Rate"
        value="→ Journal"
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
        fontSize: '17px',
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
