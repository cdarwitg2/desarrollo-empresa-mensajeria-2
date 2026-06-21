import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  console.log('🔐 ProtectedRoute - isLoading:', isLoading);
  console.log('🔐 ProtectedRoute - user:', user);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          </div>
          <p className="text-slate-400 mt-4">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🔐 No hay usuario, redirigiendo a /login');
    return <Navigate to="/login" replace />;
  }

  console.log('🔐 Usuario autenticado, mostrando children');
  return <>{children}</>;
};