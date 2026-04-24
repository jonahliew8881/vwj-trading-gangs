import React, { useState, useEffect } from 'react'

export default function Header() {
  const [time, setTime] = useState('')
  const [hkexOpen, setHkexOpen] = useState(false)
  const [nyseOpen, setNyseOpen] = useState(false)

  useEffect(() => {
    const tick = () => {
      const now = new Date()

      // HKT Clock
      const hkt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }))
      const h = String(hkt.getHours()).padStart(2, '0')
      const m = String(hkt.getMinutes()).padStart(2, '0')
      const s = String(hkt.getSeconds()).padStart(2, '0')
      setTime(`${h}:${m}:${s}`)

      // HKEX: Mon-Fri 09:30-16:00 HKT
      const hkDay = hkt.getDay()
      const hkMins = hkt.getHours() * 60 + hkt.getMinutes()
      setHkexOpen(hkDay >= 1 && hkDay <= 5 && hkMins >= 570 && hkMins < 960)

      // NYSE: Mon-Fri 09:30-16:00 ET
      const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
      const etDay = et.getDay()
      const etMins = et.getHours() * 60 + et.getMinutes()
      setNyseOpen(etDay >= 1 && etDay <= 5 && etMins >= 570 && etMins < 960)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      borderBottom: '1px solid var(--cy-border)',
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* Gradient line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--cy-accent) 30%, var(--cy-accent2) 70%, transparent)',
      }} />

      {/* Logo */}
      <div>
        <div style={{
          fontFamily: "'Josefin Sans', sans-serif",
          fontWeight: 700,
          fontSize: '22px',
          letterSpacing: '6px',
          color: 'var(--cy-accent)',
          lineHeight: 1,
        }}>
          VWJ
          <span style={{
            display: 'block',
            fontWeight: 300,
            fontSize: '10px',
            letterSpacing: '8px',
            color: 'var(--cy-accent2)',
            marginTop: '2px',
          }}>
            TRADING  GANGS
          </span>
        </div>
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '7px',
          fontWeight: 500,
          color: 'var(--cy-muted)',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginTop: '2px',
        }}>
          Market Intelligence Terminal · v1.0.0
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'center',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '11px', color: 'var(--cy-muted)',
        }}>
          <span style={{ color: 'var(--cy-green)' }}>
            <span style={{ animation: 'blink 1.2s infinite', marginRight: '2px' }}>●</span>
            Live
          </span>
          <span>{time}</span>
          <span>HKT</span>
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <MarketBadge label="HKEX" open={hkexOpen} />
          <MarketBadge label="NYSE" open={nyseOpen} />
        </div>
      </div>
    </header>
  )
}

function MarketBadge({ label, open }) {
  return (
    <span style={{
      fontFamily: "'Montserrat', sans-serif",
      fontSize: '7px',
      fontWeight: 700,
      padding: '2px 7px',
      border: `1px solid ${open ? 'rgba(0,255,136,0.3)' : 'rgba(74,106,138,0.3)'}`,
      color: open ? 'var(--cy-green)' : 'var(--cy-muted)',
      background: open ? 'rgba(0,255,136,0.06)' : 'transparent',
      letterSpacing: '1px',
      textTransform: 'uppercase',
    }}>
      {label} {open ? 'Open' : 'Closed'}
    </span>
  )
}
