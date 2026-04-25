import React, { useState, useEffect } from 'react'
import MetricsRow from '../components/portfolio/MetricsRow'
import PositionsTable from '../components/portfolio/PositionsTable'
import PnLChart from '../components/portfolio/PnLChart'
import AddPositionModal from '../components/portfolio/AddPositionModal'
import CapitalPanel from '../components/portfolio/CapitalPanel'
import { supabase } from '../lib/supabase'

export default function Portfolio() {
  const [positions, setPositions] = useState([])
  const [activeAcct, setActiveAcct] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('positions')
  const [usdHkdRate, setUsdHkdRate] = useState(7.8)

  useEffect(() => { fetchPositions() }, [])

  async function fetchPositions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    if (!error) setPositions(data || [])
    setLoading(false)
  }

  const filtered = activeAcct === 'all'
    ? positions
    : positions.filter(p => p.account === activeAcct)

  const totalUnrealized = positions.reduce((sum, p) => {
    const gross = (p.current_price - p.entry_price) * p.quantity
    return sum + gross - (p.commission || 0)
  }, 0)

  const totalValueHKD = positions.reduce((sum, p) => {
    const val = p.current_price * p.quantity
    return sum + (p.market === 'US' ? val * usdHkdRate : val)
  }, 0)

  return (
    <div>
      <MetricsRow
        totalValue={totalValueHKD}
        unrealizedPnL={totalUnrealized}
        currency="HKD"
      />

      {/* Section switcher */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--cy-border)', marginBottom: '10px' }}>
        {[
          { id: 'positions', label: 'Positions' },
          { id: 'capital',   label: 'Capital' },
        ].map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            padding: '7px 16px', background: 'none', border: 'none',
            borderBottom: `2px solid ${activeSection === s.id ? 'var(--cy-accent)' : 'transparent'}`,
            color: activeSection === s.id ? 'var(--cy-accent)' : 'var(--cy-muted)',
            fontFamily: "'Montserrat', sans-serif", fontSize: '10px', fontWeight: 700,
            letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer',
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'positions' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <SectionTitle>Open Positions</SectionTitle>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <AccountTabs activeAcct={activeAcct} setActiveAcct={setActiveAcct} />
              <button onClick={() => setShowModal(true)} style={addBtnStyle}>+ Add</button>
            </div>
          </div>
          <PositionsTable positions={filtered} loading={loading} onRefresh={fetchPositions} />
          <PnLChart />
        </>
      )}

      {activeSection === 'capital' && (
        <CapitalPanel usdHkdRate={usdHkdRate} onRateChange={setUsdHkdRate} />
      )}

      {showModal && (
        <AddPositionModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchPositions() }}
        />
      )}
    </div>
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

function AccountTabs({ activeAcct, setActiveAcct }) {
  const tabs = ['all', 'citi', 'yiu', 'futu', 'ibkr']
  const labels = { all: 'All', citi: 'Citi', yiu: '耀才', futu: '富途', ibkr: 'IBKR' }
  return (
    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
      {tabs.map(t => (
        <button key={t} onClick={() => setActiveAcct(t)} style={{
          padding: '3px 8px',
          border: `1px solid ${activeAcct === t ? 'var(--cy-accent)' : 'var(--cy-border)'}`,
          background: activeAcct === t ? 'var(--cy-accent)' : 'none',
          color: activeAcct === t ? '#000' : 'var(--cy-muted)',
          fontFamily: "'Montserrat', sans-serif", fontSize: '8px', fontWeight: 700,
          letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
        }}>
          {labels[t]}
        </button>
      ))}
    </div>
  )
}

const addBtnStyle = {
  padding: '3px 10px', background: 'rgba(0,212,255,0.06)',
  border: '1px solid var(--cy-accent)', color: 'var(--cy-accent)',
  fontFamily: "'Montserrat', sans-serif", fontSize: '8px', fontWeight: 700,
  letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
}
