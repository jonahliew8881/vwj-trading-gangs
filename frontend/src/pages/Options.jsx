import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import AddOptionModal from '../components/options/AddOptionModal'
import CloseOptionModal from '../components/options/CloseOptionModal'
import OptionsTable from '../components/options/OptionsTable'

const ACCOUNTS = ['Citi', '耀才', '富途', 'IBKR']

export default function Options() {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [closeTarget, setCloseTarget] = useState(null)
  const [filterAccount, setFilterAccount] = useState('All')
  const [filterStatus, setFilterStatus] = useState('open')
  const [usdRate, setUsdRate] = useState(7.8)

  useEffect(() => {
    fetchOptions()
    fetchUsdRate()
  }, [])

  async function fetchUsdRate() {
    const { data } = await supabase.from('settings').select('value').eq('key', 'usd_hkd_rate').single()
    if (data) setUsdRate(parseFloat(data.value))
  }

  async function fetchOptions() {
    setLoading(true)
    const { data } = await supabase.from('options').select('*').order('created_at', { ascending: false })
    setOptions(data || [])
    setLoading(false)
  }

  const filtered = options.filter(o => {
    const accOk = filterAccount === 'All' || o.account === filterAccount
    const statusOk = o.status === filterStatus
    return accOk && statusOk
  })

  // Summary metrics
  const openOptions = options.filter(o => o.status === 'open')
  const totalPositions = openOptions.length

  // Days to expiry warning
  const expiryWarnings = openOptions.filter(o => {
    const days = Math.ceil((new Date(o.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
    return days <= 7 && days >= 0
  })

  // Total unrealized P&L
  const totalUnrealizedHKD = openOptions.reduce((sum, o) => {
    const size = o.contract_size || 100
    const multiplier = o.direction === 'buy' ? 1 : -1
    const pnl = multiplier * (o.current_premium - o.premium) * o.contracts * size - (o.commission || 0)
    if (o.market === 'HK') return sum + pnl
    return sum + pnl * usdRate
  }, 0)

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0f',
      color: '#e0e0e0',
      fontFamily: "'Montserrat', sans-serif",
      paddingBottom: '80px'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #1a1a2e',
        padding: '20px 24px',
        background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a0f 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontSize: '22px',
              fontWeight: '700',
              letterSpacing: '3px',
              color: '#00ff88',
              margin: 0,
              textTransform: 'uppercase'
            }}>OPTIONS</h1>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#666', letterSpacing: '1px' }}>
              DERIVATIVES TRACKER
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
              color: '#000',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: '700',
              letterSpacing: '2px',
              fontSize: '12px',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            + ADD OPTION
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Expiry Warnings */}
        {expiryWarnings.length > 0 && (
          <div style={{
            background: 'rgba(255, 160, 0, 0.1)',
            border: '1px solid rgba(255, 160, 0, 0.4)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#ffa000', letterSpacing: '1px' }}>
                EXPIRY ALERT — {expiryWarnings.length} POSITION{expiryWarnings.length > 1 ? 'S' : ''} EXPIRING WITHIN 7 DAYS
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                {expiryWarnings.map(o => {
                  const days = Math.ceil((new Date(o.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
                  return `${o.ticker} (${days}d)`
                }).join(' · ')}
              </div>
            </div>
          </div>
        )}

        {/* Metrics Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {[
            { label: 'OPEN POSITIONS', value: totalPositions, color: '#00ff88' },
            {
              label: 'UNREALIZED P&L',
              value: `HK$${totalUnrealizedHKD >= 0 ? '+' : ''}${totalUnrealizedHKD.toFixed(0)}`,
              color: totalUnrealizedHKD >= 0 ? '#00ff88' : '#ff4444'
            },
            { label: 'EXPIRY ALERTS', value: expiryWarnings.length, color: expiryWarnings.length > 0 ? '#ffa000' : '#666' },
          ].map(m => (
            <div key={m.label} style={{
              background: '#0d0d1a',
              border: '1px solid #1a1a2e',
              borderRadius: '8px',
              padding: '16px',
            }}>
              <div style={{ fontSize: '10px', color: '#666', letterSpacing: '2px', marginBottom: '8px' }}>{m.label}</div>
              <div style={{ fontSize: '22px', fontFamily: "'Share Tech Mono', monospace", color: m.color, fontWeight: '700' }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {/* Status filter */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['open', 'closed'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                padding: '6px 14px',
                borderRadius: '4px',
                border: filterStatus === s ? '1px solid #00ff88' : '1px solid #333',
                background: filterStatus === s ? 'rgba(0,255,136,0.1)' : 'transparent',
                color: filterStatus === s ? '#00ff88' : '#666',
                fontSize: '11px',
                fontFamily: "'Josefin Sans', sans-serif",
                letterSpacing: '1px',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}>{s}</button>
            ))}
          </div>
          {/* Account filter */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {['All', ...ACCOUNTS].map(a => (
              <button key={a} onClick={() => setFilterAccount(a)} style={{
                padding: '6px 14px',
                borderRadius: '4px',
                border: filterAccount === a ? '1px solid #00aaff' : '1px solid #333',
                background: filterAccount === a ? 'rgba(0,170,255,0.1)' : 'transparent',
                color: filterAccount === a ? '#00aaff' : '#666',
                fontSize: '11px',
                fontFamily: "'Josefin Sans', sans-serif",
                letterSpacing: '1px',
                cursor: 'pointer',
              }}>{a}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#444', fontFamily: "'Share Tech Mono', monospace" }}>
            LOADING...
          </div>
        ) : (
          <OptionsTable
            options={filtered}
            usdRate={usdRate}
            onClose={setCloseTarget}
            onRefresh={fetchOptions}
          />
        )}
      </div>

      {showAdd && (
        <AddOptionModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); fetchOptions() }}
        />
      )}

      {closeTarget && (
        <CloseOptionModal
          option={closeTarget}
          onClose={() => setCloseTarget(null)}
          onSaved={() => { setCloseTarget(null); fetchOptions() }}
        />
      )}
    </div>
  )
}
