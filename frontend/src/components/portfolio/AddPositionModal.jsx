import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Modal from '../ui/Modal'

const ACCOUNTS = ['耀才', 'Citi', '富途', 'IBKR']
const MARKETS = ['HK', 'US']

export default function AddPositionModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    ticker: '', account: '耀才', market: 'HK',
    entry_price: '', quantity: '',
    stop_loss: '', target_price: '',
    commission: '', entry_reason: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    if (!form.ticker || !form.entry_price || !form.quantity || !form.stop_loss || !form.target_price) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.from('positions').insert([{
      ticker:        form.ticker.toUpperCase().trim(),
      account:       form.account,
      market:        form.market,
      entry_price:   parseFloat(form.entry_price),
      current_price: parseFloat(form.entry_price),
      quantity:      parseInt(form.quantity),
      stop_loss:     parseFloat(form.stop_loss),
      target_price:  parseFloat(form.target_price),
      commission:    parseFloat(form.commission) || 0,
      entry_reason:  form.entry_reason,
      status:        'open',
    }])
    setLoading(false)
    if (err) { setError(err.message); return }
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
        <Field label="Commission (Total)">
          <input style={inputStyle} type="number" placeholder="0.00"
            value={form.commission} onChange={e => set('commission', e.target.value)} />
        </Field>
      </div>
      <Field label="Entry Reason" style={{ marginTop: '7px' }}>
        <input style={inputStyle} placeholder="e.g. S1 Compression + A2 Multi-TF"
          value={form.entry_reason} onChange={e => set('entry_reason', e.target.value)} />
      </Field>
      {error && <div style={{ color: 'var(--cy-red)', fontSize: '10px', marginTop: '6px', fontFamily: "'Montserrat', sans-serif" }}>{error}</div>}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%', marginTop: '10px', padding: '8px',
          background: 'rgba(0,212,255,0.08)',
          border: '1px solid var(--cy-accent)',
          color: 'var(--cy-accent)',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '10px', fontWeight: 700,
          letterSpacing: '2px', textTransform: 'uppercase',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Saving...' : 'Confirm Position'}
      </button>
    </Modal>
  )
}

function Field({ label, children, style }) {
  return (
    <div style={style}>
      <div style={{
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '7px', fontWeight: 700,
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
  width: '100%',
  background: 'rgba(0,212,255,0.04)',
  border: '1px solid var(--cy-border)',
  color: 'var(--cy-text)',
  padding: '6px 7px',
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: '11px',
  outline: 'none',
}
