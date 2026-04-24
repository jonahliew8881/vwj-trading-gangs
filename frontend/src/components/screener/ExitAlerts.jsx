import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { EXIT_STRATEGIES } from '../../constants/strategies'

const MOCK_ALERTS = [
  {
    ticker: '9988.HK', name: 'Alibaba', account: 'Citi',
    unrealizedPct: -3.9, signal: 'e1', urgency: 'high',
    triggered: 'Apr 24 · 16:00 HKT',
    data: [['Price Apr 18','HK$76.40'],['Price Apr 24','HK$79.30 (新高)','warn'],['RSI Apr 18','62.4'],['RSI Apr 24','58.1 ⚠','warn'],['成交量趨勢','連跌3日','warn'],['止蝕位','HK$78.00']],
    explain: '股價創新高至$79.30，但RSI由62.4跌至58.1，形成背馳。升勢動力衰減，成交量同步萎縮確認訊號。',
    caution: '建議觀察明日K線形態確認，或考慮將止蝕上移至$80保護利潤。',
  },
  {
    ticker: 'NVDA', name: 'Nvidia', account: 'IBKR',
    unrealizedPct: 5.3, signal: 'e2', urgency: 'medium',
    triggered: 'Apr 24 · 16:00 ET',
    data: [['連升日數','6日','warn'],['RSI','76.3 (超買)','warn'],['今日成交量','低於昨日18%','warn'],['距目標位','6.4%','pos']],
    explain: 'NVDA連升6日，RSI超買76.3，成交量萎縮18%。目標位$980仍有6.4%空間但動力衰減。',
    caution: '可繼續持有但收緊止蝕至$895。若明日高開低走，考慮部分獲利。',
  },
]

export default function ExitAlerts() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS)
  const [expanded, setExpanded] = useState(MOCK_ALERTS[0]?.ticker)

  function openTV(ticker) {
    window.open(`https://www.tradingview.com/chart/?symbol=${ticker}`, '_blank')
  }

  if (alerts.length === 0) return (
    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--cy-muted)', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px' }}>
      // No exit alerts for current positions
    </div>
  )

  return (
    <div>
      <div style={{
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '9px', fontWeight: 700,
        letterSpacing: '3px', color: 'var(--cy-muted)',
        textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: '6px',
        marginBottom: '8px',
      }}>
        <span style={{ color: 'var(--cy-accent)', fontFamily: "'Share Tech Mono', monospace", fontSize: '10px' }}>//</span>
        Exit Alerts — Active Positions Only
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {alerts.map(alert => {
          const strategy = EXIT_STRATEGIES.find(s => s.id === alert.signal)
          const isExp = expanded === alert.ticker
          const isHigh = alert.urgency === 'high'

          return (
            <div key={alert.ticker} style={{
              background: 'var(--cy-panel)',
              border: '1px solid var(--cy-border)',
              borderLeft: `3px solid ${isHigh ? 'var(--cy-red)' : 'var(--cy-yellow)'}`,
            }}>
              {/* Main row */}
              <div
                onClick={() => setExpanded(isExp ? null : alert.ticker)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '150px 1fr auto',
                  gap: '8px', padding: '8px 11px',
                  alignItems: 'center', cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '13px', color: isHigh ? 'var(--cy-red)' : 'var(--cy-yellow)', fontWeight: 600 }}>
                    {alert.ticker}
                  </div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '8px', color: 'var(--cy-muted)' }}>
                    {alert.name} · {alert.account}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '8px', fontWeight: 700, color: isHigh ? 'var(--cy-red)' : 'var(--cy-yellow)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    ⚠ {strategy?.name}
                  </div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '8px', color: 'var(--cy-muted)', marginTop: '2px' }}>
                    {alert.triggered}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <span style={{
                    padding: '2px 7px',
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '7px', fontWeight: 700,
                    letterSpacing: '1px', border: '1px solid',
                    textTransform: 'uppercase',
                    background: isHigh ? 'rgba(255,51,85,0.1)' : 'rgba(255,215,0,0.08)',
                    color: isHigh ? 'var(--cy-red)' : 'var(--cy-yellow)',
                    borderColor: isHigh ? 'rgba(255,51,85,0.3)' : 'rgba(255,215,0,0.25)',
                  }}>
                    {isHigh ? 'High Priority' : 'Monitor'}
                  </span>
                  <span style={{
                    fontFamily: "'Share Tech Mono', monospace", fontSize: '10px',
                    color: alert.unrealizedPct >= 0 ? 'var(--cy-green)' : 'var(--cy-red)',
                  }}>
                    {alert.unrealizedPct >= 0 ? '+' : ''}{alert.unrealizedPct}%
                  </span>
                </div>
              </div>

              {/* Detail */}
              {isExp && (
                <div style={{ borderTop: '1px solid var(--cy-border)', padding: '10px 11px' }}>
                  <div style={{
                    borderLeft: `2px solid ${isHigh ? 'var(--cy-red)' : 'var(--cy-yellow)'}`,
                    padding: '9px 11px',
                    background: 'var(--cy-grid)',
                    marginBottom: '8px',
                  }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', flexWrap: 'wrap', gap: '4px',
                      marginBottom: '6px',
                    }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '10px', fontWeight: 700, color: isHigh ? 'var(--cy-red)' : 'var(--cy-yellow)' }}>
                        {strategy?.code} — {strategy?.name}
                      </span>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '8px', color: 'var(--cy-muted)' }}>
                        {alert.triggered}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', marginBottom: '7px' }}>
                      {alert.data.map(([k, v, c], i) => (
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
                    <div style={{ fontSize: '10px', lineHeight: 1.6, padding: '5px 7px', background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.07)', marginBottom: '5px' }}>
                      {alert.explain}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--cy-yellow)', padding: '4px 7px', background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.1)' }}>
                      ⚠ {alert.caution}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openTV(alert.ticker)} style={{
                      padding: '4px 10px',
                      background: 'rgba(0,212,255,0.08)',
                      border: '1px solid var(--cy-accent)',
                      color: 'var(--cy-accent)',
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: '8px', fontWeight: 700,
                      letterSpacing: '0.5px', cursor: 'pointer',
                    }}>
                      Open TradingView →
                    </button>
                    <button style={{
                      padding: '4px 10px',
                      background: 'rgba(255,51,85,0.08)',
                      border: '1px solid rgba(255,51,85,0.3)',
                      color: 'var(--cy-red)',
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: '8px', fontWeight: 700,
                      cursor: 'pointer',
                    }}>
                      Mark Reviewed
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
