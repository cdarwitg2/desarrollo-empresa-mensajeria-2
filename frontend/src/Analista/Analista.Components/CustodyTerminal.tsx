import React from 'react';
import { Package, LogEntry } from '../../types';

interface CustodyTerminalProps {
  selectedPackage: Package;
  logs: LogEntry[];
}

export const CustodyTerminal: React.FC<CustodyTerminalProps> = ({ selectedPackage, logs }) => {
  return (
    <div className="mt-6 backdrop-blur-md bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-sm">
      <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase">
        Terminal de Custodia - Paquete #{selectedPackage.id} ({selectedPackage.nombre})
      </h4>
      <div className="bg-black/80 rounded p-4 h-48 overflow-y-auto space-y-2">
        {logs.length === 0 ? (
          <p className="text-slate-600">
            $ Historial de cambios de estado para este paquete...
          </p>
        ) : (
          logs.map((log) => {
            const date = new Date(log.timestamp);
            const dateStr = date.toLocaleDateString('es-ES', { 
              day: '2-digit', month: '2-digit', year: 'numeric' 
            });
            const timeStr = date.toLocaleTimeString('es-ES', {
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            });
            
            return (
              <div
                key={log.id}
                className={`${
                  log.tipo_alerta === 'resolución'
                    ? 'text-green-400'
                    : log.tipo_alerta === 'crítico'
                      ? 'text-red-400'
                      : 'text-slate-400'
                }`}
              >
                {`[${dateStr} ${timeStr}] RUT: ${log.rut_responsable} | Estado: ${log.estado_instante} | Alerta: ${log.tipo_alerta}`}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
