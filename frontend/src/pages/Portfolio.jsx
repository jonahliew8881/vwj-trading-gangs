import React, { useState, useEffect, useCallback } from 'react'
import MetricsRow from '../components/portfolio/MetricsRow'
import PositionsTable from '../components/portfolio/PositionsTable'
import PnLChart from '../components/portfolio/PnLChart'
import AddPositionModal from '../components/portfolio/AddPositionModal'
import CapitalPanel from '../components/portfolio/CapitalPanel'
import OptionsPanel from '../components/portfolio/OptionsPanel'
import { supabase } from '../lib/supabase'
import { fetchPrices } from '../lib/priceService'

export default function Portfolio() {
  const [positions, setPositions] = useState([])
  const [activeAcct, setActiveAcct] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('positions')
  const [usdHkdRate, setUsdHkdRate] = useState(7.8)
  const [priceRefreshing, setPriceRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

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

  // Refresh live prices from FMP, update Supabase current_price
  const refreshPrices = useCallback(async () => {
    if (positions.length === 0) return
    setPriceRefreshing(true)
    try {
      const priceMap = await fetchPrices(
        positions.map(p => ({ ticker: p.ticker, market: p.market }))
      )
      if (Object.keys(priceMap).length === 0) return

      // Batch update Supabase
      const updates = positions
        .filter(p => priceMap[p.ticker])
        .map(p => supabase
          .from('positions')
          .update({ current_price: priceMap[p.ticker].price })
          .eq('id', p.id)
        )
      await Promise.all(updates)

      // Update local state instantly (no need to refetch)
      setPositions(prev => prev.map(p =>
        priceMap[p.ticker]
          ? { ...p, current_price: priceMap[p.ticker].price }
          : p
      ))
      setLastUpdated(new Date())
    } catch (err) {
      console.error('[Portfolio] refreshPrices error:', err)
    }
    setPriceRefreshing(false)
  }, [positions])

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

              {/* Refresh Price Button */}
              <button
                onClick={refreshPrices}
                disabled={priceRefreshing}
                style={{
                  padding: '3px 10px',
                  background: priceRefreshing ? 'rgba(0,212,255,0.02)' : 'rgba(0,212,255,0.06)',
                  border: '1px solid var(--cy-accent)',
                  color: priceRefreshing ? 'var(--cy-muted)' : 'var(--cy-accent)',
                  fontFamily: "'Montserrat', sans-serif", fontSize: '8px', fontWeight: 700,
                  letterSpacing: '1px', textTransform: 'uppercase', cursor: priceRefreshing ? 'not-allowed' : 'pointer',
                }}
              >
                {priceRefreshing ? '...' : '↻ Price'}
              </button>

              <button onClick={() => setShowModal(true)} style={addBtnStyle}>+ Add</button>
            </div>
          </div>

          {/* Last updated timestamp */}
          {lastUpdated && (
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '9px', color: 'var(--cy-muted)', marginBottom: '6px' }}>
              PRICES UPDATED {lastUpdated.toLocaleTimeString('en-HK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}

          <PositionsTable positions={filtered} loading={loading} onRefresh={fetchPositions} />
          <PnLChart />
        </>
      )}

      {activeSection === 'capital' && (
        <CapitalPanel usdHkdRate={usdHkdRate} onRateChange={setUsdHkdRate} />
      )}

       {activeSection === 'positions' && (
        <OptionsPanel usdRate={usdHkdRate} />
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
