import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { DeleteConfirmState } from '../Admin.types';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleteConfirm: DeleteConfirmState | null;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  deleteConfirm
}) => {
  if (!isOpen || !deleteConfirm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#131b26] rounded-2xl border border-white/5 shadow-2xl w-full max-w-md">
        <div className="flex items-center gap-3 p-6 border-b border-white/5">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <div>
            <h3 className="text-xl font-bold text-white">Confirmar Eliminación</h3>
            <p className="text-sm text-slate-400">
              {deleteConfirm.type === 'user' ? 'Usuario' : 'Paquete'}: {deleteConfirm.name}
            </p>
          </div>
        </div>

        <div className="p-6">
          <p className="text-slate-300">
            ¿Estás seguro de eliminar este {deleteConfirm.type === 'user' ? 'usuario' : 'paquete'}?
            {deleteConfirm.type === 'package' && (
              <span className="block text-yellow-400 text-sm mt-2">
                ⚠️ Esta acción eliminará permanentemente el paquete y todos sus registros asociados.
              </span>
            )}
            {deleteConfirm.type === 'user' && (
              <span className="block text-yellow-400 text-sm mt-2">
                ⚠️ Esta acción eliminará permanentemente al usuario del sistema.
              </span>
            )}
          </p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
