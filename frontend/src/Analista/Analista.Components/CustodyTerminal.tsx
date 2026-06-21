// frontend/src/Analista/Analista.Components/CustodyTerminal.tsx
import React from 'react';
import { FileText, AlertTriangle } from 'lucide-react';  // 👈 Debe tener estas importaciones
import { Package, LogEntry } from '../../types';

interface CustodyTerminalProps {
  selectedPackage: Package;
  logs: LogEntry[];
}

export const CustodyTerminal: React.FC<CustodyTerminalProps> = ({ selectedPackage, logs }) => {
  return (
    <div className="mt-4 bg-black/60 rounded-xl p-4 flex-1 min-h-[100px]">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-amber-400" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Terminal de Custodia - Historial de Eventos
        </p>
      </div>
      <div className="space-y-1 font-mono text-xs max-h-32 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-slate-600">$ No hay eventos registrados para este paquete...</p>
        ) : (
          logs.map((log, idx) => (
            <div key={log.id || idx} className={`py-1 ${
              log.tipo_alerta === 'crítico' 
                ? 'text-red-400' 
                : log.tipo_alerta === 'resolución'
                ? 'text-green-400'
                : 'text-slate-400'
            }`}>
              <span className="text-slate-600">[{new Date(log.timestamp).toLocaleString()}]</span>
              {' '}
              <span className="text-amber-400">{log.estado_instante}</span>
              {' › '}
              {log.rut_responsable && <span className="text-slate-500">[{log.rut_responsable}]</span>}
              {' '}
              {log.tipo_alerta === 'crítico' && <AlertTriangle className="inline w-3 h-3 mr-1" />}
              {log.tipo_alerta === 'resolución' && '✓ '}
              {log.tipo_alerta === 'crítico' ? 'INCIDENCIA' : 'Cambio de estado'}
            </div>
          ))
        )}
      </div>
    </div>
  );
};