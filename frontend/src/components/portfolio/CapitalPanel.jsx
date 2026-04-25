import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Modal from '../ui/Modal'

const ACCOUNT_COLORS = {
  Citi:  '#ffd700',
  '耀才': '#ff6b35',
  '富途': '#a855f7',
  IBKR:  '#00d4ff',
}

const CURRENCY = {
  Citi:  'HKD',
  '耀才': 'HKD',
  '富途': 'HKD',
  IBKR:  'USD',
}

export default function CapitalPanel({ usdHkdRate, onRateChange }) {
  const [capitals, setCapitals]         = useState([])
  const [transactions, setTransactions] = useState([])
  const [showModal, setShowModal]       = useState(false)
  const [showReset, setShowReset]       = useState(false)
  const [editTxn, setEditTxn]           = useState(null)
  const [loading, setLoading]           = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: caps }, { data: txns }] = await Promise.all([
      supabase.from('capital').select('*').order('account'),
      supabase.from('capital_transactions').select('*').order('created_at', { ascending: false }).limit(30),
    ])
    if (caps) setCapitals(caps)
    if (txns) setTransactions(txns)
    setLoading(false)
  }

  async function handleDeleteTxn(txn) {
    if (!window.confirm(`Delete this ${txn.type} transaction? Capital balance will be reversed.`)) return
    const { data: capData } = await supabase
      .from('capital').select('current').eq('account', txn.account).single()
    if (capData) {
      const reversed = parseFloat(capData.current) - parseFloat(txn.amount)
      await supabase.from('capital').update({ current: reversed }).eq('account', txn.account)
    }
    await supabase.from('capital_transactions').delete().eq('id', txn.id)
    fetchData()
  }

  async function handleResetAll() {
    // Clear all tables
    await Promise.all([
      supabase.from('positions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('trades').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('capital_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ])
    // Reset capital to zero
    await supabase.from('capital').update({ current: 0, initial: 0 }).neq('account', '')
    // Reset Kelly
    await supabase.from('settings').upsert([
      { key: 'kelly_win_rate', value: '0.50' },
      { key: 'kelly_auto_updated', value: 'false' },
      { key: 'trade_count', value: '0' },
    ])
    setShowReset(false)
    fetchData()
  }

  const totalHKD = capitals.reduce((sum, c) => {
    const amt = parseFloat(c.current) || 0
    return sum + (c.currency === 'USD' ? amt * usdHkdRate : amt)
  }, 0)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <SectionTitle>Capital Management</SectionTitle>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setShowModal(true)} style={addBtnStyle}>+ Deposit / Withdraw</button>
          <button onClick={() => setShowReset(true)} style={resetBtnStyle}>Reset All</button>
        </div>
      </div>

      {/* USD/HKD Rate */}
      <div style={{ background: 'var(--cy-grid)', border: '1px solid var(--cy-border)', padding: '7px 10px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '8px', fontWeight: 700, color: 'var(--cy-muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          USD / HKD Rate
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input type="number" value={usdHkdRate} onChange={e => onRateChange(parseFloat(e.target.value) || 7.8)}
            style={{ width: '70px', background: 'rgba(0,212,255,0.04)', border: '1px solid var(--cy-border)', color: 'var(--cy-accent)', padding: '3px 6px', fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', outline: 'none', textAlign: 'right' }} />
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: 'var(--cy-muted)' }}>HKD</span>
        </div>
      </div>

      {/* Total */}
      <div style={{ background: 'var(--cy-panel)', border: '1px solid var(--cy-border)', borderLeft: '3px solid var(--cy-green)', padding: '10px 12px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '7px', fontWeight: 700, color: 'var(--cy-muted)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3px' }}>
            Total Available Cash (HKD)
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '22px', color: 'var(--cy-green)' }}>
            HK${totalHKD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '9px', color: 'var(--cy-muted)', textAlign: 'right' }}>
          Uninvested cash<br />IBKR @ {usdHkdRate} HKD
        </div>
      </div>

      {/* Account cards */}
      {loading ? (
        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--cy-muted)', fontFamily: "'Share Tech Mono', monospace", fontSize: '10px' }}>// Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '6px', marginBottom: '10px' }}>
          {capitals.map(c => <AccountCard key={c.account} capital={c} usdHkdRate={usdHkdRate} />)}
        </div>
      )}

      {/* Transactions */}
      {transactions.length > 0 && (
        <>
          <SectionTitle>Transaction History</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
            {transactions.map(t => (
              <TxnRow key={t.id} txn={t} onEdit={() => setEditTxn(t)} onDelete={() => handleDeleteTxn(t)} />
            ))}
          </div>
        </>
      )}

      {/* Reset confirmation modal */}
      {showReset && (
        <Modal title="⚠ Reset All Data" onClose={() => setShowReset(false)}>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '11px', color: 'var(--cy-text)', lineHeight: 1.6, marginBottom: '12px' }}>
            This will permanently delete:
          </div>
          <div style={{ background: 'var(--cy-grid)', border: '1px solid rgba(255,51,85,0.2)', padding: '10px 12px', marginBottom: '12px' }}>
            {['All open positions', 'All closed trades & journal entries', 'All capital transactions', 'All account balances → reset to $0', 'Kelly win rate → reset to 50%'].map(item => (
              <div key={item} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: 'var(--cy-red)', marginBottom: '4px' }}>
                ✕ {item}
              </div>
            ))}
          </div>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '10px', color: 'var(--cy-yellow)', marginBottom: '12px' }}>
            ⚠ This action cannot be undone.
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setShowReset(false)} style={{ flex: 1, padding: '8px', background: 'none', border: '1px solid var(--cy-border)', color: 'var(--cy-muted)', fontFamily: "'Montserrat', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleResetAll} style={{ flex: 1, padding: '8px', background: 'rgba(255,51,85,0.1)', border: '1px solid rgba(255,51,85,0.4)', color: 'var(--cy-red)', fontFamily: "'Montserrat', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer' }}>
              Confirm Reset
            </button>
          </div>
        </Modal>
      )}

      {showModal && (
        <DepositWithdrawModal capitals={capitals} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchData() }} />
      )}
      {editTxn && (
        <EditTxnModal txn={editTxn} capitals={capitals} onClose={() => setEditTxn(null)} onSuccess={() => { setEditTxn(null); fetchData() }} />
      )}
    </div>
  )
}

