import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, Package, TabType, DeleteConfirmState } from './Admin.types';

export const useAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchPackages();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await api.get('/api/admin/users');
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await api.get('/api/admin/packages');
      setPackages(data.packages || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar paquetes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;
    try {
      setIsLoading(true);
      await api.delete(`/api/admin/users/${deleteConfirm.id}`);
      await fetchUsers();
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePackage = async () => {
    if (!deleteConfirm) return;
    try {
      setIsLoading(true);
      await api.delete(`/api/admin/packages/${deleteConfirm.id}`);
      await fetchPackages();
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar paquete');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const formatRut = (rut: string): string => {
    const clean = rut.replace(/[^0-9kK]/g, '');
    const number = clean.slice(0, -1);
    const dv = clean.slice(-1);
    const limitedNumber = number.slice(0, 8);
    
    let formatted = '';
    let temp = limitedNumber;
    while (temp.length > 3) {
      formatted = '.' + temp.slice(-3) + formatted;
      temp = temp.slice(0, -3);
    }
    formatted = temp + formatted;
    
    return dv ? formatted + '-' + dv : formatted;
  };

  return {
    activeTab,
    setActiveTab,
    users,
    packages,
    isLoading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    showModal,
    setShowModal,
    editingUser,
    deleteConfirm,
    setDeleteConfirm,
    fetchUsers,
    fetchPackages,
    handleDeleteUser,
    handleDeletePackage,
    openCreateModal,
    openEditModal,
    formatRut
  };
};

export const useUserModal = (editingUser: User | null, onSuccess: () => void, onClose: () => void) => {
  const [formData, setFormData] = useState({
    rut: '',
    nombre_completo: '',
    password: '',
    rol: 'CLIENTE'
  });
  const [error, setError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const formatRut = (rut: string): string => {
    const clean = rut.replace(/[^0-9kK]/g, '');
    const number = clean.slice(0, -1);
    const dv = clean.slice(-1);
    const limitedNumber = number.slice(0, 8);
    
    let formatted = '';
    let temp = limitedNumber;
    while (temp.length > 3) {
      formatted = '.' + temp.slice(-3) + formatted;
      temp = temp.slice(0, -3);
    }
    formatted = temp + formatted;
    
    return dv ? formatted + '-' + dv : formatted;
  };

  useEffect(() => {
    if (editingUser) {
      setFormData({
        rut: formatRut(editingUser.rut),
        nombre_completo: editingUser.nombre_completo,
        password: '',
        rol: editingUser.rol || 'CLIENTE'
      });
    } else {
      resetForm();
    }
  }, [editingUser]);

  const cleanRutForBackend = (rut: string): string => rut.replace(/\./g, '');
  
  const isValidRut = (rut: string): boolean => {
    const clean = rut.replace(/\./g, '');
    return /^\d{8}-[0-9kK]$/.test(clean);
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9kK.-]/g, '');
    
    if (value.includes('-')) {
      const [numberPart, dvPart] = value.split('-');
      const cleanNumber = numberPart.replace(/\./g, '').slice(0, 8);
      const cleanDv = dvPart.slice(0, 1);
      
      let formatted = '';
      let temp = cleanNumber;
      while (temp.length > 3) {
        formatted = '.' + temp.slice(-3) + formatted;
        temp = temp.slice(0, -3);
      }
      formatted = temp + formatted;
      
      value = formatted + '-' + cleanDv;
    } else {
      const cleanNumber = value.replace(/\./g, '').slice(0, 8);
      let formatted = '';
      let temp = cleanNumber;
      while (temp.length > 3) {
        formatted = '.' + temp.slice(-3) + formatted;
        temp = temp.slice(0, -3);
      }
      value = temp + formatted;
    }
    
    setFormData({ ...formData, rut: value });
  };

  const resetForm = () => {
    setFormData({
      rut: '',
      nombre_completo: '',
      password: '',
      rol: 'CLIENTE'
    });
    setError('');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidRut(formData.rut)) {
      setError('El RUT debe tener el formato 12.345.678-9 (8 dígitos + guion + DV)');
      return;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setModalLoading(true);
    setError('');

    try {
      await api.post('/api/admin/users', {
        ...formData,
        rut: cleanRutForBackend(formData.rut),
        rol: formData.rol.toUpperCase() // 👈 Enviar en mayúsculas
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidRut(formData.rut)) {
      setError('El RUT debe tener el formato 12.345.678-9 (8 dígitos + guion + DV)');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setModalLoading(true);
    setError('');

    try {
      await api.put(`/api/admin/users/${cleanRutForBackend(formData.rut)}`, {
        ...formData,
        rut: cleanRutForBackend(formData.rut),
        rol: formData.rol.toUpperCase() // 👈 Enviar en mayúsculas
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar usuario');
    } finally {
      setModalLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    error,
    setError,
    modalLoading,
    handleRutChange,
    handleCreateUser,
    handleUpdateUser,
    resetForm
  };
};