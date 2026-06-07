import React, { useState } from 'react'
import { LogOut, User, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type TabType = 'seguimiento' | 'operador' | 'analista'

interface NavbarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout, hasRole } = useAuth()

  const navItems: Array<{ id: TabType; label: string; icon: string; role: string }> = [
    { id: 'seguimiento', label: 'Seguimiento Público', icon: '📍', role: 'operador' },
    { id: 'operador', label: 'Portal Operador', icon: '🚚', role: 'operador' },
    { id: 'analista', label: 'Panel de Analista', icon: '📊', role: 'analista' },
  ]

  // Filtrar tabs según roles
  const availableTabs = user && hasRole('administrador')
    ? navItems
    : navItems.filter((item) => user && hasRole(item.role))

  const handleLogout = () => {
    logout()
    setIsMobileMenuOpen(false)
  }

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
            {availableTabs.map((item) => (
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

          {/* Usuario y Logout */}
          <div className="px-6 py-6 border-t border-white/10 space-y-4">
            {user && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm truncate">{user.nombre}</p>
                    <p className="text-gray-400 text-xs truncate">{user.rut}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-3">
                  Roles: <span className="text-blue-400">{user.roles.join(', ')}</span>
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all font-medium text-sm"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
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
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="px-4 py-4 space-y-2 border-t border-white/10 bg-slate-900/90">
            {availableTabs.map((item) => (
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

            {user && (
              <>
                <div className="my-4 px-4 py-3 bg-white/5 border border-white/10 rounded-lg">
                  <p className="text-white font-medium text-sm mb-1">{user.nombre}</p>
                  <p className="text-gray-400 text-xs mb-2">{user.rut}</p>
                  <p className="text-gray-400 text-xs">
                    Roles: <span className="text-blue-400">{user.roles.join(', ')}</span>
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all font-medium text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  )
}

export default Navbar
