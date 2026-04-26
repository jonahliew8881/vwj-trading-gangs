import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function CloseOptionModal({ option, onClose, onSaved }) {
  const [closePremium, setClosePremium] = useState('')
  const [commission, setCommission] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const size = option.contract_size || 100
  const contracts = option.contracts || 1
  const entryPremium = parseFloat(option.premium) || 0
  const closeP = parseFloat(closePremium) || 0
  const comm = parseFloat(commission) || 0
  const multiplier = option.direction === 'buy' ? 1 : -1
  const pnl = multiplier * (closeP - entryPremium) * contracts * size - (option.commission || 0) - comm
  const currency = option.market === 'US' ? 'US$' : 'HK$'

  const daysHeld = Math.ceil((new Date() - new Date(option.created_at)) / (1000 * 60 * 60 * 24))
  const daysToExpiry = Math.ceil((new Date(option.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))

  async function handleClose() {
    if (!closePremium) { setError('請輸入平倉期權金'); return }
    setSaving(true)
    setError('')

    const { error: err } = await supabase.from('options').update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      close_premium: closeP,
    }).eq('id', option.id)

    if (err) { setError(err.message); setSaving(false); return }

    // Log to trades table
    const strategyLabel = `${option.direction.toUpperCase()} ${option.option_type.toUpperCase()} ${option.strike_price} exp ${option.expiry_date}`
    await supabase.from('trades').insert([{
      ticker: option.ticker,
      account: option.account,
      market: option.market,
      entry_price: entryPremium,
      exit_price: closeP,
      quantity: contracts * size,
      commission: (option.commission || 0) + comm,
      strategy_used: strategyLabel,
      notes: option.notes,
      outcome: pnl >= 0 ? 'win' : 'loss',
      pnl: pnl,
    }])

    // Update capital
    const { data: capData } = await supabase.from('capital').select('*').eq('account', option.account).single()
    if (capData) {
      const profitInAccountCurrency = pnl
      await supabase.from('capital').update({ current: capData.current + profitInAccountCurrency }).eq('account', option.account)
      await supabase.from('capital_transactions').insert([{
        account: option.account,
        type: 'trade_pnl',
        amount: profitInAccountCurrency,
        note: `Options P&L: ${option.ticker} ${strategyLabel}`
      }])
    }

    setSaving(false)
    onSaved()
  }

  const inputStyle = {
    width: '100%',
    background: '#111122',
    border: '1px solid #2a2a3e',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#e0e0e0',
    fontSize: '13px',
    fontFamily: "'Montserrat', sans-serif",
    outline: 'none',
    boxSizing: 'border-box'
  }
  const labelStyle = {
    fontSize: '10px', color: '#666',
    letterSpacing: '1.5px', marginBottom: '6px',
    display: 'block', textTransform: 'uppercase'
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px'
    }}>
      <div style={{
        background: '#0d0d1a',
        border: '1px solid #1a1a2e',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '420px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: '16px', letterSpacing: '3px',
            color: '#ff4444', margin: 0, textTransform: 'uppercase'
          }}>CLOSE OPTION</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Position Summary */}
        <div style={{
          background: '#111122', border: '1px solid #2a2a3e',
          borderRadius: '8px', padding: '14px', marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#e0e0e0', marginBottom: '10px', fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '1px' }}>
            {option.ticker} · {option.direction.toUpperCase()} {option.option_type.toUpperCase()} @ {currency}{option.strike_price}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { label: 'Entry Premium', value: `${currency}${entryPremium}` },
              { label: 'Contracts', value: `${contracts} × ${size}` },
              { label: 'Days Held', value: `${daysHeld}d` },
              { label: 'Expiry', value: option.expiry_date },
              { label: 'Days to Expiry', value: daysToExpiry <= 0 ? 'EXPIRED' : `${daysToExpiry}d`, color: daysToExpiry <= 7 ? '#ffa000' : '#666' },
              { label: 'Account', value: option.account },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: '9px', color: '#555', letterSpacing: '1px', marginBottom: '2px' }}>{item.label}</div>
                <div style={{ fontSize: '12px', fontFamily: "'Share Tech Mono', monospace", color: item.color || '#aaa' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Close Premium Input */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Close Premium (per share)</label>
          <input style={inputStyle} type="number" step="0.01" placeholder="平倉期權金"
            value={closePremium} onChange={e => setClosePremium(e.target.value)} autoFocus />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Close Commission</label>
          <input style={inputStyle} type="number" step="0.01" placeholder="0"
            value={commission} onChange={e => setCommission(e.target.value)} />
        </div>

        {/* P&L Preview */}
        {closePremium && (
          <div style={{
            background: pnl >= 0 ? 'rgba(0,255,136,0.08)' : 'rgba(255,68,68,0.08)',
            border: `1px solid ${pnl >= 0 ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,68,0.3)'}`,
            borderRadius: '8px', padding: '16px', marginBottom: '20px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', color: '#666', letterSpacing: '2px', marginBottom: '6px' }}>REALIZED P&L</div>
            <div style={{ fontSize: '28px', fontFamily: "'Share Tech Mono', monospace", fontWeight: '700', color: pnl >= 0 ? '#00ff88' : '#ff4444' }}>
              {currency}{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              ({contracts} × {size} × {currency}{(closeP - entryPremium).toFixed(2)})
            </div>
          </div>
        )}

        {error && <div style={{ color: '#ff4444', fontSize: '12px', marginBottom: '12px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #333',
            background: 'transparent', color: '#666', fontSize: '12px',
            fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '2px', cursor: 'pointer'
          }}>CANCEL</button>
          <button onClick={handleClose} disabled={saving} style={{
            flex: 2, padding: '12px', borderRadius: '6px', border: 'none',
            background: saving ? '#333' : 'linear-gradient(135deg, #ff4444, #cc2222)',
            color: '#fff', fontSize: '12px',
            fontFamily: "'Josefin Sans', sans-serif", fontWeight: '700',
            letterSpacing: '2px', cursor: saving ? 'not-allowed' : 'pointer'
          }}>{saving ? 'CLOSING...' : 'CONFIRM CLOSE'}</button>
        </div>
      </div>
    </div>
  )
}
