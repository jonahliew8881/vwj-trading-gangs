import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'

const ACCOUNTS = ['耀才', 'Citi', '富途', 'IBKR']

export default function Journal() {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [stats, setStats] = useState({
    winRate: null, avgRR: null, ev: null, count: 0, mtdPnL: 0
  })

  useEffect(() => { fetchTrades() }, [])

  async function fetchTrades() {
    setLoading(true)
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) {
      setTrades(data)
      calcStats(data)
    }
    setLoading(false)
  }

  function calcStats(data) {
    if (!data.length) return
    const wins = data.filter(t => t.outcome === 'win')
    const winRate = wins.length / data.length
    const validRR = data.filter(t => t.r_multiple !== null)
    const avgRR = validRR.length
      ? validRR.reduce((s, t) => s + parseFloat(t.r_multiple), 0) / validRR.length
      : null
    const avgWinR = wins.length
      ? wins.reduce((s, t) => s + parseFloat(t.r_multiple || 0), 0) / wins.length
      : 0
    const losses = data.filter(t => t.outcome === 'loss')
    const avgLossR = losses.length
      ? Math.abs(losses.reduce((s, t) => s + parseFloat(t.r_multiple || 0), 0) / losses.length)
      : 1
    const ev = winRate * avgWinR - (1 - winRate) * avgLossR
    const now = new Date()
    const mtd = data.filter(t => {
      const d = new Date(t.created_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const mtdPnL = mtd.reduce((s, t) => s + parseFloat(t.pnl), 0)
    setStats({ winRate, avgRR, ev, count: data.length, mtdPnL })
    if (data.length >= 30) {
      supabase.from('settings').upsert([
        { key: 'kelly_win_rate', value: winRate.toFixed(4) },
        { key: 'kelly_auto_updated', value: 'true' },
        { key: 'trade_count', value: String(data.length) },
      ])
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this trade? This cannot be undone.')) return
    await supabase.from('trades').delete().eq('id', id)
    fetchTrades()
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', marginBottom: '10px' }}>
        <StatMini val={stats.winRate !== null ? `${(stats.winRate*100).toFixed(1)}%` : '—'} label="Win Rate" color={stats.winRate >= 0.5 ? 'var(--cy-green)' : 'var(--cy-red)'} sub={`${stats.count} trades`} />
        <StatMini val={stats.avgRR !== null ? `${stats.avgRR.toFixed(1)}x` : '—'} label="Avg R:R" color="var(--cy-accent)" sub="per trade" />
        <StatMini val={stats.ev !== null ? `${stats.ev >= 0 ? '+' : ''}${stats.ev.toFixed(2)}` : '—'} label="EV / Dollar" color={stats.ev >= 0 ? 'var(--cy-green)' : 'var(--cy-red)'} sub="expected value" />
        <StatMini val={stats.mtdPnL !== 0 ? `${stats.mtdPnL >= 0 ? '+' : ''}$${Math.abs(stats.mtdPnL).toLocaleString(undefined,{maximumFractionDigits:0})}` : '$0'} label="Realized MTD" color={stats.mtdPnL >= 0 ? 'var(--cy-green)' : 'var(--cy-red)'} sub="this month" />
      </div>

      <div style={{ background:'var(--cy-grid)', border:'1px solid var(--cy-border)', padding:'7px 10px', marginBottom:'10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'9px', color:'var(--cy-muted)' }}>Kelly Win Rate:</span>
        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'9px', color: stats.count >= 30 ? 'var(--cy-green)' : 'var(--cy-yellow)' }}>
          {stats.count >= 30
            ? `● Auto — ${(stats.winRate*100).toFixed(1)}% (${stats.count} trades)`
            : `● Manual 50% — ${stats.count}/30 trades to auto-update`}
        </span>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
        <SectionTitle>Trade Log</SectionTitle>
        <button onClick={() => setShowAddModal(true)} style={addBtnStyle}>+ Log Trade</button>
      </div>

      {loading ? (
        <EmptyMsg>// Loading trades...</EmptyMsg>
      ) : trades.length === 0 ? (
        <EmptyMsg>// No trades logged yet. Click + Log Trade to start.</EmptyMsg>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
          {trades.map(t => (
            <TradeRow
              key={t.id}
              trade={t}
              onEdit={() => setEditTarget(t)}
              onDelete={() => handleDelete(t.id)}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <TradeModal
          title="Log Closed Trade"
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchTrades() }}
        />
      )}
      {editTarget && (
        <TradeModal
          title={`Edit — ${editTarget.ticker}`}
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => { setEditTarget(null); fetchTrades() }}
        />
      )}
    </div>
  )
}

function TradeRow({ trade: t, onEdit, onDelete }) {
  const isWin = t.outcome === 'win'
  const pnl = parseFloat(t.pnl)
  const rr = t.r_multiple !== null ? parseFloat(t.r_multiple).toFixed(1) : '—'
  const date = new Date(t.created_at).toLocaleDateString('en-GB', { month:'short', day:'numeric' })

  return (
    <div style={{ background:'var(--cy-grid)', borderLeft:`3px solid ${isWin ? 'var(--cy-green)' : 'var(--cy-red)'}`, padding:'7px 9px', display:'grid', gridTemplateColumns:'65px 1fr auto', gap:'7px', alignItems:'center' }}>
      <div>
        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'9px', color:'var(--cy-muted)' }}>{date}</div>
        <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:'8px', fontWeight:700, color: isWin ? 'var(--cy-green)' : 'var(--cy-red)', marginTop:'1px' }}>
          {isWin ? 'WIN' : 'LOSS'}
        </div>
      </div>
      <div>
        <div>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'12px', color:'var(--cy-accent)', fontWeight:600 }}>{t.ticker}</span>
          <span style={{ fontFamily:"'Montserrat',sans-serif", fontSize:'8px', color:'var(--cy-muted)', marginLeft:'6px' }}>
            {t.quantity} · {t.account}
          </span>
        </div>
        <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:'8px', color:'var(--cy-muted)', marginTop:'2px' }}>
          ${t.entry_price} → ${t.exit_price}{t.strategy_used && ` · ${t.strategy_used}`}
        </div>
        {t.notes && <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:'8px', color:'var(--cy-muted)', marginTop:'1px', fontStyle:'italic' }}>{t.notes}</div>}
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'13px', color: pnl >= 0 ? 'var(--cy-green)' : 'var(--cy-red)' }}>
            {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toLocaleString(undefined,{maximumFractionDigits:0})}
          </div>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'11px', color: parseFloat(rr) >= 0 ? 'var(--cy-accent)' : 'var(--cy-red)' }}>
            {rr !== '—' ? `${rr}R` : '—'}
          </div>
        </div>
        <div style={{ display:'flex', gap:'4px' }}>
          <button onClick={onEdit} style={editBtnStyle}>Edit</button>
          <button onClick={onDelete} style={deleteBtnStyle}>Delete</button>
        </div>
      </div>
    </div>
  )
}

