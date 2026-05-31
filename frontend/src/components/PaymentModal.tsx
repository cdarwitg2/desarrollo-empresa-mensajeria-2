import React, { useState } from 'react';
import { X, CreditCard, Loader, CheckCircle } from 'lucide-react';

interface ShipmentData {
  nombre: string;
  descripcion: string;
  direccion_origen: string;
  direccion_destino: string;
}

interface PaymentModalProps {
  shipmentData: ShipmentData;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  shipmentData,
  onClose,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Obtener el token del sessionStorage
      const token = sessionStorage.getItem('token');

      if (!token) {
        throw new Error('No autenticado. Por favor inicia sesión nuevamente.');
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      // Realizar POST a /api/packages/create
      const response = await fetch(`${apiUrl}/api/packages/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(shipmentData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear el paquete');
      }

      const data = await response.json();

      // Mostrar estado de éxito brevemente
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Confirmar Pago</h2>
          </div>
          {!isProcessing && !isSuccess && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content */}
        {!isSuccess ? (
          <div className="space-y-6">
            {/* Resumen del Envío */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Resumen del Envío
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Paquete:</span>
                  <span className="text-white font-medium">{shipmentData.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Origen:</span>
                  <span className="text-white font-medium text-right">
                    {shipmentData.direccion_origen}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Destino:</span>
                  <span className="text-white font-medium text-right">
                    {shipmentData.direccion_destino}
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Payment Simulation */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Método de Pago
              </h3>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <p className="text-slate-400">Transferencia Simulada</p>
                  <p className="text-white font-mono">●●●● ●●●● ●●●● 4242</p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Confirmar Pago'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="w-16 h-16 text-green-400 animate-bounce" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">¡Pago Confirmado!</h3>
              <p className="text-slate-300 text-sm">
                Tu paquete ha sido registrado en estado SOLICITADO
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
