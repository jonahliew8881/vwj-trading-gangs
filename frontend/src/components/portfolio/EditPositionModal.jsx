import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Modal from '../ui/Modal'

export default function EditPositionModal({ position: p, onClose, onSuccess }) {
  const [form, setForm] = useState({
    current_price: p.current_price ?? '',
    stop_loss:     p.stop_loss ?? '',
    target_price:  p.target_price ?? '',
    commission:    p.commission ?? '',
  })
  const [closeForm, setCloseForm] = useState({
    exit_price:    p.current_price ?? '',
    commission:    p.commission ?? '',
    strategy_used: p.entry_reason || '',
    notes:         '',
  })
  const [tab, setTab] = useState('edit')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setC = (k, v) => setCloseForm(f => ({ ...f, [k]: v }))

  async function handleUpdate() {
    setLoading(true)
    const { error: err } = await supabase.from('positions').update({
      current_price: parseFloat(form.current_price),
      stop_loss:     parseFloat(form.stop_loss),
      target_price:  parseFloat(form.target_price),
      commission:    parseFloat(form.commission) || 0,
    }).eq('id', p.id)
    setLoading(false)
    if (err) { setError(err.message); return }
    onSuccess()
  }

  async function handleClose() {
    if (!closeForm.exit_price) { setError('Please enter exit price.'); return }
    setLoading(true)

    const exitPrice  = parseFloat(closeForm.exit_price)
    const commission = parseFloat(closeForm.commission) || 0
    const pnl        = (exitPrice - p.entry_price) * p.quantity - commission
    const proceeds   = exitPrice * p.quantity - commission

    // 1. Close position
    await supabase.from('positions').update({
      status:        'closed',
      closed_at:     new Date().toISOString(),
      current_price: exitPrice,
      commission:    commission,
    }).eq('id', p.id)

    // 2. Log to journal
    await supabase.from('trades').insert([{
      ticker:        p.ticker,
      account:       p.account,
      market:        p.market,
      entry_price:   p.entry_price,
      exit_price:    exitPrice,
      stop_loss:     p.stop_loss,
      quantity:      p.quantity,
      commission:    commission,
      strategy_used: closeForm.strategy_used,
      notes:         closeForm.notes,
    }])

    // 3. Update capital — add proceeds back to account
    const { data: capData } = await supabase
      .from('capital')
      .select('current')
      .eq('account', p.account)
      .single()

    if (capData) {
      const newCurrent = parseFloat(capData.current) + proceeds
      await supabase.from('capital').update({ current: newCurrent }).eq('account', p.account)
    }

    // 4. Log capital transaction
    await supabase.from('capital_transactions').insert([{
      account: p.account,
      type:    'trade_pnl',
      amount:  pnl,
      note:    `${p.ticker} closed @ ${exitPrice}`,
    }])

    setLoading(false)
    onSuccess()
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(0,212,255,0.04)',
    border: '1px solid var(--cy-border)',
    color: 'var(--cy-text)',
    padding: '6px 7px',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '11px', outline: 'none',
  }
  const labelStyle = {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '7px', fontWeight: 700,
    color: 'var(--cy-muted)', letterSpacing: '1.5px',
    textTransform: 'uppercase', marginBottom: '3px',
  }

  // Preview PnL
  const previewPnL = closeForm.exit_price
    ? ((parseFloat(closeForm.exit_price) - p.entry_price) * p.quantity - (parseFloat(closeForm.commission) || 0))
    : null

  return (
    <Modal title={`${p.ticker} — ${p.account}`} onClose={onClose}>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '12px', borderBottom: '1px solid var(--cy-border)' }}>
        {['edit','close'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 16px',
            background: 'none', border: 'none',
            borderBottom: `2px solid ${tab === t ? 'var(--cy-accent)' : 'transparent'}`,
            color: tab === t ? 'var(--cy-accent)' : 'var(--cy-muted)',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '9px', fontWeight: 700,
            letterSpacing: '1.5px', textTransform: 'uppercase',
            cursor: 'pointer',
          }}>
            {t === 'edit' ? 'Update Position' : 'Close Position'}
          </button>
        ))}
      </div>

      {tab === 'edit' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
            <div><div style={labelStyle}>Current Price</div>
              <input style={inputStyle} type="number" value={form.current_price} onChange={e => set('current_price', e.target.value)} /></div>
            <div><div style={labelStyle}>Commission (Total)</div>
              <input style={inputStyle} type="number" value={form.commission} onChange={e => set('commission', e.target.value)} /></div>
            <div><div style={labelStyle}>Stop Loss</div>
              <input style={inputStyle} type="number" value={form.stop_loss} onChange={e => set('stop_loss', e.target.value)} /></div>
            <div><div style={labelStyle}>Target Price</div>
              <input style={inputStyle} type="number" value={form.target_price} onChange={e => set('target_price', e.target.value)} /></div>
          </div>
          {error && <div style={{ color: 'var(--cy-red)', fontSize: '10px', marginTop: '6px' }}>{error}</div>}
          <button onClick={handleUpdate} disabled={loading} style={{ width: '100%', marginTop: '10px', padding: '8px', background: 'rgba(0,212,255,0.08)', border: '1px solid var(--cy-accent)', color: 'var(--cy-accent)', fontFamily: "'Montserrat', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer' }}>
            {loading ? 'Saving...' : 'Update'}
          </button>
        </>
      )}

      {tab === 'close' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
            <div><div style={labelStyle}>Exit Price *</div>
              <input style={inputStyle} type="number" placeholder="0.00" value={closeForm.exit_price} onChange={e => setC('exit_price', e.target.value)} /></div>
            <div><div style={labelStyle}>Commission (Total)</div>
              <input style={inputStyle} type="number" placeholder="0.00" value={closeForm.commission} onChange={e => setC('commission', e.target.value)} /></div>
          </div>
          <div style={{ marginTop: '7px' }}>
            <div style={labelStyle}>Strategy Used</div>
            <input style={inputStyle} placeholder="e.g. E1 Bearish Div" value={closeForm.strategy_used} onChange={e => setC('strategy_used', e.target.value)} />
          </div>
          <div style={{ marginTop: '7px' }}>
            <div style={labelStyle}>Notes</div>
            <input style={inputStyle} placeholder="Exit reason / lessons learned" value={closeForm.notes} onChange={e => setC('notes', e.target.value)} />
          </div>

          {/* PnL Preview */}
          {previewPnL !== null && (
            <div style={{ marginTop: '10px', background: 'var(--cy-grid)', border: `1px solid ${previewPnL >= 0 ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,85,0.2)'}`, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '8px', fontWeight: 700, color: 'var(--cy-muted)', letterSpacing: '1px' }}>
                NET P&L PREVIEW
              </span>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '16px', color: previewPnL >= 0 ? 'var(--cy-green)' : 'var(--cy-red)' }}>
                {previewPnL >= 0 ? '+' : ''}${Math.abs(previewPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}

          {error && <div style={{ color: 'var(--cy-red)', fontSize: '10px', marginTop: '6px' }}>{error}</div>}
          <button onClick={handleClose} disabled={loading} style={{ width: '100%', marginTop: '10px', padding: '8px', background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.4)', color: 'var(--cy-red)', fontFamily: "'Montserrat', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer' }}>
            {loading ? 'Processing...' : 'Confirm Close + Log to Journal'}
          </button>
          <div style={{ marginTop: '6px', fontFamily: "'Montserrat', sans-serif", fontSize: '8px', color: 'var(--cy-muted)', textAlign: 'center' }}>
            Position will be closed · Trade logged to Journal · Proceeds returned to {p.account} capital
          </div>
        </>
      )}
    </Modal>
  )
}
