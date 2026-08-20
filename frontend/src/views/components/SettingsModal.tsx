import React, { useState, useEffect } from 'react';
import { Company, Camp, Route } from '../../models/master.model';
import { ApiService } from '../../services/apiService';
import { INITIAL_COMPANIES } from '../../constants/company';
import { X, Building2, MapPin, Settings, Plus, Trash2, ChevronRight, Layers, CheckCircle2, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [camps, setCamps] = useState<Camp[]>([]);
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);

  const [routes, setRoutes] = useState<Route[]>([]);

  const [newCampName, setNewCampName] = useState('');
  const [newRouteName, setNewRouteName] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getCompanies();
      setCompanies(data);
      // '대국' 회사 또는 첫번째 회사를 기본 선택
      if (data.length > 0) {
        const daeguk = data.find(c => c.name === '대국') || data[0];
        setSelectedCompany(daeguk);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      loadCamps(selectedCompany.id);
    } else {
      setCamps([]);
      setSelectedCamp(null);
    }
  }, [selectedCompany]);

  const loadCamps = async (companyId: number) => {
    try {
      const data = await ApiService.getCamps(companyId);
      const sorted = [...data].sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));
      setCamps(sorted);
      if (sorted.length > 0) {
        setSelectedCamp(sorted[0]);
      } else {
        setSelectedCamp(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedCamp) {
      loadRoutes(selectedCamp.id);
    } else {
      setRoutes([]);
    }
  }, [selectedCamp]);

  const loadRoutes = async (campId: number) => {
    try {
      const data = await ApiService.getRoutes(campId);
      const sorted = [...data].sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));
      setRoutes(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !newCampName.trim()) return;

    const trimmed = newCampName.trim();
    const isDuplicate = camps.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      alert(`이미 등록된 캠프명입니다. ('${trimmed}')`);
      return;
    }

    try {
      const created = await ApiService.createCamp(selectedCompany.id, trimmed);
      setNewCampName('');
      await loadCamps(selectedCompany.id);
      setSelectedCamp(created);
    } catch (err: any) {
      alert(err.message || '캠프 등록 실패');
    }
  };

  const handleDeleteCamp = async (id: number) => {
    if (!confirm('캠프를 삭제하시겠습니까? 해당 캠프의 라우터도 함께 삭제됩니다.')) return;
    try {
      await ApiService.deleteCamp(id);
      if (selectedCamp?.id === id) setSelectedCamp(null);
      if (selectedCompany) await loadCamps(selectedCompany.id);
    } catch (err: any) {
      alert(err.message || '캠프 삭제 실패');
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamp || !newRouteName.trim()) return;

    const trimmed = newRouteName.trim();
    const isDuplicate = routes.some(r => r.name.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      alert(`이미 등록된 라우터명입니다. ('${trimmed}')`);
      return;
    }

    try {
      await ApiService.createRoute(selectedCamp.id, trimmed);
      setNewRouteName('');
      await loadRoutes(selectedCamp.id);
    } catch (err: any) {
      alert(err.message || '라우터 등록 실패');
    }
  };

  const handleDeleteRoute = async (id: number) => {
    if (!confirm('라우터를 삭제하시겠습니까?')) return;
    try {
      await ApiService.deleteRoute(id);
      if (selectedCamp) await loadRoutes(selectedCamp.id);
    } catch (err: any) {
      alert(err.message || '라우터 삭제 실패');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                마스터 설정 <span className="text-xs font-normal text-slate-400">(회사 → 캠프 → 라우터)</span>
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 3 Columns Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto flex-1 bg-slate-50/50">
          
          {/* Column 1: 회사 (Company) - 지정 고정 선택만 가능 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">1. 회사 (Company)</h3>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 border border-slate-200">
                <Lock className="w-2.5 h-2.5" /> 개발자 고정
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mb-3 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
              회사는 시스템 상수로 고정되어 제공되며, 사용자는 캠프 및 라우터를 관리합니다.
            </p>

            {/* 회사 목록 (지정된 회사 선택) */}
            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[160px]">
              {companies.map(c => {
                const isSelected = selectedCompany?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCompany(c)}
                    className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                      <span className="text-sm">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-200' : 'text-slate-400'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: 캠프 (Camp) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">
                2. 캠프 (Camp) {selectedCompany && <span className="text-xs text-indigo-600 font-extrabold">[{selectedCompany.name}]</span>}
              </h3>
            </div>

            {/* 캠프 등록 폼 */}
            <form onSubmit={handleAddCamp} className="flex gap-1.5 mb-3">
              <input
                type="text"
                placeholder={selectedCompany ? "캠프명 입력 (예: 서울1캠프)" : "회사 선택 필요"}
                disabled={!selectedCompany}
                value={newCampName}
                onChange={e => setNewCampName(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!selectedCompany}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition shrink-0 disabled:opacity-50 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                추가
              </button>
            </form>

            {/* 캠프 목록 */}
            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[160px]">
              {!selectedCompany ? (
                <div className="text-xs text-slate-400 text-center py-6">회사를 선택해주세요.</div>
              ) : camps.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">등록된 캠프가 없습니다. 신규 캠프를 추가해주세요.</div>
              ) : (
                camps.map(c => {
                  const isSelected = selectedCamp?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCamp(c)}
                      className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        <span className="truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCamp(c.id);
                          }}
                          className="text-slate-300 hover:text-red-500 p-1 transition"
                          title="캠프 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 3: 라우터 (Router/Route) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">
                3. 라우터 (Router) {selectedCamp && <span className="text-xs text-emerald-600 font-extrabold">[{selectedCamp.name}]</span>}
              </h3>
            </div>

            {/* 라우트 등록 폼 */}
            <form onSubmit={handleAddRoute} className="flex gap-1.5 mb-3">
              <input
                type="text"
                placeholder={selectedCamp ? "라우터명 입력 (예: 101A)" : "캠프 먼저 선택"}
                disabled={!selectedCamp}
                value={newRouteName}
                onChange={e => setNewRouteName(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!selectedCamp}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition shrink-0 disabled:opacity-50 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                추가
              </button>
            </form>

            {/* 라우트 목록 */}
            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[160px]">
              {!selectedCamp ? (
                <div className="text-xs text-slate-400 text-center py-6">캠프를 먼저 선택해주세요.</div>
              ) : routes.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">등록된 라우터가 없습니다. 신규 라우터를 추가해주세요.</div>
              ) : (
                routes.map(r => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{r.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoute(r.id)}
                      className="text-slate-300 hover:text-red-500 p-1 transition"
                      title="라우터 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
