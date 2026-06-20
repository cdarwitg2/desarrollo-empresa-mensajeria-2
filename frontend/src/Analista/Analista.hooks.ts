import { useState, useEffect } from 'react';
import { api, updateActivoEstado } from '../services/api';
import { Package, LogEntry } from '../types';
import { StateType } from './Analista.types';

export const useAnalystDashboard = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDisputedPackages();
  }, []);

  useEffect(() => {
    if (selectedPackage) {
      fetchPackageLogs(selectedPackage.id);
    }
  }, [selectedPackage]);

  const fetchDisputedPackages = async () => {
    try {
      setIsLoading(true);
      setError('');

      const data = await api.get('/api/packages/filter?estado=EN_DISPUTA');
      setPackages(data.packages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPackageLogs = async (packageId: string) => {
    try {
      setIsLoading(true);
      try {
        const data = await api.get(`/api/packages/${packageId}/logs`);
        setLogs(data.logs || []);
      } catch (err: any) {
        if (err.status === 404) {
          setLogs([]);
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Error al cargar logs:', err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePackageStatus = async (newStatus: StateType, integridad?: string) => {
    if (!selectedPackage) return;
    try {
      setIsLoading(true);
      const data = await updateActivoEstado(selectedPackage.id_activo, newStatus, integridad, '');
      
      setSelectedPackage(data.asset);
      if (data.log) {
        setLogs([data.log, ...logs]);
      }
      
      // If it's no longer in dispute, remove it from the list and clear selection
      if (newStatus !== 'EN_DISPUTA') {
         setSelectedPackage(null);
         await fetchDisputedPackages();
      }
    } catch (err: any) {
      if (err.status === 409) {
        setError(err.message || 'Error de conflicto de transición de estado');
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleaseAsset = async () => {
    await updatePackageStatus('EN_ACOPIO');
  };

  return {
    packages,
    selectedPackage,
    setSelectedPackage,
    logs,
    isLoading,
    error,
    handleReleaseAsset
  };
};
