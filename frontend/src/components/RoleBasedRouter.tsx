import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Dashboard } from '../Admin/Dashboard';
import { ClientDashboard } from '../Cliente/ClientDashboard';
import { AnalystDashboard } from '../Analista/AnalystDashboard';
import { OperatorDashboard } from '../Operador/OperatorDashboard';
import { DriverDashboard } from '../Mensajero/DriverDashboard';

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

  // Si tiene rol de analista, mostrar AnalystDashboard
  if (user.roles.includes('analista')) {
    return <AnalystDashboard />;
  }

  // Si tiene rol de acopio o operador, mostrar OperatorDashboard
  if (user.roles.includes('acopio') || user.roles.includes('operador')) {
    return <OperatorDashboard />;
  }

  // Si tiene rol de administrador, mostrar Dashboard con tabs
  if (user.roles.includes('administrador')) {
    return <Dashboard />;
  }

  // Fallback
  return <ClientDashboard />;
};
