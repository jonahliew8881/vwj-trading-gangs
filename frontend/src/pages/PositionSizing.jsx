import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ACCOUNTS, ACCOUNT_COLORS } from '../constants/accounts'
import {
  KELLY_INITIAL_WIN_RATE,
  KELLY_HALF_DIVISOR,
} from '../constants/markets'

export default function PositionSizing() {
  const [form, setForm] = useState({
    account: 'IBKR',
    entry: '',
    stop: '',
    target: '',
    commission: '',
  })
  const [winRate, setWinRate] = useState(KELLY_INITIAL_WIN_RATE)
  const [result, setResult] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    fetchWinRate()
  }, [])

  async function fetchWinRate() {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'kelly_win_rate')
      .single()
    if (data) setWinRate(parseFloat(data.value))
  }

  useEffect(() => {
    calc()
  }, [form, winRate])

  function calc() {
    const e = parseFloat(form.entry)
    const s = parseFloat(form.stop)
    const t = parseFloat(form.target)
    const c = parseFloat(form.commission) || 0
    const w = winRate

    if (!e || !s || !t || e <= s || t <= e) {
      setResult(null)
      return
    }

    const acct = ACCOUNTS.find(a => a.label === form.account)
    const cap = acct?.capital || 180000

    const risk   = e - s
    const reward = t - e
    const rr     = reward / risk
    const ev     = w * rr - (1 - w)
    const fk     = Math.max(0, w - (1 - w) / rr)
    const hk     = fk / KELLY_HALF_DIVISOR
    const recCap = cap * hk
    const shares = Math.floor(recCap / e)
    const maxLoss = shares * risk + c
    const netEV  = ev - (c / (shares * e || 1))

    setResult({ rr, ev, fk, hk, recCap, shares, maxLoss, netEV, cap })
  }

  const evColor = result?.ev >= 0 ? 'var(--cy-green)' : 'var(--cy-red)'
  const evPct   = result ? Math.min(100, Math.max(0, (result.ev + 1) * 50)) : 50

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '10px',
        marginBottom: '10px',
      }}>

        {/* Calculator */}
        <div style={panelStyle}>
          <div style={cornerTL} /><div style={cornerBR} />
          <SectionTitle>Position Calculator</SectionTitle>

          <div style={{ marginTop: '10px' }}>
            <KyRow label="Account">
              <select style={inputStyle} value={form.account} onChange={e => set('account', e.target.value)}>
                {ACCOUNTS.map(a => <option key={a.id}>{a.label}</option>)}
              </select>
            </KyRow>
            <KyRow label="Entry Price" unit="$">
              <input style={inputStyle} type="number" placeholder="0.00"
                value={form.entry} onChange={e => set('entry', e.target.value)} />
            </KyRow>
            <KyRow label="Stop Loss" unit="$">
              <input style={inputStyle} type="number" placeholder="0.00"
                value={form.stop} onChange={e => set('stop', e.target.value)} />
            </KyRow>
            <KyRow label="Target" unit="$">
              <input style={inputStyle} type="number" placeholder="0.00"
                value={form.target} onChange={e => set('target', e.target.value)} />
            </KyRow>
            <KyRow label="Commission" unit="$">
              <input style={inputStyle} type="number" placeholder="0.00"
                value={form.commission} onChange={e => set('commission', e.target.value)} />
            </KyRow>
            <KyRow label="Win Rate" unit="%">
              <input style={{ ...inputStyle, color: 'var(--cy-yellow)' }}
                type="number" min="1" max="99" value={Math.round(winRate * 100)}
                onChange={e => setWinRate(parseFloat(e.target.value) / 100)} />
            </KyRow>
          </div>

          {result ? (
            <div style={resultBoxStyle}>
              <ResultRow label="R:R Ratio"         val={`${result.rr.toFixed(2)}x`} />
              <ResultRow label="Expected Value"    val={`${result.ev >= 0 ? '+' : ''}${result.ev.toFixed(2)} per $1`} color={evColor} />
              <ResultRow label="Full Kelly %"      val={`${(result.fk * 100).toFixed(1)}%`} />
              <ResultRow label="Half Kelly (rec.)" val={`${(result.hk * 100).toFixed(1)}%`} highlight />
              <ResultRow label="Rec. Capital"      val={`$${Math.round(result.recCap).toLocaleString()}`} highlight />
              <ResultRow label="Suggested Shares"  val={`${result.shares} shares`} highlight />
              <ResultRow label="Max Loss (1R)"     val={`-$${Math.round(result.maxLoss).toLocaleString()}`} color="var(--cy-red)" />
              <ResultRow label="Net EV (w/ comm.)" val={`${result.netEV >= 0 ? '+' : ''}${result.netEV.toFixed(2)} per $1`} color={result.netEV >= 0 ? 'var(--cy-green)' : 'var(--cy-red)'} />
            </div>
          ) : (
            <div style={{ ...resultBoxStyle, color: 'var(--cy-muted)', fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', textAlign: 'center', padding: '16px' }}>
              // Enter entry, stop & target to calculate
            </div>
          )}

          {result && (
            <div style={{ height: '3px', background: 'var(--cy-border)', marginTop: '8px' }}>
              <div style={{ height: '100%', width: `${evPct}%`, background: evColor, transition: 'width 0.4s' }} />
            </div>
          )}
        </div>

        {/* Allocation panel */}
        <div style={panelStyle}>
          <SectionTitle>Account Allocation</SectionTitle>
          <div style={{ marginTop: '10px' }}>
            {/* Capital bar */}
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '8px', fontWeight: 700, color: 'var(--cy-muted)', letterSpacing: '2px', marginBottom: '6px' }}>
              CAPITAL DEPLOYMENT
            </div>
            <div style={{ display: 'flex', height: '12px', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
              {ACCOUNTS.map(a => {
                const total = ACCOUNTS.reduce((s, x) => s + x.capital, 0)
                const pct = (a.capital / total * 100).toFixed(0)
                return (
                  <div key={a.id} style={{
                    width: `${pct}%`,
                    background: ACCOUNT_COLORS[a.id],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '7px', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: '#000' }}>
                      {a.label} {pct}%
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Account list */}
            {ACCOUNTS.map(a => (
              <div key={a.id} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '5px 0',
                borderBottom: '1px solid rgba(26,42,58,0.4)',
              }}>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace", fontSize: '11px',
                  color: ACCOUNT_COLORS[a.id],
                }}>
                  ● {a.label}
                </span>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: 'var(--cy-text)' }}>
                  ${a.capital.toLocaleString()}
                </span>
              </div>
            ))}

            <div style={{ marginTop: '12px', borderTop: '1px solid var(--cy-border)', paddingTop: '10px' }}>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '9px', fontWeight: 600, color: 'var(--cy-text)', marginBottom: '6px' }}>
                Kelly Win Rate Source
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '9px', color: 'var(--cy-muted)', marginBottom: '3px' }}>
                ● Manual input (initial: 50%)
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '9px', color: 'var(--cy-green)' }}>
                ● Auto-update after 30 trades
              </div>
              <div style={{ marginTop: '8px', fontFamily: "'Montserrat', sans-serif", fontSize: '9px', fontWeight: 600, color: 'var(--cy-text)', marginBottom: '4px' }}>
                Half Kelly Rationale
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '9px', color: 'var(--cy-muted)', lineHeight: 1.6 }}>
                Full Kelly ÷ 2 = same long-term return, half the drawdown
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function KyRow({ label, unit, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
      <div style={{
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '8px', fontWeight: 600,
        color: 'var(--cy-muted)', letterSpacing: '.5px',
        width: '85px', textTransform: 'uppercase', flexShrink: 0,
      }}>
        {label}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
      {unit && <div style={{ fontSize: '10px', color: 'var(--cy-muted)', width: '16px' }}>{unit}</div>}
    </div>
  )
}

