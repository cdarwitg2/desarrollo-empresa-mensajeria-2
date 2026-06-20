import React, { useEffect } from 'react';
import { User, Lock, AlertCircle, UserPlus, FileText } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegister } from '../Autenticacion.hooks';

import { useAuth } from '../../context/AuthContext';

import FondoAuth from '../../img/Fondo_auth.png';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { credentials, handleChange, handleSubmit, error, isLoading } = useRegister();
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  return (
    <div className="min-h-screen bg-slate-950 relative flex items-center justify-center p-4 overflow-hidden">
      {/* Imagen de fondo desenfocada y con baja opacidad */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60 blur-[4px] scale-105"
        style={{ backgroundImage: `url(${FondoAuth})` }}
      />
      
      {/* Capa oscura superpuesta para asegurar el contraste */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950/50 via-slate-900/40 to-slate-950/50" />

      {/* Orbes decorativos */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Fast Track</h1>
          <p className="text-slate-400">Crear Nueva Cuenta</p>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="rut" className="block text-sm font-medium text-slate-200 mb-2">
                RUT
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  id="rut"
                  name="rut"
                  type="text"
                  value={credentials.rut}
                  onChange={handleChange}
                  placeholder="12.345.678-9"
                  disabled={isLoading}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-slate-200 mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={credentials.nombre}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  disabled={isLoading}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-200 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={credentials.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Registrarse</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700/50 text-center">
            <p className="text-sm text-slate-300">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
