import React, { useState } from 'react'
import { ENTRY_STRATEGIES, MAX_SCORE } from '../../constants/strategies'

export default function StockCard({ stock: s }) {
  const [expanded, setExpanded] = useState(false)
  const [activeSignal, setActiveSignal] = useState(s.signals[0])

  const score = s.signals.length
  const pct = Math.round(score / MAX_SCORE * 100)
  const scoreColor = score / MAX_SCORE >= 0.7
    ? 'var(--cy-green)'
    : score / MAX_SCORE >= 0.4
    ? 'var(--cy-yellow)'
    : 'var(--cy-accent)'

  function openTV() {
    window.open(`https://www.tradingview.com/chart/?symbol=${s.ticker}`, '_blank')
  }

  return (
    <div style={{
      background: 'var(--cy-panel)',
      border: `1px solid ${expanded ? 'var(--cy-accent)' : 'var(--cy-border)'}`,
      transition: 'border-color 0.2s',
    }}>
      {/* Main row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'grid',
          gridTemplateColumns: '120px 60px 1fr auto auto',
          gap: '8px',
          padding: '8px 11px',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        {/* Ticker */}
        <div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '13px', color: 'var(--cy-accent)', fontWeight: 600 }}>
            {s.ticker}
          </div>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '8px', color: 'var(--cy-muted)', marginTop: '1px' }}>
            {s.name}
          </div>
        </div>

        {/* Market tag */}
        <div>
          <span style={{
            display: 'inline-block', padding: '1px 5px',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '7px', fontWeight: 700, letterSpacing: '1px',
            background: s.market === 'HK' ? 'rgba(0,212,255,0.1)' : 'rgba(255,107,53,0.1)',
            color: s.market === 'HK' ? 'var(--cy-accent)' : 'var(--cy-accent2)',
            border: `1px solid ${s.market === 'HK' ? 'rgba(0,212,255,0.2)' : 'rgba(255,107,53,0.2)'}`,
          }}>
            {s.market}
          </span>
        </div>

        {/* Signal badges */}
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {s.signals.map(sig => {
            const strategy = ENTRY_STRATEGIES.find(st => st.id === sig)
            return (
              <span key={sig} style={{
                padding: '2px 5px', fontSize: '8px',
                fontFamily: "'Share Tech Mono', monospace",
                border: `1px solid ${strategy?.color}40`,
                background: `${strategy?.color}14`,
                color: strategy?.color,
              }}>
                {strategy?.code}
              </span>
            )
          })}
        </div>

        {/* Price */}
        <div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px' }}>
            {s.market === 'HK' ? 'HK$' : '$'}{s.price.toFixed(2)}
          </div>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace", fontSize: '9px',
            color: s.chg >= 0 ? 'var(--cy-green)' : 'var(--cy-red)',
          }}>
            {s.chg >= 0 ? '+' : ''}{s.chg.toFixed(1)}%
          </div>
        </div>

        {/* Score + buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', minWidth: '80px' }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '16px', fontWeight: 600, color: scoreColor }}>
            {score}<span style={{ fontSize: '10px', color: 'var(--cy-muted)' }}>/{MAX_SCORE}</span>
          </div>
          <div style={{ width: '70px', height: '3px', background: 'var(--cy-border)' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: scoreColor }} />
          </div>
          <div style={{ display: 'flex', gap: '3px' }}>
            <button
              onClick={e => { e.stopPropagation(); openTV() }}
              style={tvBtnStyle}
            >
              TV →
            </button>
            <button
              onClick={e => { e.stopPropagation(); setExpanded(x => !x) }}
              style={notesBtnStyle}
            >
              Notes
            </button>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--cy-border)', padding: '10px 11px' }}>
          {/* Signal tabs */}
          <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {s.signals.map(sig => {
              const strategy = ENTRY_STRATEGIES.find(st => st.id === sig)
              return (
                <button
                  key={sig}
                  onClick={() => setActiveSignal(sig)}
                  style={{
                    padding: '3px 9px',
                    background: activeSignal === sig ? 'rgba(0,212,255,0.08)' : 'none',
                    border: `1px solid ${activeSignal === sig ? 'var(--cy-accent)' : 'var(--cy-border)'}`,
                    color: activeSignal === sig ? 'var(--cy-accent)' : 'var(--cy-muted)',
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '8px', fontWeight: 600,
                    cursor: 'pointer', letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  {strategy?.code}
                </button>
              )
            })}
          </div>

          {/* Annotation */}
          {activeSignal && s.annotations[activeSignal] && (
            <Annotation
              signal={activeSignal}
              anno={s.annotations[activeSignal]}
            />
          )}

          <button onClick={openTV} style={{ ...tvBtnStyle, marginTop: '8px' }}>
            Open TradingView →
          </button>
        </div>
      )}
    </div>
  )
}

function Annotation({ signal, anno }) {
  const strategy = ENTRY_STRATEGIES.find(s => s.id === signal)
  const color = strategy?.color || 'var(--cy-accent)'

  return (
    <div style={{
      borderLeft: `2px solid ${color}`,
      padding: '9px 11px',
      background: 'var(--cy-grid)',
      marginBottom: '6px',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '4px',
        marginBottom: '6px',
      }}>
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '10px', fontWeight: 700, color }}>
          {strategy?.code} — {strategy?.name}
        </span>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '8px', color: 'var(--cy-muted)' }}>
          {anno.time}
        </span>
      </div>

      {/* Data grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', marginBottom: '7px' }}>
        {anno.data.map(([k, v, c], i) => (
          <div key={i} style={{ fontSize: '9px' }}>
            <span style={{ color: 'var(--cy-muted)' }}>{k}: </span>
            <span style={{
              fontFamily: "'Share Tech Mono', monospace",
              color: c === 'pos' ? 'var(--cy-green)' : c === 'warn' ? 'var(--cy-yellow)' : 'var(--cy-text)',
            }}>
              {v}
            </span>
          </div>
        ))}
      </div>

      {/* Explain */}
      <div style={{
        fontSize: '10px', lineHeight: 1.6,
        padding: '5px 7px',
        background: 'rgba(0,212,255,0.03)',
        border: '1px solid rgba(0,212,255,0.07)',
        marginBottom: '5px',
      }}>
        {anno.explain}
      </div>

      {/* Caution */}
      <div style={{
        fontSize: '9px', color: 'var(--cy-yellow)',
        padding: '4px 7px',
        background: 'rgba(255,215,0,0.04)',
        border: '1px solid rgba(255,215,0,0.1)',
      }}>
        ⚠ {anno.caution}
      </div>
    </div>
  )
}

const tvBtnStyle = {
  padding: '3px 8px',
  background: 'rgba(0,212,255,0.08)',
  border: '1px solid var(--cy-accent)',
  color: 'var(--cy-accent)',
  fontFamily: "'Montserrat', sans-serif",
  fontSize: '8px', fontWeight: 700,
  letterSpacing: '0.5px', cursor: 'pointer',
  transition: 'all 0.15s',
}

const notesBtnStyle = {
  padding: '3px 8px',
  background: 'rgba(255,215,0,0.06)',
  border: '1px solid rgba(255,215,0,0.3)',
  color: 'var(--cy-yellow)',
  fontFamily: "'Montserrat', sans-serif",
  fontSize: '8px', fontWeight: 700,
  cursor: 'pointer',
}
