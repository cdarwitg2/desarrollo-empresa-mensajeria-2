import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, User, LoginResponse } from '../types/index';
import { api } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Buscar en ambos almacenamientos
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        console.log('✅ Sesión restaurada desde almacenamiento:', parsedUser);
      } catch (error) {
        console.error('❌ Error al parsear usuario almacenado:', error);
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (rut: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/login', { rut, password });
      
      console.log('📨 Login response:', response);
      
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

      console.log('👤 UserData a guardar:', userData);

      // Guardar en ambos almacenamientos
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(userData));

      setToken(data.token);
      setUser(userData);
      
      console.log('✅ Login exitoso - Usuario:', userData);
      
      return userData;
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
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
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(userData));

      setToken(data.token);
      setUser(userData);
      
      console.log('✅ Registro exitoso - Usuario:', userData);
    } catch (error) {
      console.error('❌ Error en registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
    console.log('✅ Sesión cerrada');
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