function ResultRow({ label, val, highlight, color }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '3px 0', borderBottom: '1px solid rgba(26,42,58,0.4)',
    }}>
      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '8px', fontWeight: 500, color: 'var(--cy-muted)' }}>
        {label}
      </span>
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: highlight ? '13px' : '11px',
        color: color || (highlight ? 'var(--cy-yellow)' : 'var(--cy-accent)'),
      }}>
        {val}
      </span>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: "'Montserrat', sans-serif",
      fontSize: '9px', fontWeight: 700,
      letterSpacing: '3px', color: 'var(--cy-muted)',
      textTransform: 'uppercase',
      display: 'flex', alignItems: 'center', gap: '6px',
    }}>
      <span style={{ color: 'var(--cy-accent)', fontFamily: "'Share Tech Mono', monospace", fontSize: '10px' }}>//</span>
      {children}
    </div>
  )
}

const panelStyle = {
  background: 'var(--cy-panel)',
  border: '1px solid var(--cy-border)',
  padding: '12px',
  position: 'relative',
}

const cornerTL = {
  position: 'absolute', top: -1, left: -1,
  width: 8, height: 8,
  borderTop: '2px solid var(--cy-accent)',
  borderLeft: '2px solid var(--cy-accent)',
}

const cornerBR = {
  position: 'absolute', bottom: -1, right: -1,
  width: 8, height: 8,
  borderBottom: '2px solid var(--cy-accent)',
  borderRight: '2px solid var(--cy-accent)',
}

const inputStyle = {
  width: '100%',
  background: 'rgba(0,212,255,0.04)',
  border: '1px solid var(--cy-border)',
  color: 'var(--cy-text)',
  padding: '5px 7px',
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: '11px', outline: 'none',
}

const resultBoxStyle = {
  background: 'var(--cy-grid)',
  border: '1px solid var(--cy-border)',
  padding: '8px',
  marginTop: '8px',
}
