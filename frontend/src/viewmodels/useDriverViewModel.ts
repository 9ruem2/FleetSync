import { useState, useEffect, useCallback, useMemo } from 'react';
import { Driver, CreateDriverForm, UpdateDriverForm } from '../models/driver.model';
import { ApiService } from '../services/apiService';
import { matchesDriverSearch } from '../utils/searchFilter';

export function useDriverViewModel() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
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
      setDrivers(data);
    } catch (err: any) {
      setError(err.message || '기사 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => {
      const matchesSearch = matchesDriverSearch(searchTerm, {
        name: d.name,
        phone: d.phone,
        routeNumber: d.routeNumber,
        contractType: d.contractType,
        id: d.id,
      });

      const matchesContract =
        contractTypeFilter === '' || d.contractType === contractTypeFilter;

      const matchesRoute =
        routeFilter === '' || d.routeNumber.toLowerCase().includes(routeFilter.toLowerCase());

      return matchesSearch && matchesContract && matchesRoute;
    });
  }, [drivers, searchTerm, contractTypeFilter, routeFilter]);

  const availableRoutes = useMemo(() => {
    const set = new Set(drivers.map(d => d.routeNumber));
    return Array.from(set).sort();
  }, [drivers]);

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
    setContractTypeFilter('');
    setRouteFilter('');
  };

  return {
    drivers,
    filteredDrivers,
    availableRoutes,
    loading,
    error,
    searchTerm,
    setSearchTerm,
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
