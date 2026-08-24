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

  // 사용자 권한 조회
  const session = useMemo(() => {
    try {
      const saved = localStorage.getItem("fleetsync_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const canCreate = session?.permissions?.canCreate ?? true;
  const canUpdate = session?.permissions?.canUpdate ?? true;
  const canDelete = session?.permissions?.canDelete ?? true;

  const loadDrivers = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      setError(null);
      let campsParam: string | undefined = undefined;
      let allowedCamps: string[] = [];

      try {
        const saved = localStorage.getItem("fleetsync_session");
        if (saved) {
          const s = JSON.parse(saved);
          if (s?.permissions?.isAllCampsAccessible === false && s?.permissions?.assignedCampNames?.length > 0) {
            allowedCamps = s.permissions.assignedCampNames.map((c: string) => c.toLowerCase().trim());
            campsParam = s.permissions.assignedCampNames.join(",");
          }
        }
      } catch {}

      const data = await ApiService.getDrivers(undefined, undefined, undefined, campsParam);

      let finalDrivers = data;
      if (allowedCamps.length > 0) {
        finalDrivers = data.filter(d =>
          parseCamps(d.camp).some(c => allowedCamps.includes(c.toLowerCase().trim()))
        );
      }

      setDrivers(finalDrivers);
    } catch (err: any) {
      console.error('[loadDrivers ERROR]:', err);
      setError(err.message || '기사 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDrivers(true);
  }, [loadDrivers]);

  const availableCamps = useMemo(() => {
    if (session?.permissions?.isAllCampsAccessible === false && session?.permissions?.assignedCampNames?.length > 0) {
      return [...session.permissions.assignedCampNames].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }

    const set = new Set<string>();
    drivers.forEach(d => {
      parseCamps(d.camp).forEach(c => set.add(c));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [drivers, session]);

  const availableRoutes = useMemo(() => {
    // Route filter is disabled if Camp is not selected
    if (!campFilter) return [];

    const set = new Set<string>();
    drivers
      .filter(d => parseCamps(d.camp).some(c => c.toLowerCase() === campFilter.toLowerCase()))
      .forEach(d => getAllDriverRoutes(d).forEach(r => set.add(r)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
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
    if (!canCreate) {
      showToast('error', '기사 등록 권한이 없습니다. (읽기 전용)');
      return;
    }

    try {
      const created = await ApiService.createDriver(form);
      if (created) {
        setDrivers(prev => [created, ...prev.filter(d => d.id !== created.id)]);
      }
      showToast('success', `${form.name} 기사가 성공적으로 등록되었습니다.`);
      setIsAddModalOpen(false);
      loadDrivers(false); // 백그라운드 동기화 (로딩 스피너 깜빡임 없음)
    } catch (err: any) {
      showToast('error', err.message || '기사 등록에 실패했습니다.');
    }
  };

  const handleUpdateDriver = async (id: number, form: UpdateDriverForm) => {
    if (!canUpdate) {
      showToast('error', '기사 정보 수정 권한이 없습니다. (읽기 전용)');
      return;
    }

    try {
      const updated = await ApiService.updateDriver(id, form);
      if (updated) {
        setDrivers(prev => prev.map(d => (d.id === id ? updated : d)));
      }
      showToast('success', `${form.name} 기사 정보가 수정되었습니다.`);
      setEditingDriver(null);
      loadDrivers(false); // 백그라운드 동기화 (로딩 스피너 깜빡임 없음)
    } catch (err: any) {
      showToast('error', err.message || '기사 정보 수정에 실패했습니다.');
    }
  };

  const handleDeleteDriver = async (id: number) => {
    if (!canDelete) {
      showToast('error', '기사 삭제 권한이 없습니다. (읽기 전용)');
      return;
    }

    try {
      await ApiService.deleteDriver(id);
      setDrivers(prev => prev.filter(d => d.id !== id));
      showToast('success', '기사 정보가 삭제 처리되었습니다.');
      setDeletingDriver(null);
      loadDrivers(false);
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
    reload: () => loadDrivers(true),
  };
}
