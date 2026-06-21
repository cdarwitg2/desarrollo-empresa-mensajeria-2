import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginCredentials, RegisterCredentials } from './Autenticacion.types';

export const useLogin = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({ rut: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatRUT = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 9) return cleaned.slice(0, 9);
    if (cleaned.length <= 2) return cleaned;
    
    const verifier = cleaned.slice(-1);
    const numbers = cleaned.slice(0, -1);
    let formatted = '';
    
    for (let i = numbers.length - 1, j = 0; i >= 0; i--, j++) {
      if (j > 0 && j % 3 === 0) formatted = '.' + formatted;
      formatted = numbers[i] + formatted;
    }
    
    return `${formatted}-${verifier}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'rut') {
      const cleaned = value.replace(/[^\dKk]/g, '').toUpperCase();
      let formatted = cleaned;
      if (cleaned.length > 1) {
        const verifier = cleaned.slice(-1);
        const numbers = cleaned.slice(0, -1).replace(/\D/g, '');
        formatted = formatRUT(numbers + verifier);
      }
      setCredentials(prev => ({ ...prev, [name]: formatted }));
    } else {
      setCredentials(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const cleanRut = credentials.rut.replace(/\./g, '');
      
      await login(cleanRut, credentials.password);
      
      console.log('✅ Login exitoso, usuario autenticado');
      
      // Redirigir a la raíz (que redirige a /dashboard)
      window.location.href = '/';
      
    } catch (err: any) {
      console.error('❌ Error en login:', err);
      if (err.status === 401) {
        setError('RUT o contraseña incorrectos');
      } else {
        setError(err.message || 'Error al conectar con el servidor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    const { logout: authLogout } = useAuth();
    authLogout();
    window.location.href = '/login';
  };

  return {
    credentials,
    handleChange,
    handleSubmit,
    error,
    isLoading,
    user
  };
};

export const useRegister = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [credentials, setCredentials] = useState<RegisterCredentials>({ 
    rut: '', 
    nombre: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatRUT = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 9) return cleaned.slice(0, 9);
    if (cleaned.length <= 2) return cleaned;
    
    const verifier = cleaned.slice(-1);
    const numbers = cleaned.slice(0, -1);
    let formatted = '';
    
    for (let i = numbers.length - 1, j = 0; i >= 0; i--, j++) {
      if (j > 0 && j % 3 === 0) formatted = '.' + formatted;
      formatted = numbers[i] + formatted;
    }
    
    return `${formatted}-${verifier}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'rut') {
      const cleaned = value.replace(/[^\dKk]/g, '').toUpperCase();
      let formatted = cleaned;
      if (cleaned.length > 1) {
        const verifier = cleaned.slice(-1);
        const numbers = cleaned.slice(0, -1).replace(/\D/g, '');
        formatted = formatRUT(numbers + verifier);
      }
      setCredentials(prev => ({ ...prev, [name]: formatted }));
    } else {
      setCredentials(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (credentials.password !== credentials.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (credentials.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const cleanRut = credentials.rut.replace(/\./g, '');
      
      await register(cleanRut, credentials.nombre, credentials.password);
      
      console.log('✅ Registro exitoso');
      
      // Redirigir a la raíz (que redirige a /dashboard)
      window.location.href = '/';
      
    } catch (err: any) {
      console.error('❌ Error en registro:', err);
      if (err.status === 409) {
        setError('El RUT ingresado ya se encuentra registrado');
      } else {
        setError(err.message || 'Error al conectar con el servidor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    credentials,
    handleChange,
    handleSubmit,
    error,
    isLoading
  };
};