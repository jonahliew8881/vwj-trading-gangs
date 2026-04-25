import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Modal from '../ui/Modal'

const ACCOUNTS = ['耀才', 'Citi', '富途', 'IBKR']
const MARKETS  = ['HK', 'US']

export default function AddPositionModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    ticker: '', account: '耀才', market: 'HK',
    entry_price: '', quantity: '',
    stop_loss: '', target_price: '',
    commission: '', entry_reason: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Preview cost
  const totalCost = form.entry_price && form.quantity
    ? parseFloat(form.entry_price) * parseInt(form.quantity) + (parseFloat(form.commission) || 0)
    : null

  async function handleSubmit() {
    if (!form.ticker || !form.entry_price || !form.quantity || !form.stop_loss || !form.target_price) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)

    const entryPrice  = parseFloat(form.entry_price)
    const quantity    = parseInt(form.quantity)
    const commission  = parseFloat(form.commission) || 0
    const totalSpend  = entryPrice * quantity + commission

    // 1. Insert position
    const { error: posErr } = await supabase.from('positions').insert([{
      ticker:        form.ticker.toUpperCase().trim(),
      account:       form.account,
      market:        form.market,
      entry_price:   entryPrice,
      current_price: entryPrice,
      quantity,
      stop_loss:     parseFloat(form.stop_loss),
      target_price:  parseFloat(form.target_price),
      commission,
      entry_reason:  form.entry_reason,
      status:        'open',
    }])

    if (posErr) { setError(posErr.message); setLoading(false); return }

    // 2. Deduct from capital
    const { data: capData } = await supabase
      .from('capital')
      .select('current')
      .eq('account', form.account)
      .single()

    if (capData) {
      const newCurrent = parseFloat(capData.current) - totalSpend
      await supabase.from('capital').update({ current: newCurrent }).eq('account', form.account)

      // 3. Log transaction
      await supabase.from('capital_transactions').insert([{
        account: form.account,
        type:    'withdrawal',
        amount:  -totalSpend,
        note:    `Buy ${form.ticker.toUpperCase()} ${quantity} @ ${entryPrice}`,
      }])
    }

    setLoading(false)
    onSuccess()
  }

  return (
    <Modal title="Add Position" onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
        <Field label="Ticker *">
          <input style={inputStyle} placeholder="e.g. 700.HK"
            value={form.ticker} onChange={e => set('ticker', e.target.value)} />
        </Field>
        <Field label="Account">
          <select style={inputStyle} value={form.account} onChange={e => set('account', e.target.value)}>
            {ACCOUNTS.map(a => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Market">
          <select style={inputStyle} value={form.market} onChange={e => set('market', e.target.value)}>
            {MARKETS.map(m => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Quantity *">
          <input style={inputStyle} type="number" placeholder="0"
            value={form.quantity} onChange={e => set('quantity', e.target.value)} />
        </Field>
        <Field label="Entry Price *">
          <input style={inputStyle} type="number" placeholder="0.00"
            value={form.entry_price} onChange={e => set('entry_price', e.target.value)} />
        </Field>
        <Field label="Stop Loss *">
          <input style={inputStyle} type="number" placeholder="0.00"
            value={form.stop_loss} onChange={e => set('stop_loss', e.target.value)} />
        </Field>
        <Field label="Target Price *">
          <input style={inputStyle} type="number" placeholder="0.00"
            value={form.target_price} onChange={e => set('target_price', e.target.value)} />
        </Field>
        <Field label="Commission">
          <input style={inputStyle} type="number" placeholder="0.00"
            value={form.commission} onChange={e => set('commission', e.target.value)} />
        </Field>
      </div>

      <Field label="Entry Reason" style={{ marginTop: '7px' }}>
        <input style={inputStyle} placeholder="e.g. S1 Compression + A2 Multi-TF"
          value={form.entry_reason} onChange={e => set('entry_reason', e.target.value)} />
      </Field>

      {/* Cost preview */}
      {totalCost !== null && (
        <div style={{
          marginTop: '8px', background: 'var(--cy-grid)',
          border: '1px solid rgba(255,51,85,0.2)',
          padding: '7px 10px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '8px', fontWeight: 700, color: 'var(--cy-muted)', letterSpacing: '1px' }}>
            TOTAL COST (deducted from {form.account})
          </span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '14px', color: 'var(--cy-red)' }}>
            -{form.market === 'US' ? '$' : 'HK$'}{totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      )}

      {error && <div style={{ color: 'var(--cy-red)', fontSize: '10px', marginTop: '6px', fontFamily: "'Montserrat', sans-serif" }}>{error}</div>}

      <button onClick={handleSubmit} disabled={loading} style={{
        width: '100%', marginTop: '10px', padding: '8px',
        background: 'rgba(0,212,255,0.08)', border: '1px solid var(--cy-accent)',
        color: 'var(--cy-accent)', fontFamily: "'Montserrat', sans-serif",
        fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
        textTransform: 'uppercase',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}>
        {loading ? 'Saving...' : 'Confirm Position'}
      </button>
    </Modal>
  )
}

function Field({ label, children, style }) {
  return (
    <div style={style}>
      <div style={{
        fontFamily: "'Montserrat', sans-serif", fontSize: '7px', fontWeight: 700,
        color: 'var(--cy-muted)', letterSpacing: '1.5px',
        textTransform: 'uppercase', marginBottom: '3px',
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', background: 'rgba(0,212,255,0.04)',
  border: '1px solid var(--cy-border)', color: 'var(--cy-text)',
  padding: '6px 7px', fontFamily: "'Share Tech Mono', monospace",
  fontSize: '11px', outline: 'none',
}
