import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const ACCOUNTS = ['Citi', '耀才', '富途', 'IBKR']
const HK_CONTRACT_SIZES = [100, 200, 500, 1000, 2000, 5000]

export default function AddOptionModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    ticker: '',
    underlying_ticker: '',
    account: 'IBKR',
    market: 'US',
    option_type: 'call',
    direction: 'buy',
    strike_price: '',
    expiry_date: '',
    premium: '',
    contracts: 1,
    contract_size: 100,
    commission: '',
    current_premium: '',
    delta: '',
    theta: '',
    gamma: '',
    vega: '',
    iv: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, val) {
    setForm(f => {
      const updated = { ...f, [field]: val }
      // Auto contract size
      if (field === 'market') {
        updated.contract_size = val === 'US' ? 100 : 500
        updated.account = val === 'US' ? 'IBKR' : '耀才'
      }
      return updated
    })
  }

  // Cost & P&L preview
  const size = parseInt(form.contract_size) || 100
  const contracts = parseInt(form.contracts) || 0
  const premium = parseFloat(form.premium) || 0
  const currentPremium = parseFloat(form.current_premium) || premium
  const commission = parseFloat(form.commission) || 0
  const totalCost = premium * contracts * size + commission
  const multiplier = form.direction === 'buy' ? 1 : -1
  const unrealizedPnL = multiplier * (currentPremium - premium) * contracts * size - commission

  async function handleSubmit() {
    if (!form.ticker || !form.strike_price || !form.expiry_date || !form.premium) {
      setError('請填寫：Ticker / Strike / Expiry / Premium')
      return
    }
    setSaving(true)
    setError('')

    // Set underlying_ticker = ticker if not specified
    const payload = {
      ...form,
      underlying_ticker: form.underlying_ticker || form.ticker,
      ticker: form.ticker.toUpperCase(),
      strike_price: parseFloat(form.strike_price),
      premium: parseFloat(form.premium),
      contracts: parseInt(form.contracts),
      contract_size: parseInt(form.contract_size),
      commission: parseFloat(form.commission) || 0,
      current_premium: parseFloat(form.current_premium) || parseFloat(form.premium),
      delta: form.delta ? parseFloat(form.delta) : null,
      theta: form.theta ? parseFloat(form.theta) : null,
      gamma: form.gamma ? parseFloat(form.gamma) : null,
      vega: form.vega ? parseFloat(form.vega) : null,
      iv: form.iv ? parseFloat(form.iv) : null,
    }

    const { error: err } = await supabase.from('options').insert([payload])
    setSaving(false)
    if (err) { setError(err.message); return }
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
    fontSize: '10px',
    color: '#666',
    letterSpacing: '1.5px',
    marginBottom: '6px',
    display: 'block',
    textTransform: 'uppercase'
  }
  const fieldStyle = { marginBottom: '14px' }

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
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: '16px',
            letterSpacing: '3px',
            color: '#00ff88',
            margin: 0,
            textTransform: 'uppercase'
          }}>ADD OPTION POSITION</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Market + Direction */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={labelStyle}>Market</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['US', 'HK'].map(m => (
                <button key={m} onClick={() => set('market', m)} style={{
                  flex: 1, padding: '9px', borderRadius: '6px',
                  border: form.market === m ? '1px solid #00ff88' : '1px solid #2a2a3e',
                  background: form.market === m ? 'rgba(0,255,136,0.1)' : '#111122',
                  color: form.market === m ? '#00ff88' : '#666',
                  fontSize: '12px', cursor: 'pointer',
                  fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '1px'
                }}>{m}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Direction</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['buy', 'sell'].map(d => (
                <button key={d} onClick={() => set('direction', d)} style={{
                  flex: 1, padding: '9px', borderRadius: '6px',
                  border: form.direction === d ? `1px solid ${d === 'buy' ? '#00ff88' : '#ff4444'}` : '1px solid #2a2a3e',
                  background: form.direction === d ? `rgba(${d === 'buy' ? '0,255,136' : '255,68,68'},0.1)` : '#111122',
                  color: form.direction === d ? (d === 'buy' ? '#00ff88' : '#ff4444') : '#666',
                  fontSize: '12px', cursor: 'pointer',
                  fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>{d}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Option Type */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Option Type</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['call', 'put'].map(t => (
              <button key={t} onClick={() => set('option_type', t)} style={{
                flex: 1, padding: '9px', borderRadius: '6px',
                border: form.option_type === t ? `1px solid ${t === 'call' ? '#00aaff' : '#ff88aa'}` : '1px solid #2a2a3e',
                background: form.option_type === t ? `rgba(${t === 'call' ? '0,170,255' : '255,136,170'},0.1)` : '#111122',
                color: form.option_type === t ? (t === 'call' ? '#00aaff' : '#ff88aa') : '#666',
                fontSize: '13px', cursor: 'pointer',
                fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '2px',
                textTransform: 'uppercase'
              }}>{t === 'call' ? '📈 CALL' : '📉 PUT'}</button>
            ))}
          </div>
        </div>

        {/* Ticker + Underlying */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={labelStyle}>Option Ticker</label>
            <input style={inputStyle} placeholder={form.market === 'US' ? 'e.g. AAPL' : 'e.g. 00700'} value={form.ticker} onChange={e => set('ticker', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Underlying (選填)</label>
            <input style={inputStyle} placeholder="同上可留空" value={form.underlying_ticker} onChange={e => set('underlying_ticker', e.target.value)} />
          </div>
        </div>

        {/* Account */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Account</label>
          <select style={inputStyle} value={form.account} onChange={e => set('account', e.target.value)}>
            {ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Strike + Expiry */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={labelStyle}>Strike Price</label>
            <input style={inputStyle} type="number" placeholder="行使價" value={form.strike_price} onChange={e => set('strike_price', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Expiry Date</label>
            <input style={inputStyle} type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} />
          </div>
        </div>

        {/* Premium + Current */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={labelStyle}>Entry Premium (per share)</label>
            <input style={inputStyle} type="number" step="0.01" placeholder="入場期權金" value={form.premium} onChange={e => set('premium', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Current Premium (per share)</label>
            <input style={inputStyle} type="number" step="0.01" placeholder="現時期權金" value={form.current_premium} onChange={e => set('current_premium', e.target.value)} />
          </div>
        </div>

        {/* Contracts + Contract Size */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={labelStyle}>Contracts (張數)</label>
            <input style={inputStyle} type="number" min="1" value={form.contracts} onChange={e => set('contracts', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Contract Size (每張股數)</label>
            {form.market === 'US' ? (
              <input style={{ ...inputStyle, color: '#666' }} value="100 (US Standard)" readOnly />
            ) : (
              <select style={inputStyle} value={form.contract_size} onChange={e => set('contract_size', e.target.value)}>
                {HK_CONTRACT_SIZES.map(s => <option key={s} value={s}>{s} 股</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Commission */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Commission (總佣金)</label>
          <input style={inputStyle} type="number" step="0.01" placeholder="0" value={form.commission} onChange={e => set('commission', e.target.value)} />
        </div>

        {/* Cost Preview */}
        <div style={{
          background: '#111122', border: '1px solid #2a2a3e', borderRadius: '8px',
          padding: '12px 16px', marginBottom: '20px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'
        }}>
          <div>
            <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px', marginBottom: '4px' }}>TOTAL COST</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", color: '#ffa000', fontSize: '15px' }}>
              {form.market === 'US' ? 'US$' : 'HK$'}{totalCost.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px', marginBottom: '4px' }}>UNREALIZED P&L</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", color: unrealizedPnL >= 0 ? '#00ff88' : '#ff4444', fontSize: '15px' }}>
              {form.market === 'US' ? 'US$' : 'HK$'}{unrealizedPnL >= 0 ? '+' : ''}{unrealizedPnL.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Greeks Section */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: '#444', letterSpacing: '2px', marginBottom: '12px', borderTop: '1px solid #1a1a2e', paddingTop: '16px' }}>
            GREEKS（手動輸入，選填）
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {[
              { key: 'delta', label: 'Delta', placeholder: '0.5' },
              { key: 'gamma', label: 'Gamma', placeholder: '0.02' },
              { key: 'theta', label: 'Theta', placeholder: '-0.05' },
              { key: 'vega', label: 'Vega', placeholder: '0.1' },
              { key: 'iv', label: 'IV %', placeholder: '30' },
            ].map(g => (
              <div key={g.key}>
                <label style={{ ...labelStyle, fontSize: '9px' }}>{g.label}</label>
                <input style={{ ...inputStyle, padding: '8px', fontSize: '12px' }}
                  type="number" step="0.001" placeholder={g.placeholder}
                  value={form[g.key]} onChange={e => set(g.key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Notes</label>
          <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
            placeholder="入場理由、策略..." value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        {error && <div style={{ color: '#ff4444', fontSize: '12px', marginBottom: '12px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #333',
            background: 'transparent', color: '#666', fontSize: '12px',
            fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '2px', cursor: 'pointer'
          }}>CANCEL</button>
          <button onClick={handleSubmit} disabled={saving} style={{
            flex: 2, padding: '12px', borderRadius: '6px', border: 'none',
            background: saving ? '#333' : 'linear-gradient(135deg, #00ff88, #00cc6a)',
            color: '#000', fontSize: '12px',
            fontFamily: "'Josefin Sans', sans-serif", fontWeight: '700',
            letterSpacing: '2px', cursor: saving ? 'not-allowed' : 'pointer'
          }}>{saving ? 'SAVING...' : 'ADD POSITION'}</button>
        </div>
      </div>
    </div>
  )
}
