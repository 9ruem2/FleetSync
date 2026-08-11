import { useState, useEffect, useCallback } from 'react';
import { Driver } from '../models/driver.model';
import { AssignBackupForm } from '../models/backup.model';
import { ApiService } from '../services/apiService';

export function useBackupViewModel(
  target: {
    date: string;
    routeNumber: string;
    originalDriverId: string;
    originalDriverName: string;
  } | null,
  onSuccess?: () => void
) {
  const [candidates, setCandidates] = useState<Driver[]>([]);
  const [selectedBackupId, setSelectedBackupId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load candidate drivers who are available on target.date
  const loadCandidates = useCallback(async () => {
    if (!target) return;
    try {
      setLoading(true);
      setError(null);
      const list = await ApiService.getBackupCandidates(target.date);
      // Filter out the original driver who is on off-day
      const filtered = list.filter(d => d.id !== target.originalDriverId);
      setCandidates(filtered);
      
      // Default pick the first backup contract driver if available
      const preferredBackup = filtered.find(d => d.contractType === '백업');
      if (preferredBackup) {
        setSelectedBackupId(preferredBackup.id);
      } else if (filtered.length > 0) {
        setSelectedBackupId(filtered[0].id);
      }
    } catch (err: any) {
      setError(err.message || '대차 기사 후보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [target]);

  useEffect(() => {
    if (target) {
      loadCandidates();
    }
  }, [target, loadCandidates]);

  // Submit backup assignment command
  const handleAssignBackup = async () => {
    if (!target) return;
    if (!selectedBackupId) {
      setError('대차로 지정할 기사를 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const form: AssignBackupForm = {
        date: target.date,
        routeNumber: target.routeNumber,
        originalDriverId: target.originalDriverId,
        backupDriverId: selectedBackupId,
        note: note || `${target.routeNumber} 라우트 대차 지정`
      };

      await ApiService.assignBackup(form);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || '대차 기사 지정 처리 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    candidates,
    selectedBackupId,
    setSelectedBackupId,
    note,
    setNote,
    loading,
    submitting,
    error,
    handleAssignBackup
  };
}