function TradeModal({ title, initial, onClose, onSuccess }) {
  const [form, setForm] = useState({
    ticker:        initial?.ticker || '',
    account:       initial?.account || '耀才',
    market:        initial?.market || 'HK',
    entry_price:   initial?.entry_price || '',
    exit_price:    initial?.exit_price || '',
    stop_loss:     initial?.stop_loss || '',
    quantity:      initial?.quantity || '',
    commission:    initial?.commission || '',
    strategy_used: initial?.strategy_used || '',
    notes:         initial?.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    if (!form.ticker || !form.entry_price || !form.exit_price || !form.quantity || !form.stop_loss) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    const payload = {
      ticker:        form.ticker.toUpperCase().trim(),
      account:       form.account,
      market:        form.market,
      entry_price:   parseFloat(form.entry_price),
      exit_price:    parseFloat(form.exit_price),
      stop_loss:     parseFloat(form.stop_loss),
      quantity:      parseInt(form.quantity),
      commission:    parseFloat(form.commission) || 0,
      strategy_used: form.strategy_used,
      notes:         form.notes,
    }
    let err
    if (initial) {
      const res = await supabase.from('trades').update(payload).eq('id', initial.id)
      err = res.error
    } else {
      const res = await supabase.from('trades').insert([payload])
      err = res.error
    }
    setLoading(false)
    if (err) { setError(err.message); return }
    onSuccess()
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
        <Field label="Ticker *"><input style={inputStyle} placeholder="e.g. NVDA" value={form.ticker} onChange={e => set('ticker', e.target.value)} /></Field>
        <Field label="Account"><select style={inputStyle} value={form.account} onChange={e => set('account', e.target.value)}>{ACCOUNTS.map(a => <option key={a}>{a}</option>)}</select></Field>
        <Field label="Entry Price *"><input style={inputStyle} type="number" placeholder="0.00" value={form.entry_price} onChange={e => set('entry_price', e.target.value)} /></Field>
        <Field label="Exit Price *"><input style={inputStyle} type="number" placeholder="0.00" value={form.exit_price} onChange={e => set('exit_price', e.target.value)} /></Field>
        <Field label="Stop Loss *"><input style={inputStyle} type="number" placeholder="0.00" value={form.stop_loss} onChange={e => set('stop_loss', e.target.value)} /></Field>
        <Field label="Quantity *"><input style={inputStyle} type="number" placeholder="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} /></Field>
        <Field label="Commission"><input style={inputStyle} type="number" placeholder="0.00" value={form.commission} onChange={e => set('commission', e.target.value)} /></Field>
        <Field label="Market"><select style={inputStyle} value={form.market} onChange={e => set('market', e.target.value)}><option>HK</option><option>US</option></select></Field>
      </div>
      <div style={{ marginTop:'7px' }}>
        <Field label="Strategy Used"><input style={inputStyle} placeholder="e.g. S3 RSI Div + A1 OBV" value={form.strategy_used} onChange={e => set('strategy_used', e.target.value)} /></Field>
      </div>
      <div style={{ marginTop:'7px' }}>
        <Field label="Notes"><input style={inputStyle} placeholder="What worked / what didn't" value={form.notes} onChange={e => set('notes', e.target.value)} /></Field>
      </div>
      {error && <div style={{ color:'var(--cy-red)', fontSize:'10px', marginTop:'6px', fontFamily:"'Montserrat',sans-serif" }}>{error}</div>}
      <button onClick={handleSubmit} disabled={loading} style={{ width:'100%', marginTop:'10px', padding:'8px', background:'rgba(0,212,255,0.08)', border:'1px solid var(--cy-accent)', color:'var(--cy-accent)', fontFamily:"'Montserrat',sans-serif", fontSize:'10px', fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Saving...' : initial ? 'Update Trade' : 'Save Trade'}
      </button>
    </Modal>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:'7px', fontWeight:700, color:'var(--cy-muted)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'3px' }}>{label}</div>
      {children}
    </div>
  )
}

function StatMini({ val, label, color, sub }) {
  return (
    <div style={{ background:'var(--cy-grid)', border:'1px solid var(--cy-border)', padding:'7px 9px', textAlign:'center' }}>
      <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'18px', color }}>{val}</div>
      <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:'7px', fontWeight:600, color:'var(--cy-muted)', letterSpacing:'1.5px', textTransform:'uppercase', marginTop:'2px' }}>{label}</div>
      <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:'7px', color:'var(--cy-muted)', marginTop:'1px' }}>{sub}</div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:'9px', fontWeight:700, letterSpacing:'3px', color:'var(--cy-muted)', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'6px' }}>
      <span style={{ color:'var(--cy-accent)', fontFamily:"'Share Tech Mono',monospace", fontSize:'10px' }}>//</span>
      {children}
    </div>
  )
}

