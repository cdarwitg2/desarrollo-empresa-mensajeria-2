import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, Package, Users, UserPlus, Edit, Trash2, 
  Search, X, Loader2, UserIcon, Shield, Truck, Briefcase, UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminDashboard } from './Admin.hooks';
import { TabType } from './Admin.types';
import { UserModal } from './Admin.Components/UserModal';
import { ConfirmDeleteModal } from './Admin.Components/ConfirmDeleteModal';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const {
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
  } = useAdminDashboard();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Iconos por rol
  const getRolIcon = (rol: string) => {
    const icons: Record<string, React.ReactNode> = {
      ADMIN: <Shield className="w-4 h-4 text-red-400" />,
      MENSAJERO: <Truck className="w-4 h-4 text-emerald-400" />,
      OPERADOR: <Briefcase className="w-4 h-4 text-purple-400" />,
      ANALISTA: <UserCheck className="w-4 h-4 text-amber-400" />,
    };
    return icons[rol] || <UserIcon className="w-4 h-4 text-sky-400" />;
  };

  // Colores por rol - SOLO EL TEXTO Y FONDO, sin border que pueda interferir
  const getRolColor = (rol: string): string => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-500/20 text-red-400',
      MENSAJERO: 'bg-emerald-500/20 text-emerald-400',
      OPERADOR: 'bg-purple-500/20 text-purple-400',
      ANALISTA: 'bg-amber-500/20 text-amber-400',
      CLIENTE: 'bg-sky-500/20 text-sky-400',
    };
    return colors[rol] || 'bg-slate-500/20 text-slate-400';
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      'SOLICITADO': 'bg-blue-500/20 text-blue-300',
      'EN_TRANSITO': 'bg-yellow-500/20 text-yellow-300',
      'EN_ACOPIO': 'bg-purple-500/20 text-purple-300',
      'EN_ACOPIO_ASIGNADO': 'bg-indigo-500/20 text-indigo-300',
      'EN_TRANSITO_ENTREGA': 'bg-orange-500/20 text-orange-300',
      'ENTREGADO': 'bg-emerald-500/20 text-emerald-300',
      'RECIBIDO': 'bg-teal-500/20 text-teal-300',
      'EN_DISPUTA': 'bg-red-500/20 text-red-300',
    };
    return colors[estado] || 'bg-slate-500/20 text-slate-300';
  };

  const filteredUsers = users.filter(user =>
    user.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.rut.includes(searchTerm)
  );

  const filteredPackages = packages.filter(pkg =>
    pkg.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.id.includes(searchTerm) ||
    pkg.rut_cliente.includes(searchTerm)
  );

  return (
    <div className="flex h-screen bg-[#0b111a] text-slate-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 bg-[#0b111a] flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 px-6 py-8">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-wide">Portal Admin</h1>
          </div>

          <nav className="px-4 space-y-2 mt-4">
            {['users', 'packages'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === tab
                    ? 'bg-emerald-400 text-slate-900 font-semibold shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'users' ? <Users className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                {tab === 'users' ? 'Gestión de Usuarios' : 'Gestión de Paquetes'}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-emerald-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{user?.nombre || 'Usuario'}</p>
              <p className="text-xs text-slate-500">Administrador</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#0b111a] p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 border-b border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white inline-block relative">
                {activeTab === 'users' ? 'Gestión de Usuarios' : 'Gestión de Paquetes'}
                <div className="absolute -bottom-4 left-0 w-1/3 h-1 bg-emerald-500 rounded-full"></div>
              </h2>
              <p className="text-slate-400 mt-4">
                {activeTab === 'users' ? 'Administra los usuarios del sistema' : 'Visualiza y gestiona todos los paquetes'}
              </p>
            </div>
            {activeTab === 'users' && (
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <UserPlus className="w-4 h-4" />
                Nuevo Usuario
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <p className="text-red-400 text-sm">{error}</p>
              <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={activeTab === 'users' ? 'Buscar por nombre o RUT...' : 'Buscar por nombre, ID o cliente...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a2332] border border-white/5 rounded-xl px-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
          ) : activeTab === 'users' ? (
            <div className="bg-[#131b26] rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">RUT</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          No hay usuarios que coincidan con la búsqueda
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.rut} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                {getRolIcon(user.rol)}
                              </div>
                              <span className="text-white font-medium">{user.nombre_completo}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-sm text-slate-400">{formatRut(user.rut)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRolColor(user.rol)}`}>
                              {user.rol || 'CLIENTE'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.activo ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {user.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(user)}
                                className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-400"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'user', id: user.rut, name: user.nombre_completo })}
                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-white/5 flex justify-between text-sm text-slate-500">
                <span>Total: {filteredUsers.length} usuarios</span>
              </div>
            </div>
          ) : (
            <div className="bg-[#131b26] rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Mensajero</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredPackages.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                          No hay paquetes que coincidan con la búsqueda
                        </td>
                      </tr>
                    ) : (
                      filteredPackages.map((pkg) => (
                        <tr key={pkg.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-mono text-sm text-slate-400">{pkg.id}</td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">{pkg.nombre}</span>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{pkg.descripcion}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(pkg.estado_actual)}`}>
                              {pkg.estado_actual?.replace('_', ' ') || 'Desconocido'}
                            </span>
                            {pkg.is_blocked && (
                              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-500/30 text-red-300">
                                Bloqueado
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono text-sm text-slate-400">{pkg.rut_cliente}</td>
                          <td className="px-6 py-4 font-mono text-sm text-slate-400">{pkg.rut_mensajero || '—'}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setDeleteConfirm({ type: 'package', id: pkg.id, name: pkg.nombre })}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-white/5 flex justify-between text-sm text-slate-500">
                <span>Total: {filteredPackages.length} paquetes</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <UserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          fetchUsers();
        }}
        editingUser={editingUser}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={deleteConfirm?.type === 'user' ? handleDeleteUser : handleDeletePackage}
        deleteConfirm={deleteConfirm}
      />
    </div>
  );
};