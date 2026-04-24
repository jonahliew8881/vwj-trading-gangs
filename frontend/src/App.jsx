import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import DesktopNav from './components/DesktopNav'
import MobileNav from './components/MobileNav'
import Portfolio from './pages/Portfolio'
import PositionSizing from './pages/PositionSizing'
import Screener from './pages/Screener'
import Journal from './pages/Journal'

export default function App() {
  const [activeTab, setActiveTab] = useState('portfolio')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const renderTab = () => {
    switch (activeTab) {
      case 'portfolio':     return <Portfolio />
      case 'sizing':        return <PositionSizing />
      case 'screener':      return <Screener />
      case 'journal':       return <Journal />
      default:              return <Portfolio />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      {!isMobile && <DesktopNav activeTab={activeTab} setActiveTab={setActiveTab} />}
      <main style={{
        flex: 1,
        padding: '10px',
        overflowY: 'auto',
        paddingBottom: isMobile ? 'calc(56px + 10px)' : '10px'
      }}>
        {renderTab()}
      </main>
      {isMobile && <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  )
}
