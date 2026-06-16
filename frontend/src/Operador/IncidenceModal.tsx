import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface IncidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { motivo: string; descripcion: string }) => Promise<void>;
  packageId: string;
  packageName: string;
  isLoading: boolean;
}

const MOTIVOS_OPCIONES = [
  'Daño en el embalaje',
  'Producto dañado',
  'Producto faltante',
  'Retraso en la entrega',
  'Dirección incorrecta',
  'Problema de integridad',
  'Problema de logística',
  'Cliente no disponible',
  'Otro'
];

const IncidenceModal: React.FC<IncidenceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  packageId,
  packageName,
  isLoading
}) => {
  const [motivo, setMotivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!motivo) {
      setError('Debes seleccionar un motivo');
      return;
    }
    
    if (!descripcion.trim()) {
      setError('Debes ingresar una descripción');
      return;
    }

    if (descripcion.trim().length < 10) {
      setError('La descripción debe tener al menos 10 caracteres');
      return;
    }

    try {
      setError('');
      await onSubmit({ motivo, descripcion });
      setMotivo('');
      setDescripcion('');
      onClose();
    } catch (err) {
      setError('Error al enviar la incidencia. Intenta nuevamente.');
    }
  };

  const handleClose = () => {
    setMotivo('');
    setDescripcion('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop con blur */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-700 shadow-2xl w-full max-w-lg transform transition-all animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/30">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Reportar Incidencia</h3>
              <p className="text-sm text-slate-400 mt-1">
                Paquete: {packageName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-slate-800 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* ID del Paquete (Disabled) */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              ID del Paquete
            </label>
            <input
              type="text"
              value={packageId}
              disabled
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 cursor-not-allowed font-mono text-sm"
            />
          </div>

          {/* Motivo - Select/Input combinado */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Motivo <span className="text-red-400">*</span>
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
              disabled={isLoading}
              required
            >
              <option value="">Selecciona un motivo</option>
              {MOTIVOS_OPCIONES.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción - Textarea */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Descripción <span className="text-red-400">*</span>
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all resize-none"
              placeholder="Describe detalladamente la incidencia. Mínimo 10 caracteres."
              disabled={isLoading}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              {descripcion.length}/500 caracteres
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg animate-in fade-in slide-in-from-top-2">
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 font-medium transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enviando...</span>
                </div>
              ) : (
                'Enviar Incidencia'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidenceModal;