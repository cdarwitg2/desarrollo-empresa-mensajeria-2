import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, User, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'responsable' | 'operador' | 'analista'>('responsable');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    {
      id: 'responsable' as const,
      label: 'Responsable',
      icon: Shield,
      requiredRole: 'administrador',
      color: 'from-red-500 to-red-600',
    },
    {
      id: 'operador' as const,
      label: 'Operador',
      icon: User,
      requiredRole: 'operador',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'analista' as const,
      label: 'Analista',
      icon: BarChart3,
      requiredRole: 'analista',
      color: 'from-purple-500 to-purple-600',
    },
  ];

  const canAccessTab = (requiredRole: string): boolean => {
    return user?.roles.includes(requiredRole) || false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h2 className="text-2xl font-bold text-white">Logística</h2>
              <p className="text-sm text-slate-400">Sistema de Trazabilidad</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.nombre}</p>
                <p className="text-xs text-slate-400">{user?.roles.join(', ')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {tabs.map((tab) => {
            const isAccessible = canAccessTab(tab.requiredRole);
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => isAccessible && setActiveTab(tab.id)}
                disabled={!isAccessible}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  isAccessible
                    ? activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                      : 'bg-slate-900/50 border border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-900/70'
                    : 'bg-slate-900/30 border border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Contenido por Tab */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8">
          {activeTab === 'responsable' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Panel del Responsable</h3>
              <p className="text-slate-300">
                Contenido administrativo para supervisores y responsables del sistema.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Métrica 1</p>
                  <p className="text-2xl font-bold text-white mt-2">---</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Métrica 2</p>
                  <p className="text-2xl font-bold text-white mt-2">---</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'operador' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Panel del Operador</h3>
              <p className="text-slate-300">
                Interfaz para operadores encargados de ejecutar tareas logísticas.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Estado</p>
                  <p className="text-2xl font-bold text-blue-400 mt-2">Activo</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Tareas</p>
                  <p className="text-2xl font-bold text-white mt-2">0</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analista' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Panel del Analista</h3>
              <p className="text-slate-300">
                Análisis y reportes de datos logísticos en tiempo real.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Análisis</p>
                  <p className="text-2xl font-bold text-purple-400 mt-2">---</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Reportes</p>
                  <p className="text-2xl font-bold text-white mt-2">---</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
