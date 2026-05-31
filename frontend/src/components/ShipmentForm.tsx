import React, { useState } from 'react';
import { Package, AlertCircle, Loader } from 'lucide-react';
import { PaymentModal } from './PaymentModal';

interface ShipmentFormData {
  nombre: string;
  descripcion: string;
  direccion_origen: string;
  direccion_destino: string;
}

interface ShipmentFormProps {
  onSuccess?: () => void;
}

export const ShipmentForm: React.FC<ShipmentFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<ShipmentFormData>({
    nombre: '',
    descripcion: '',
    direccion_origen: '',
    direccion_destino: '',
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [errors, setErrors] = useState<Partial<ShipmentFormData>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name as keyof ShipmentFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ShipmentFormData> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del paquete es obligatorio';
    }
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    }
    if (!formData.direccion_origen.trim()) {
      newErrors.direccion_origen = 'La dirección de origen es obligatoria';
    }
    if (!formData.direccion_destino.trim()) {
      newErrors.direccion_destino = 'La dirección de destino es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedPayment = () => {
    if (validateForm()) {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    setSuccessMessage('Paquete registrado en estado SOLICITADO');
    setFormData({
      nombre: '',
      descripcion: '',
      direccion_origen: '',
      direccion_destino: '',
    });
    setShowPaymentModal(false);

    // Limpiar mensaje después de 4 segundos
    setTimeout(() => {
      setSuccessMessage('');
      onSuccess?.();
    }, 4000);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="backdrop-blur-md bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-green-400 text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {/* Form Container */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <Package className="w-6 h-6 text-blue-400" />
            <h3 className="text-2xl font-bold text-white">Solicitar Envío</h3>
          </div>

          <div className="space-y-6">
            {/* Nombre del Paquete */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre del Paquete
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ej: Documentos confidenciales"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              {errors.nombre && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.nombre}
                </div>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Descripción del Contenido
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Describe el contenido del paquete..."
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
              />
              {errors.descripcion && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.descripcion}
                </div>
              )}
            </div>

            {/* Dirección de Origen */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Dirección de Origen
              </label>
              <input
                type="text"
                name="direccion_origen"
                value={formData.direccion_origen}
                onChange={handleInputChange}
                placeholder="Ej: Calle Principal 123, Santiago"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              {errors.direccion_origen && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.direccion_origen}
                </div>
              )}
            </div>

            {/* Dirección de Destino */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Dirección de Destino
              </label>
              <input
                type="text"
                name="direccion_destino"
                value={formData.direccion_destino}
                onChange={handleInputChange}
                placeholder="Ej: Av. Secundaria 456, Valparaíso"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              {errors.direccion_destino && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.direccion_destino}
                </div>
              )}
            </div>

            {/* Botón Proceder al Pago */}
            <button
              onClick={handleProceedPayment}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
            >
              Proceder al Pago
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          shipmentData={formData}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};
