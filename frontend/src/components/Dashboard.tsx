import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, User, BarChart3, Users, Edit2, X, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminUser {
  rut: string;
  nombre_completo: string;
  roles: string[];
  activo: boolean;
  ultima_conexion: string | null;
}

interface NewUserForm {
  rut: string;
  nombre_completo: string;
  password: string;
  rol: string;
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Restaurar último tab activo desde sessionStorage
  const [activeTab, setActiveTab] = useState<'responsable' | 'operador' | 'analista' | 'cuentas'>(() => {
    const saved = sessionStorage.getItem('dashboardTab');
    return (saved as 'responsable' | 'operador' | 'analista' | 'cuentas') || 'responsable';
  });
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('operador');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para crear usuario
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingUserType, setCreatingUserType] = useState<'cliente' | 'staff'>('staff');
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    rut: '',
    nombre_completo: '',
    password: '',
    rol: 'operador',
  });
  
  // Estados para eliminar usuario
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Guardar el tab activo en sessionStorage cuando cambia
  useEffect(() => {
    sessionStorage.setItem('dashboardTab', activeTab);
  }, [activeTab]);

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
    {
      id: 'cuentas' as const,
      label: 'Gestión de Cuentas',
      icon: Users,
      requiredRole: 'administrador',
      color: 'from-emerald-500 to-emerald-600',
    },
  ];

  const canAccessTab = (requiredRole: string): boolean => {
    return user?.roles.includes(requiredRole) || false;
  };

  // Cargar usuarios cuando se selecciona la pestaña de cuentas
  useEffect(() => {
    if (activeTab === 'cuentas') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      setError('');
      const token = sessionStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(`${apiUrl}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al cargar usuarios');

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleEditClick = (userData: AdminUser) => {
    setEditingUser(userData);
    setSelectedRole(userData.roles[0] || 'operador');
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setSelectedRole('operador');
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;

    try {
      setIsSaving(true);
      const token = sessionStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(`${apiUrl}/api/admin/users/${editingUser.rut}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roles: [selectedRole],
        }),
      });

      if (!response.ok) throw new Error('Error al actualizar usuario');

      const data = await response.json();
      
      // Actualizar la lista local
      setUsers(users.map(u => u.rut === editingUser.rut ? data.user : u));
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUserClick = (type: 'cliente' | 'staff') => {
    setCreatingUserType(type);
    setNewUserForm({
      rut: '',
      nombre_completo: '',
      password: '',
      rol: type === 'cliente' ? 'usuario' : 'operador',
    });
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setNewUserForm({
      rut: '',
      nombre_completo: '',
      password: '',
      rol: 'operador',
    });
  };

  const handleSaveNewUser = async () => {
    if (!newUserForm.rut || !newUserForm.nombre_completo || !newUserForm.password) {
      setError('Todos los campos son requeridos');
      return;
    }

    try {
      setIsSaving(true);
      const token = sessionStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(`${apiUrl}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rut: newUserForm.rut,
          nombre_completo: newUserForm.nombre_completo,
          password: newUserForm.password,
          roles: creatingUserType === 'cliente' ? ['usuario'] : [newUserForm.rol],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear usuario');
      }

      const data = await response.json();
      setUsers([...users, data.user]);
      handleCloseCreateModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setIsDeleting(true);
      const token = sessionStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(`${apiUrl}/api/admin/users/${deletingUser.rut}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al eliminar usuario');

      setUsers(users.filter(u => u.rut !== deletingUser.rut));
      setDeletingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadgeColor = (rol: string): string => {
    switch (rol) {
      case 'usuario':
        return 'text-blue-400 bg-blue-500/10 border border-blue-500/20';
      case 'operador':
        return 'text-purple-400 bg-purple-500/10 border border-purple-500/20';
      case 'analista':
        return 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20';
      case 'administrador':
        return 'text-red-400 bg-red-500/10 border border-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border border-slate-500/20';
    }
  };

  const clientUsers = users.filter(u => u.roles.includes('usuario') && u.roles.length === 1);
  const staffUsers = users.filter(u => !u.roles.includes('usuario') || u.roles.length > 1);

  const formatLastConnection = (timestamp: string | null): string => {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES');
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
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {tabs.map((tab) => {
            const isAccessible = canAccessTab(tab.requiredRole);
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => isAccessible && setActiveTab(tab.id)}
                disabled={!isAccessible}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
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

          {activeTab === 'cuentas' && (
            <div className="space-y-8">
              {error && (
                <div className="backdrop-blur-md bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Sección Clientes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" />
                    Clientes
                  </h3>
                  <button
                    onClick={() => handleCreateUserClick('cliente')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg text-sm font-medium transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Cliente
                  </button>
                </div>
                {isLoadingUsers ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                  </div>
                ) : clientUsers.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p>No hay clientes registrados</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Nombre</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">RUT</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Rol</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Última Conexión</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientUsers.map((userData) => (
                          <tr key={userData.rut} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 text-white">{userData.nombre_completo}</td>
                            <td className="py-3 px-4 text-slate-400 text-sm">{userData.rut}</td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(userData.roles[0])}`}>
                                {userData.roles[0]}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-sm">{formatLastConnection(userData.ultima_conexion)}</td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => setDeletingUser(userData)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sección Personal */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    Personal
                  </h3>
                  <button
                    onClick={() => handleCreateUserClick('staff')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-lg text-sm font-medium transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Personal
                  </button>
                </div>
                {isLoadingUsers ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                  </div>
                ) : staffUsers.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p>No hay personal registrado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Nombre</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">RUT</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Rol</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Última Conexión</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffUsers.map((userData) => (
                          <tr key={userData.rut} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 text-white">{userData.nombre_completo}</td>
                            <td className="py-3 px-4 text-slate-400 text-sm">{userData.rut}</td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                {userData.roles.map((role) => (
                                  <span key={role} className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(role)}`}>
                                    {role}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-sm">{formatLastConnection(userData.ultima_conexion)}</td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditClick(userData)}
                                  disabled={userData.roles.includes('administrador')}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    userData.roles.includes('administrador')
                                      ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed opacity-50'
                                      : 'bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/50 text-blue-400'
                                  }`}
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Editar
                                </button>
                                <button
                                  onClick={() => setDeletingUser(userData)}
                                  disabled={userData.roles.includes('administrador')}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    userData.roles.includes('administrador')
                                      ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed opacity-50'
                                      : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400'
                                  }`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición */}
      {editingUser && !deletingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Editar Rol</h3>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-300 mb-2">Usuario</p>
                <p className="text-white font-medium">{editingUser.nombre_completo}</p>
                <p className="text-slate-400 text-sm">{editingUser.rut}</p>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-3 block">Seleccionar Rol</label>
                {editingUser.roles.includes('administrador') ? (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                    <p className="text-red-400 text-sm">
                      Esta cuenta tiene rol de Administrador. No se puede modificar.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  >
                    <option value="operador">Operador</option>
                    <option value="analista">Analista</option>
                  </select>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-medium transition-colors"
              >
                Cancelar
              </button>
              {!editingUser.roles.includes('administrador') && (
                <button
                  onClick={handleSaveRole}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    'Guardar'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Crear {creatingUserType === 'cliente' ? 'Cliente' : 'Personal'}
              </h3>
              <button
                onClick={handleCloseCreateModal}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">RUT</label>
                <input
                  type="text"
                  placeholder="12345678-9"
                  value={newUserForm.rut}
                  onChange={(e) => setNewUserForm({ ...newUserForm, rut: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Nombre del usuario"
                  value={newUserForm.nombre_completo}
                  onChange={(e) => setNewUserForm({ ...newUserForm, nombre_completo: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">Contraseña</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
              </div>

              {creatingUserType === 'staff' && (
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Rol</label>
                  <select
                    value={newUserForm.rol}
                    onChange={(e) => setNewUserForm({ ...newUserForm, rol: e.target.value })}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  >
                    <option value="operador">Operador</option>
                    <option value="analista">Analista</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={handleCloseCreateModal}
                className="flex-1 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNewUser}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creando...</span>
                  </>
                ) : (
                  'Crear'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmar Eliminación */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-red-400">Confirmar Eliminación</h3>
              <button
                onClick={() => setDeletingUser(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-slate-300">
                ¿Estás seguro de que deseas eliminar a <span className="font-bold text-white">{deletingUser.nombre_completo}</span>?
              </p>
              <p className="text-sm text-slate-400">RUT: {deletingUser.rut}</p>
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mt-4">
                <p className="text-red-400 text-xs">
                  ⚠️ Esta acción no se puede deshacer. El usuario será eliminado permanentemente.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => setDeletingUser(null)}
                className="flex-1 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Eliminando...</span>
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
