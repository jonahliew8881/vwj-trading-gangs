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
  const [loading, setLoading] = useState(false)
  const [closing, setClosing] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleUpdate() {
    setLoading(true)
    await supabase.from('positions').update({
      current_price: parseFloat(form.current_price),
      stop_loss:     parseFloat(form.stop_loss),
      target_price:  parseFloat(form.target_price),
      commission:    parseFloat(form.commission) || 0,
    }).eq('id', p.id)
    setLoading(false)
    onSuccess()
  }

  async function handleClose() {
    setClosing(true)
    await supabase.from('positions').update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      current_price: parseFloat(form.current_price),
      commission: parseFloat(form.commission) || 0,
    }).eq('id', p.id)
    setClosing(false)
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

  return (
    <Modal title={`Edit — ${p.ticker}`} onClose={onClose}>
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
      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
        <button onClick={handleUpdate} disabled={loading} style={{
          flex: 1, padding: '8px',
          background: 'rgba(0,212,255,0.08)', border: '1px solid var(--cy-accent)',
          color: 'var(--cy-accent)', fontFamily: "'Montserrat', sans-serif",
          fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
          textTransform: 'uppercase', cursor: 'pointer',
        }}>
          {loading ? 'Saving...' : 'Update'}
        </button>
        <button onClick={handleClose} disabled={closing} style={{
          flex: 1, padding: '8px',
          background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.4)',
          color: 'var(--cy-red)', fontFamily: "'Montserrat', sans-serif",
          fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
          textTransform: 'uppercase', cursor: 'pointer',
        }}>
          {closing ? 'Closing...' : 'Close Position'}
        </button>
      </div>
    </Modal>
  )
}