function AccountCard({ capital: c, usdHkdRate }) {
  const color   = ACCOUNT_COLORS[c.account] || 'var(--cy-accent)'
  const symbol  = c.currency === 'USD' ? '$' : 'HK$'
  const current = parseFloat(c.current) || 0
  const initial = parseFloat(c.initial) || 0
  const pnl     = current - initial
  const pnlPct  = initial > 0 ? ((pnl / initial) * 100).toFixed(1) : null
  return (
    <div style={{ background: 'var(--cy-panel)', border: '1px solid var(--cy-border)', borderLeft: `3px solid ${color}`, padding: '9px 11px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '9px', fontWeight: 700, color, letterSpacing: '1px' }}>{c.account}</span>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '8px', color: 'var(--cy-muted)' }}>{c.currency}</span>
      </div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '16px', color: 'var(--cy-text)' }}>
        {symbol}{current.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '7px', color: 'var(--cy-muted)' }}>
          Initial: {symbol}{initial.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
        {pnlPct !== null && (
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '9px', color: pnl >= 0 ? 'var(--cy-green)' : 'var(--cy-red)' }}>
            {pnl >= 0 ? '+' : ''}{pnlPct}%
          </span>
        )}
      </div>
    </div>
  )
}

function TxnRow({ txn: t, onEdit, onDelete }) {
  const isPos     = parseFloat(t.amount) >= 0
  const typeLabel = { deposit: 'Deposit', withdrawal: 'Withdrawal', trade_pnl: 'Trade P&L' }
  const typeColor = { deposit: 'var(--cy-green)', withdrawal: 'var(--cy-red)', trade_pnl: isPos ? 'var(--cy-green)' : 'var(--cy-red)' }
  const date      = new Date(t.created_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
  const isTrade   = t.type === 'trade_pnl'

  return (
    <div style={{ background: 'var(--cy-grid)', padding: '5px 8px', display: 'grid', gridTemplateColumns: '50px 70px 1fr auto auto', gap: '6px', alignItems: 'center', borderLeft: `2px solid ${typeColor[t.type]}` }}>
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '9px', color: 'var(--cy-muted)' }}>{date}</span>
      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '8px', fontWeight: 700, color: typeColor[t.type], letterSpacing: '0.5px' }}>{typeLabel[t.type]}</span>
      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '8px', color: 'var(--cy-muted)' }}>{t.account}{t.note ? ` · ${t.note}` : ''}</span>
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: typeColor[t.type] }}>
        {isPos ? '+' : ''}${Math.abs(parseFloat(t.amount)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </span>
      <div style={{ display: 'flex', gap: '3px' }}>
        {!isTrade && <button onClick={onEdit} style={editBtnStyle}>Edit</button>}
        <button onClick={onDelete} style={deleteBtnStyle}>Del</button>
      </div>
    </div>
  )
}

