import React, { useState } from 'react'

type TabType = 'seguimiento' | 'operador' | 'analista'

interface NavbarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'seguimiento', label: 'Seguimiento Público', icon: '📍' },
    { id: 'operador', label: 'Portal Operador', icon: '🚚' },
    { id: 'analista', label: 'Panel de Analista', icon: '📊' },
  ]

  return (
    <>
      {/* Navbar Desktop - Sidebar lateral */}
      <nav className="hidden md:fixed md:left-0 md:top-0 md:h-screen md:w-72 md:z-40 md:block">
        {/* Glassmorphic background */}
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl border-r border-white/10"></div>

        {/* Contenido */}
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-8 border-b border-white/10">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              📦 Track & Trace
            </h2>
            <p className="text-xs text-gray-400 mt-2">Sistema de Mensajería Premium</p>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-500/40 to-cyan-500/40 text-white border border-blue-400/50 shadow-lg shadow-blue-500/20'
                    : 'text-gray-300 hover:bg-white/5 border border-transparent hover:border-white/10'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium text-sm">{item.label}</span>
                {activeTab === item.id && (
                  <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-6 border-t border-white/10">
            <div className="text-xs text-gray-500 space-y-2">
              <p>✨ Prototipo Mínimo Navegable</p>
              <p>v1.0.0</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Navbar Mobile - Top bar */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-40">
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl border-b border-white/10"></div>

        <div className="relative px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            📦 Track & Trace
          </h2>

          {/* Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="px-4 py-4 space-y-2 border-t border-white/10">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 flex items-center gap-3 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-500/40 to-cyan-500/40 text-white border border-blue-400/50'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </nav>
    </>
  )
}

export default Navbar
