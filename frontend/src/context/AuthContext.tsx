import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, User, LoginResponse } from '../types/index';
import { api } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
  }, []);

  const login = async (rut: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/login', { rut, password });
      
      const data = response as LoginResponse;

      const userData: User = {
        rut: data.rut,
        nombre: data.nombre,
        nombre_completo: data.nombre,
        rol: data.roles?.[0] || null,
        roles: data.roles || [],
        activo: true,
        ultima_conexion: new Date().toISOString(),
      };

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(data.token);
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (rut: string, nombre: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/register', { rut, nombre, password });
      
      const data = response as LoginResponse;

      const userData: User = {
        rut: data.rut,
        nombre: data.nombre,
        nombre_completo: data.nombre,
        rol: data.roles?.[0] || null,
        roles: data.roles || [],
        activo: true,
        ultima_conexion: new Date().toISOString(),
      };

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(data.token);
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