function EditTxnModal({ txn, capitals, onClose, onSuccess }) {
  const [form, setForm] = useState({ account: txn.account, type: txn.type, amount: Math.abs(parseFloat(txn.amount)), note: txn.note || '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    setLoading(true)
    const oldAmount = parseFloat(txn.amount)
    const newAmount = form.type === 'deposit' ? parseFloat(form.amount) : -parseFloat(form.amount)
    const diff = newAmount - oldAmount
    const { data: capData } = await supabase.from('capital').select('current').eq('account', form.account).single()
    if (capData) await supabase.from('capital').update({ current: parseFloat(capData.current) + diff }).eq('account', form.account)
    await supabase.from('capital_transactions').update({ account: form.account, type: form.type, amount: newAmount, note: form.note }).eq('id', txn.id)
    setLoading(false)
    onSuccess()
  }

  const inputStyle = { width: '100%', background: 'rgba(0,212,255,0.04)', border: '1px solid var(--cy-border)', color: 'var(--cy-text)', padding: '6px 7px', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', outline: 'none' }
  const labelStyle = { fontFamily: "'Montserrat', sans-serif", fontSize: '7px', fontWeight: 700, color: 'var(--cy-muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '3px' }

  return (
    <Modal title="Edit Transaction" onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
        <div><div style={labelStyle}>Account</div><select style={inputStyle} value={form.account} onChange={e => set('account', e.target.value)}>{capitals.map(c => <option key={c.account}>{c.account}</option>)}</select></div>
        <div><div style={labelStyle}>Type</div><select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}><option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option></select></div>
      </div>
      <div style={{ marginTop: '7px' }}><div style={labelStyle}>Amount ({CURRENCY[form.account]})</div><input style={inputStyle} type="number" value={form.amount} onChange={e => set('amount', e.target.value)} /></div>
      <div style={{ marginTop: '7px' }}><div style={labelStyle}>Note</div><input style={inputStyle} value={form.note} onChange={e => set('note', e.target.value)} /></div>
      <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', marginTop: '10px', padding: '8px', background: 'rgba(0,212,255,0.08)', border: '1px solid var(--cy-accent)', color: 'var(--cy-accent)', fontFamily: "'Montserrat', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer' }}>
        {loading ? 'Saving...' : 'Update Transaction'}
      </button>
    </Modal>
  )
}

function DepositWithdrawModal({ capitals, onClose, onSuccess }) {
  const [form, setForm] = useState({ account: capitals[0]?.account || 'Citi', type: 'deposit', amount: '', note: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Please enter a valid amount.'); return }
    setLoading(true)
    const amount = parseFloat(form.amount)
    const delta  = form.type === 'deposit' ? amount : -amount
    const cap    = capitals.find(c => c.account === form.account)
    if (!cap) { setError('Account not found.'); setLoading(false); return }
    const isFirstDeposit = parseFloat(cap.initial) === 0 && form.type === 'deposit'
    await supabase.from('capital').update({ current: parseFloat(cap.current) + delta, initial: isFirstDeposit ? amount : parseFloat(cap.initial) }).eq('account', form.account)
    await supabase.from('capital_transactions').insert([{ account: form.account, type: form.type, amount: delta, note: form.note }])
    setLoading(false)
    onSuccess()
  }

  const inputStyle = { width: '100%', background: 'rgba(0,212,255,0.04)', border: '1px solid var(--cy-border)', color: 'var(--cy-text)', padding: '6px 7px', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', outline: 'none' }
  const labelStyle = { fontFamily: "'Montserrat', sans-serif", fontSize: '7px', fontWeight: 700, color: 'var(--cy-muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '3px' }

  return (
    <Modal title="Deposit / Withdraw" onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
        <div><div style={labelStyle}>Account</div><select style={inputStyle} value={form.account} onChange={e => set('account', e.target.value)}>{capitals.map(c => <option key={c.account}>{c.account}</option>)}</select></div>
        <div><div style={labelStyle}>Type</div><select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}><option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option></select></div>
      </div>
      <div style={{ marginTop: '7px' }}><div style={labelStyle}>Amount ({CURRENCY[form.account]})</div><input style={inputStyle} type="number" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} /></div>
      <div style={{ marginTop: '7px' }}><div style={labelStyle}>Note (optional)</div><input style={inputStyle} placeholder="e.g. Monthly top-up" value={form.note} onChange={e => set('note', e.target.value)} /></div>
      {error && <div style={{ color: 'var(--cy-red)', fontSize: '10px', marginTop: '6px', fontFamily: "'Montserrat', sans-serif" }}>{error}</div>}
      <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', marginTop: '10px', padding: '8px', background: form.type === 'deposit' ? 'rgba(0,255,136,0.08)' : 'rgba(255,51,85,0.08)', border: `1px solid ${form.type === 'deposit' ? 'rgba(0,255,136,0.4)' : 'rgba(255,51,85,0.4)'}`, color: form.type === 'deposit' ? 'var(--cy-green)' : 'var(--cy-red)', fontFamily: "'Montserrat', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Processing...' : form.type === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
      </button>
    </Modal>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '3px', color: 'var(--cy-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: 'var(--cy-accent)', fontFamily: "'Share Tech Mono', monospace", fontSize: '10px' }}>//</span>
      {children}
    </div>
  )
}

const addBtnStyle    = { padding: '3px 10px', background: 'rgba(0,212,255,0.06)', border: '1px solid var(--cy-accent)', color: 'var(--cy-accent)', fontFamily: "'Montserrat', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }
const resetBtnStyle  = { padding: '3px 10px', background: 'rgba(255,51,85,0.06)', border: '1px solid rgba(255,51,85,0.3)', color: 'var(--cy-red)', fontFamily: "'Montserrat', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }
const editBtnStyle   = { padding: '2px 6px', background: 'rgba(0,212,255,0.06)', border: '1px solid var(--cy-border)', color: 'var(--cy-muted)', fontFamily: "'Montserrat', sans-serif", fontSize: '7px', fontWeight: 700, cursor: 'pointer' }
const deleteBtnStyle = { padding: '2px 6px', background: 'rgba(255,51,85,0.06)', border: '1px solid rgba(255,51,85,0.3)', color: 'var(--cy-red)', fontFamily: "'Montserrat', sans-serif", fontSize: '7px', fontWeight: 700, cursor: 'pointer' }
