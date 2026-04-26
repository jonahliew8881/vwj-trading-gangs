import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function OptionsPanel({ usdRate }) {
  const [options, setOptions] = useState([])

  useEffect(() => {
    supabase.from('options').select('*').eq('status', 'open').then(({ data }) => setOptions(data || []))
  }, [])

  if (options.length === 0) return null

  const totalPnlHKD = options.reduce((sum, o) => {
    const size = o.contract_size || 100
    const multiplier = o.direction === 'buy' ? 1 : -1
    const pnl = multiplier * ((o.current_premium || o.premium) - o.premium) * o.contracts * size - (o.commission || 0)
    return sum + (o.market === 'US' ? pnl * usdRate : pnl)
  }, 0)

  const expiryWarnings = options.filter(o => {
    const days = Math.ceil((new Date(o.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
    return days <= 7 && days >= 0
  })

  return (
    <div style={{
      background: '#0d0d1a',
      border: '1px solid #1a1a2e',
      borderRadius: '10px',
      padding: '16px',
      marginTop: '16px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', color: '#666', letterSpacing: '2px', fontFamily: "'Josefin Sans', sans-serif" }}>
          OPTIONS POSITIONS
        </div>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '15px',
          color: totalPnlHKD >= 0 ? '#00ff88' : '#ff4444',
          fontWeight: '700'
        }}>
          HK${totalPnlHKD >= 0 ? '+' : ''}{totalPnlHKD.toFixed(0)}
        </div>
      </div>

      {/* Expiry Warning */}
      {expiryWarnings.length > 0 && (
        <div style={{
          background: 'rgba(255,160,0,0.08)',
          border: '1px solid rgba(255,160,0,0.25)',
          borderRadius: '6px',
          padding: '8px 12px',
          marginBottom: '12px',
          fontSize: '11px',
          color: '#ffa000',
          letterSpacing: '0.5px'
        }}>
          ⚠️ {expiryWarnings.map(o => {
            const days = Math.ceil((new Date(o.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
            return `${o.ticker} exp in ${days}d`
          }).join(' · ')}
        </div>
      )}

      {/* Options List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {options.map(o => {
          const size = o.contract_size || 100
          const currency = o.market === 'US' ? 'US$' : 'HK$'
          const multiplier = o.direction === 'buy' ? 1 : -1
          const currentP = o.current_premium || o.premium
          const pnl = multiplier * (currentP - o.premium) * o.contracts * size - (o.commission || 0)
          const typeColor = o.option_type === 'call' ? '#00aaff' : '#ff88aa'
          const daysToExpiry = Math.ceil((new Date(o.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
          const isExpiringSoon = daysToExpiry <= 7 && daysToExpiry >= 0

          return (
            <div key={o.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 12px',
              background: '#111122',
              borderRadius: '6px',
              border: `1px solid ${isExpiringSoon ? 'rgba(255,160,0,0.3)' : '#1a1a2e'}`,
              flexWrap: 'wrap', gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '10px', fontFamily: "'Josefin Sans', sans-serif",
                  letterSpacing: '1px', fontWeight: '700', color: typeColor
                }}>{o.option_type.toUpperCase()}</span>
                <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: '700', color: '#e0e0e0', letterSpacing: '1px' }}>
                  {o.ticker}
                </span>
                <span style={{ fontSize: '12px', color: '#666', fontFamily: "'Share Tech Mono', monospace" }}>
                  {currency}{o.strike_price} · {o.expiry_date}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isExpiringSoon && (
                  <span style={{ fontSize: '10px', color: '#ffa000' }}>⚠️ {daysToExpiry}d</span>
                )}
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '14px',
                  color: pnl >= 0 ? '#00ff88' : '#ff4444',
                  fontWeight: '700'
                }}>
                  {currency}{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
