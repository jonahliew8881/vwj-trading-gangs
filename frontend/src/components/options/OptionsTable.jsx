import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function OptionsTable({ options, usdRate, onClose, onRefresh }) {
  const [editingPremium, setEditingPremium] = useState(null)
  const [editVal, setEditVal] = useState('')

  async function savePremium(id) {
    await supabase.from('options').update({ current_premium: parseFloat(editVal) }).eq('id', id)
    setEditingPremium(null)
    onRefresh()
  }

  async function deleteOption(id) {
    if (!window.confirm('確定刪除？')) return
    await supabase.from('options').delete().eq('id', id)
    onRefresh()
  }

  if (options.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px',
        color: '#333', fontFamily: "'Share Tech Mono', monospace",
        border: '1px dashed #1a1a2e', borderRadius: '8px'
      }}>
        NO OPTIONS POSITIONS
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {options.map(o => {
        const size = o.contract_size || 100
        const currency = o.market === 'US' ? 'US$' : 'HK$'
        const multiplier = o.direction === 'buy' ? 1 : -1
        const currentP = o.current_premium || o.premium
        const pnl = multiplier * (currentP - o.premium) * o.contracts * size - (o.commission || 0)
        const pnlHKD = o.market === 'US' ? pnl * usdRate : pnl
        const pnlPct = o.premium > 0 ? ((currentP - o.premium) / o.premium * 100 * multiplier) : 0

        const now = new Date()
        const expiry = new Date(o.expiry_date)
        const daysToExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
        const isExpiringSoon = daysToExpiry <= 7 && daysToExpiry >= 0
        const isExpired = daysToExpiry < 0

        const typeColor = o.option_type === 'call' ? '#00aaff' : '#ff88aa'
        const dirColor = o.direction === 'buy' ? '#00ff88' : '#ff4444'

        return (
          <div key={o.id} style={{
            background: '#0d0d1a',
            border: `1px solid ${isExpiringSoon ? 'rgba(255,160,0,0.4)' : '#1a1a2e'}`,
            borderRadius: '10px',
            padding: '16px',
            position: 'relative'
          }}>
            {/* Top Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Type Badge */}
                <span style={{
                  background: `rgba(${o.option_type === 'call' ? '0,170,255' : '255,136,170'},0.15)`,
                  border: `1px solid ${typeColor}`,
                  color: typeColor,
                  padding: '2px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: "'Josefin Sans', sans-serif",
                  letterSpacing: '2px',
                  fontWeight: '700'
                }}>{o.option_type.toUpperCase()}</span>

                {/* Direction Badge */}
                <span style={{
                  background: `rgba(${o.direction === 'buy' ? '0,255,136' : '255,68,68'},0.1)`,
                  border: `1px solid ${dirColor}`,
                  color: dirColor,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontFamily: "'Josefin Sans', sans-serif",
                  letterSpacing: '1px'
                }}>{o.direction.toUpperCase()}</span>

                <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: '700', fontSize: '16px', color: '#e0e0e0', letterSpacing: '2px' }}>
                  {o.ticker}
                </span>
                <span style={{ color: '#888', fontSize: '13px', fontFamily: "'Share Tech Mono', monospace" }}>
                  {currency}{o.strike_price} · {o.contracts} ct
                </span>
              </div>

              {/* P&L */}
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '18px',
                  fontWeight: '700',
                  color: pnl >= 0 ? '#00ff88' : '#ff4444'
                }}>
                  {currency}{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: pnl >= 0 ? '#00cc66' : '#cc3333' }}>
                  {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Middle Row — Key Stats */}
            <div style={{ display: 'flex', gap: '20px', margin: '12px 0', flexWrap: 'wrap' }}>
              {[
                { label: 'ENTRY', value: `${currency}${o.premium}` },
                { label: 'CURRENT', value: null, id: o.id, currentP },
                { label: 'ACCOUNT', value: o.account },
                { label: 'EXPIRY', value: o.expiry_date, color: isExpired ? '#ff4444' : isExpiringSoon ? '#ffa000' : '#888' },
                {
                  label: 'DAYS LEFT',
                  value: isExpired ? 'EXPIRED' : `${daysToExpiry}d`,
                  color: isExpired ? '#ff4444' : isExpiringSoon ? '#ffa000' : '#888'
                },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: '9px', color: '#555', letterSpacing: '1px', marginBottom: '2px' }}>{item.label}</div>
                  {item.id ? (
                    editingPremium === item.id ? (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input
                          type="number" step="0.01"
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          style={{
                            width: '70px', background: '#111122', border: '1px solid #00ff88',
                            borderRadius: '4px', padding: '3px 6px', color: '#00ff88',
                            fontSize: '12px', fontFamily: "'Share Tech Mono', monospace", outline: 'none'
                          }}
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') savePremium(item.id); if (e.key === 'Escape') setEditingPremium(null) }}
                        />
                        <button onClick={() => savePremium(item.id)} style={{ background: 'none', border: 'none', color: '#00ff88', cursor: 'pointer', fontSize: '14px' }}>✓</button>
                      </div>
                    ) : (
                      <div
                        onClick={() => { setEditingPremium(item.id); setEditVal(item.currentP) }}
                        style={{ fontSize: '13px', fontFamily: "'Share Tech Mono', monospace", color: '#e0e0e0', cursor: 'pointer', borderBottom: '1px dashed #333' }}
                        title="點擊更新現時期權金"
                      >
                        {currency}{item.currentP} ✏️
                      </div>
                    )
                  ) : (
                    <div style={{ fontSize: '13px', fontFamily: "'Share Tech Mono', monospace", color: item.color || '#aaa' }}>{item.value}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Greeks Row */}
            {(o.delta || o.theta || o.gamma || o.vega || o.iv) && (
              <div style={{
                display: 'flex', gap: '16px', flexWrap: 'wrap',
                padding: '10px 12px',
                background: '#111122', borderRadius: '6px',
                marginBottom: '10px'
              }}>
                {[
                  { label: 'Δ Delta', value: o.delta, color: '#00aaff' },
                  { label: 'Γ Gamma', value: o.gamma, color: '#aa88ff' },
                  { label: 'Θ Theta', value: o.theta, color: o.theta < 0 ? '#ff8844' : '#00ff88' },
                  { label: 'V Vega', value: o.vega, color: '#88ffaa' },
                  { label: 'IV', value: o.iv ? `${o.iv}%` : null, color: '#ffff88' },
                ].filter(g => g.value !== null && g.value !== undefined).map(g => (
                  <div key={g.label}>
                    <div style={{ fontSize: '9px', color: '#555', letterSpacing: '1px', marginBottom: '2px' }}>{g.label}</div>
                    <div style={{ fontSize: '12px', fontFamily: "'Share Tech Mono', monospace", color: g.color }}>{g.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {o.notes && (
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '10px', fontStyle: 'italic' }}>
                "{o.notes}"
              </div>
            )}

            {/* Actions */}
            {o.status === 'open' && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => deleteOption(o.id)} style={{
                  padding: '6px 12px', borderRadius: '4px',
                  border: '1px solid #333', background: 'transparent',
                  color: '#666', fontSize: '11px', cursor: 'pointer',
                  fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '1px'
                }}>DELETE</button>
                <button onClick={() => onClose(o)} style={{
                  padding: '6px 16px', borderRadius: '4px',
                  border: '1px solid #ff4444',
                  background: 'rgba(255,68,68,0.1)',
                  color: '#ff4444', fontSize: '11px', cursor: 'pointer',
                  fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '1px', fontWeight: '700'
                }}>CLOSE POSITION</button>
              </div>
            )}

            {/* Closed Badge */}
            {o.status === 'closed' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#666' }}>
                  Closed @ {currency}{o.close_premium} · {o.closed_at ? new Date(o.closed_at).toLocaleDateString() : ''}
                </span>
                <span style={{ fontSize: '10px', color: '#444', background: '#111', padding: '2px 8px', borderRadius: '4px' }}>CLOSED</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
