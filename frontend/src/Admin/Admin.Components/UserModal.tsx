import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { User } from '../Admin.types';
import { useUserModal } from '../Admin.hooks';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser: User | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingUser
}) => {
  const {
    formData,
    setFormData,
    error,
    modalLoading,
    handleRutChange,
    handleCreateUser,
    handleUpdateUser,
    resetForm
  } = useUserModal(editingUser, onSuccess, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#131b26] rounded-2xl border border-white/5 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h3 className="text-xl font-bold text-white">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            <p className="text-sm text-slate-400">
              {editingUser ? `Editando: ${editingUser.nombre_completo}` : 'Completa los datos del nuevo usuario'}
            </p>
          </div>
          <button
            onClick={() => { onClose(); resetForm(); }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">RUT <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={formData.rut}
              onChange={handleRutChange}
              disabled={!!editingUser}
              placeholder="Ej: 12.345.678-9"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Formato: 12.345.678-9 (8 dígitos + guion + DV)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nombre Completo <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={formData.nombre_completo}
              onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              placeholder="Juan Pérez"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'} <span className="text-red-400">{editingUser ? '' : '*'}</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? 'Dejar en blanco para mantener' : 'Mínimo 6 caracteres'}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              required={!editingUser}
              minLength={6}
            />
            <p className="text-xs text-slate-500 mt-1">Mínimo 6 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Rol <span className="text-red-400">*</span></label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            >
              {['CLIENTE', 'OPERADOR', 'MENSAJERO', 'ANALISTA', 'ADMIN'].map((rol) => (
                <option key={rol} value={rol} className="text-white bg-[#1a2332]">{rol}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { onClose(); resetForm(); }}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium transition-all"
              disabled={modalLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {modalLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                editingUser ? 'Actualizar' : 'Crear Usuario'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
