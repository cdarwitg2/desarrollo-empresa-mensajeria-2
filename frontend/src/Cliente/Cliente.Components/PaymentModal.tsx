import React from 'react';
import { X, CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { PaymentModalProps } from '../Cliente.types';
import { usePaymentModal } from '../Cliente.hooks';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  shipmentData,
}) => {
  const {
    cardNumber,
    setCardNumber,
    cardName,
    setCardName,
    expiryDate,
    setExpiryDate,
    cvv,
    setCvv,
    isProcessing,
    error,
    handleSubmit,
    formatCardNumber,
    formatExpiryDate
  } = usePaymentModal(onSuccess);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#131b26] rounded-2xl border border-white/5 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Pago de Envío</h3>
              <p className="text-xs text-slate-400">Resumen del envío</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Resumen del envío */}
        <div className="p-6 border-b border-white/5 bg-white/5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Paquete:</span>
              <span className="text-white font-medium">{shipmentData.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Origen:</span>
              <span className="text-white truncate max-w-[200px]">{shipmentData.direccion_origen}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Destino:</span>
              <span className="text-white truncate max-w-[200px]">{shipmentData.direccion_destino}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/5">
              <span className="text-slate-400">Total:</span>
              <span className="text-emerald-400 font-bold">$5.990 CLP</span>
            </div>
          </div>
        </div>

        {/* Formulario de pago */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Número de Tarjeta
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              maxLength={19}
              disabled={isProcessing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre del Titular
            </label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              disabled={isProcessing}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fecha Expiración
              </label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                placeholder="MM/YY"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                maxLength={5}
                disabled={isProcessing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                CVV
              </label>
              <input
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                placeholder="123"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                maxLength={4}
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="w-3 h-3" />
            <span>Pago seguro. Tus datos están protegidos.</span>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Procesando pago...</span>
              </div>
            ) : (
              'Pagar $5.990 CLP'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};