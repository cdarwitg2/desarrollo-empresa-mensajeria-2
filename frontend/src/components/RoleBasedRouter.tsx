import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { ClientDashboard } from './ClientDashboard';

export const RoleBasedRouter: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          </div>
          <p className="text-slate-400 mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si el usuario solo tiene el rol 'usuario', mostrar ClientDashboard
  if (user.roles.length === 1 && user.roles.includes('usuario')) {
    return <ClientDashboard />;
  }

  // Si tiene otros roles (admin, operador, analista), mostrar Dashboard
  if (
    user.roles.includes('administrador') ||
    user.roles.includes('operador') ||
    user.roles.includes('analista')
  ) {
    return <Dashboard />;
  }

  // Fallback
  return <ClientDashboard />;
};
