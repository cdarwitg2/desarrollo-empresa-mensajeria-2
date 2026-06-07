import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { ClientDashboard } from './ClientDashboard';
import { WarehouseDashboard } from './WarehouseDashboard';
import { DriverDashboard } from './DriverDashboard';

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

  // Si tiene rol de mensajero, mostrar DriverDashboard
  if (user.roles.includes('mensajero')) {
    return <DriverDashboard />;
  }

  // Si tiene rol de acopio o analista, mostrar WarehouseDashboard
  if (user.roles.includes('acopio') || user.roles.includes('analista') || user.roles.includes('operador')) {
    return <WarehouseDashboard />;
  }

  // Si tiene rol de administrador, mostrar Dashboard con tabs
  if (user.roles.includes('administrador')) {
    return <Dashboard />;
  }

  // Fallback
  return <ClientDashboard />;
};
