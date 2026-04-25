import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function PnLChart() {
  const [data, setData] = useState([])

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const now   = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data: trades } = await supabase
      .from('trades')
      .select('created_at, pnl')
      .gte('created_at', start)
      .order('created_at', { ascending: true })

    if (!trades || trades.length === 0) { setData([]); return }

    // Cumulative P&L
    let cumulative = 0
    const chartData = trades.map(t => {
      cumulative += parseFloat(t.pnl)
      return {
        date: new Date(t.created_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        pnl:  Math.round(cumulative),
      }
    })
    setData(chartData)
  }

  if (data.length === 0) return (
    <div style={{
      marginTop: '8px', padding: '14px',
      textAlign: 'center',
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: '9px', color: 'var(--cy-muted)',
      border: '1px solid var(--cy-border)',
      background: 'var(--cy-grid)',
    }}>
      // MTD P&L CURVE — No closed trades this month
    </div>
  )

  const isPositive = data[data.length - 1]?.pnl >= 0

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '7px', color: 'var(--cy-muted)', letterSpacing: '2px', marginBottom: '6px' }}>
        // MTD REALIZED P&L CURVE
      </div>
      <ResponsiveContainer width="100%" height={70}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? '#00ff88' : '#ff3355'} stopOpacity={0.15} />
              <stop offset="95%" stopColor={isPositive ? '#00ff88' : '#ff3355'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fill: '#4a6a8a', fontSize: 7, fontFamily: 'Share Tech Mono' }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: '#0d1117', border: '1px solid #1a2a3a', borderRadius: 0 }}
            labelStyle={{ color: '#4a6a8a', fontFamily: 'Montserrat', fontSize: 9 }}
            itemStyle={{ color: isPositive ? '#00ff88' : '#ff3355', fontFamily: 'Share Tech Mono', fontSize: 11 }}
            formatter={v => [`$${v.toLocaleString()}`, 'P&L']}
          />
          <Area
            type="monotone" dataKey="pnl"
            stroke={isPositive ? '#00ff88' : '#ff3355'}
            strokeWidth={1.5}
            fill="url(#pnlGrad)"
            dot={false}
            activeDot={{ r: 3, fill: isPositive ? '#00ff88' : '#ff3355' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
