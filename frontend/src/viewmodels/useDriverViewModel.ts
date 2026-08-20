import { useState, useEffect, useCallback, useMemo } from 'react';
import { Driver, CreateDriverForm, UpdateDriverForm } from '../models/driver.model';
import { ApiService } from '../services/apiService';
import { matchesDriverSearch } from '../utils/searchFilter';
import { getAllDriverRoutes, parseCamps } from '../utils/routeUtils';

export function useDriverViewModel() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [campFilter, setCampFilter] = useState<string>('');
  const [contractTypeFilter, setContractTypeFilter] = useState<string>('');
  const [routeFilter, setRouteFilter] = useState<string>('');

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiService.getDrivers();
      console.log('[loadDrivers SUCCESS] 로드된 기사 수:', data.length, data);
      setDrivers(data);
    } catch (err: any) {
      console.error('[loadDrivers ERROR]:', err);
      setError(err.message || '기사 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const availableCamps = useMemo(() => {
    const set = new Set<string>();
    drivers.forEach(d => {
      parseCamps(d.camp).forEach(c => set.add(c));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [drivers]);

  const availableRoutes = useMemo(() => {
    // Route filter is disabled if Camp is not selected
    if (!campFilter) return [];

    const set = new Set<string>();
    drivers
      .filter(d => parseCamps(d.camp).some(c => c.toLowerCase() === campFilter.toLowerCase()))
      .forEach(d => getAllDriverRoutes(d).forEach(r => set.add(r)));
    return Array.from(set).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [drivers, campFilter]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => {
      const matchesSearch = matchesDriverSearch(searchTerm, {
        name: d.name,
        phone: d.phone,
        camp: d.camp,
        routes: d.routes,
        driverCode: d.driverCode,
        contractType: d.contractType,
        id: d.id,
      });

      const matchesCamp =
        campFilter === '' || parseCamps(d.camp).some(c => c.toLowerCase() === campFilter.toLowerCase());

      const matchesContract =
        contractTypeFilter === '' || d.contractType === contractTypeFilter;

      const allRoutes = getAllDriverRoutes(d);
      const matchesRoute =
        routeFilter === '' ||
        allRoutes.some(r => r.toLowerCase().includes(routeFilter.toLowerCase()));

      return matchesSearch && matchesCamp && matchesContract && matchesRoute;
    });
  }, [drivers, searchTerm, campFilter, contractTypeFilter, routeFilter]);

  const handleCreateDriver = async (form: CreateDriverForm) => {
    try {
      await ApiService.createDriver(form);
      showToast('success', `${form.name} 기사가 성공적으로 등록되었습니다.`);
      setIsAddModalOpen(false);
      await loadDrivers();
    } catch (err: any) {
      showToast('error', err.message || '기사 등록에 실패했습니다.');
    }
  };

  const handleUpdateDriver = async (id: number, form: UpdateDriverForm) => {
    try {
      await ApiService.updateDriver(id, form);
      showToast('success', `${form.name} 기사 정보가 수정되었습니다.`);
      setEditingDriver(null);
      await loadDrivers();
    } catch (err: any) {
      showToast('error', err.message || '기사 정보 수정에 실패했습니다.');
    }
  };

  const handleDeleteDriver = async (id: number) => {
    try {
      await ApiService.deleteDriver(id);
      showToast('success', '기사 정보가 삭제 처리되었습니다.');
      setDeletingDriver(null);
      await loadDrivers();
    } catch (err: any) {
      showToast('error', err.message || '기사 삭제에 실패했습니다.');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCampFilter('');
    setContractTypeFilter('');
    setRouteFilter('');
  };

  return {
    drivers,
    filteredDrivers,
    availableCamps,
    availableRoutes,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    campFilter,
    setCampFilter,
    contractTypeFilter,
    setContractTypeFilter,
    routeFilter,
    setRouteFilter,
    resetFilters,
    isAddModalOpen,
    setIsAddModalOpen,
    editingDriver,
    setEditingDriver,
    deletingDriver,
    setDeletingDriver,
    toastMessage,
    handleCreateDriver,
    handleUpdateDriver,
    handleDeleteDriver,
    reload: loadDrivers
  };
}