function EmptyMsg({ children }) {
  return <div style={{ padding:'20px', textAlign:'center', color:'var(--cy-muted)', fontFamily:"'Share Tech Mono',monospace", fontSize:'11px' }}>{children}</div>
}

const inputStyle = { width:'100%', background:'rgba(0,212,255,0.04)', border:'1px solid var(--cy-border)', color:'var(--cy-text)', padding:'6px 7px', fontFamily:"'Share Tech Mono',monospace", fontSize:'11px', outline:'none' }
const addBtnStyle = { padding:'3px 10px', background:'rgba(0,212,255,0.06)', border:'1px solid var(--cy-accent)', color:'var(--cy-accent)', fontFamily:"'Montserrat',sans-serif", fontSize:'8px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', cursor:'pointer' }
const editBtnStyle = { padding:'2px 7px', background:'rgba(0,212,255,0.06)', border:'1px solid var(--cy-border)', color:'var(--cy-muted)', fontFamily:"'Montserrat',sans-serif", fontSize:'7px', fontWeight:700, cursor:'pointer' }
const deleteBtnStyle = { padding:'2px 7px', background:'rgba(255,51,85,0.06)', border:'1px solid rgba(255,51,85,0.3)', color:'var(--cy-red)', fontFamily:"'Montserrat',sans-serif", fontSize:'7px', fontWeight:700, cursor:'pointer' }
