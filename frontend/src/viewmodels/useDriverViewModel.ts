import { useState, useEffect, useCallback, useMemo } from 'react';
import { Driver, CreateDriverForm, UpdateDriverForm } from '../models/driver.model';
import { ApiService } from '../services/apiService';
import { extractPhoneDigits, formatPhoneNumber } from '../utils/phoneFormat';

export function useDriverViewModel() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [contractTypeFilter, setContractTypeFilter] = useState<string>('');
  const [routeFilter, setRouteFilter] = useState<string>('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch drivers command
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

  // Filtered drivers computed property
  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => {
      // Search by name, phone, or route
      const matchesSearch =
        searchTerm === '' ||
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.routeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone.includes(searchTerm) ||
        formatPhoneNumber(d.phone).includes(searchTerm) ||
        extractPhoneDigits(d.phone).includes(extractPhoneDigits(searchTerm));

      // Filter by contract type
      const matchesContract =
        contractTypeFilter === '' || d.contractType === contractTypeFilter;

      // Filter by route number
      const matchesRoute =
        routeFilter === '' || d.routeNumber.toLowerCase().includes(routeFilter.toLowerCase());

      return matchesSearch && matchesContract && matchesRoute;
    });
  }, [drivers, searchTerm, contractTypeFilter, routeFilter]);

  // Unique route numbers list for filter dropdown
  const availableRoutes = useMemo(() => {
    const set = new Set(drivers.map(d => d.routeNumber));
    return Array.from(set).sort();
  }, [drivers]);

  // Create Driver Command
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

  // Update Driver Command
  const handleUpdateDriver = async (id: string, form: UpdateDriverForm) => {
    try {
      await ApiService.updateDriver(id, form);
      showToast('success', `${form.name} 기사 정보가 수정되었습니다.`);
      setEditingDriver(null);
      await loadDrivers();
    } catch (err: any) {
      showToast('error', err.message || '기사 정보 수정에 실패했습니다.');
    }
  };

  // Soft Delete Driver Command
  const handleDeleteDriver = async (id: string) => {
    try {
      await ApiService.deleteDriver(id);
      showToast('success', '기사 정보가 삭제 처리되었습니다.');
      setDeletingDriver(null);
      await loadDrivers();
    } catch (err: any) {
      showToast('error', err.message || '기사 삭제에 실패했습니다.');
    }
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
