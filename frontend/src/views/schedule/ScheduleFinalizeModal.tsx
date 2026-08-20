import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Driver } from '../../models/driver.model';
import { SlotAssignment } from '../../viewmodels/useScheduleViewModel';
import { ApiService } from '../../services/apiService';
import { DriverMonthlyScheduleCard } from './DriverMonthlyScheduleCard';
import {
  X,
  Save,
  Download,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Users,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetMonth: string; // e.g. '2026-08'
  drivers: Driver[];
  assignments: Record<string, SlotAssignment>;
  onSavedSuccess?: () => void;
}

export const ScheduleFinalizeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetMonth,
  drivers,
  assignments,
  onSavedSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'save' | 'export'>('save');
  const [title, setTitle] = useState(`${targetMonth} 정기 노선 배차표`);
  const [memo, setMemo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedRosterId, setSavedRosterId] = useState<number | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 기사별 내보내기 대상 선택
  const [selectedDriverId, setSelectedDriverId] = useState<number>(drivers[0]?.id || 0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  if (!isOpen) return null;

  // 통계 계산
  const totalSlotsCount = Object.keys(assignments).length;
  let workCount = 0;
  let offCount = 0;
  let backupCount = 0;

  Object.values(assignments).forEach((slot) => {
    if (slot.status === '휴무') {
      offCount++;
      if (slot.backupDriverId) backupCount++;
    } else {
      workCount++;
    }
  });

  // DB에 최종 근무표 저장
  const handleSaveToDb = async () => {
    try {
      setIsSaving(true);
      setErrorMsg(null);
      setSaveSuccessMsg(null);

      // assignments 객체를 MonthlyRosterItem 배열로 변환
      const items = Object.entries(assignments).map(([key, slot]) => {
        const splitIdx = key.indexOf('_');
        const date = splitIdx !== -1 ? key.slice(0, splitIdx) : targetMonth + '-01';
        const routeKey = splitIdx !== -1 ? key.slice(splitIdx + 1) : '';
        const [campName, routeName] = routeKey.split('/');

        return {
          date,
          campName: campName || '',
          routeName: routeName || '',
          routeKey,
          driverId: slot.driverId,
          driverName: slot.driverName,
          contractType: slot.contractType,
          status: slot.status,
          backupDriverId: slot.backupDriverId,
          backupDriverName: slot.backupDriverName,
        };
      });

      const created = await ApiService.createMonthlyRoster({
        targetMonth,
        title,
        memo,
        status: 'approved',
        items,
      });

      setSavedRosterId(created.id);
      setSaveSuccessMsg('월별 근무표가 데이터베이스에 성공적으로 저장 및 승인되었습니다!');
      if (onSavedSuccess) onSavedSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 선택된 기사 배차표를 PNG 이미지로 다운로드
  const handleDownloadImage = async (driver: Driver) => {
    const cardEl = document.getElementById(`driver-schedule-card-${driver.id}`);
    if (!cardEl) return;

    try {
      setIsExporting(true);
      setExportProgress(`${driver.name} 기사님 배차표 이미지 생성 중...`);

      const canvas = await html2canvas(cardEl, {
        scale: 2, // 고해상도
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${targetMonth}_배차표_${driver.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      alert('이미지 생성 실패: ' + err.message);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // 선택된 기사 배차표를 PDF 파일로 다운로드
  const handleDownloadPdf = async (driver: Driver) => {
    const cardEl = document.getElementById(`driver-schedule-card-${driver.id}`);
    if (!cardEl) return;

    try {
      setIsExporting(true);
      setExportProgress(`${driver.name} 기사님 배차표 PDF 생성 중...`);

      const canvas = await html2canvas(cardEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 15, imgWidth, imgHeight);
      pdf.save(`${targetMonth}_배차표_${driver.name}.pdf`);
    } catch (err: any) {
      alert('PDF 생성 실패: ' + err.message);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // 전체 기사 배차표 일괄 PDF/이미지 연속 다운로드
  const handleDownloadAll = async (type: 'pdf' | 'png') => {
    if (!confirm(`전체 ${drivers.length}명 기사의 배차표를 순차적으로 다운로드하시겠습니까?`)) {
      return;
    }

    try {
      setIsExporting(true);
      for (let i = 0; i < drivers.length; i++) {
        const d = drivers[i];
        setSelectedDriverId(d.id);
        setExportProgress(`[${i + 1}/${drivers.length}] ${d.name} 기사님 배차표 생성 중...`);

        // DOM 렌더링 대기
        await new Promise((r) => setTimeout(r, 400));

        if (type === 'pdf') {
          await handleDownloadPdf(d);
        } else {
          await handleDownloadImage(d);
        }
      }
      alert('전체 기사 배차표 저장이 완료되었습니다.');
    } catch (err: any) {
      alert('일괄 저장 중 오류: ' + err.message);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId) || drivers[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-blue-300 font-bold">{targetMonth}</div>
              <h3 className="font-bold text-lg text-white leading-tight mt-0.5">
                월간 근무표 최종 저장 및 기사별 배차표 발행
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('save')}
            className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'save'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>1. 근무표 최종 저장 (DB 등록)</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'export'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. 기사별 배차표 PDF / 이미지 발급</span>
          </button>
        </div>

        {/* Body Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {activeTab === 'save' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs text-center">
                  <div className="text-xs font-bold text-slate-500">총 배정 슬롯</div>
                  <div className="text-xl font-black text-slate-900 font-mono mt-1">
                    {totalSlotsCount}건
                  </div>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-2xs text-center">
                  <div className="text-xs font-bold text-blue-600">정상 근무 배정</div>
                  <div className="text-xl font-black text-blue-700 font-mono mt-1">
                    {workCount}건
                  </div>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-red-200 shadow-2xs text-center">
                  <div className="text-xs font-bold text-red-600">휴무 지정</div>
                  <div className="text-xl font-black text-red-700 font-mono mt-1">
                    {offCount}건
                  </div>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-2xs text-center">
                  <div className="text-xs font-bold text-emerald-600">대차 배정 완료</div>
                  <div className="text-xl font-black text-emerald-700 font-mono mt-1">
                    {backupCount}건
                  </div>
                </div>
              </div>

              {/* Form Input */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    근무표 제목 (버전명)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 2026년 8월 정기 배차표"
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    관리자 메모 (선택사항)
                  </label>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="특이사항이나 비고를 입력하세요 (예: 8/15 광복절 대차 조정 반영 완료)"
                    rows={3}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Status Feedback */}
              {saveSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('export')}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center gap-1 shrink-0"
                  >
                    <span>기사별 배차표 발급</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-700 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveToDb}
                  disabled={isSaving}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>DB 저장 및 승인 처리 중...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{targetMonth} 근무표 최종 저장 및 승인</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* Controls Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Driver Selector */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Users className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 shrink-0">기사 선택:</span>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(Number(e.target.value))}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none w-full max-w-sm truncate"
                  >
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {selectedDriver && (
                    <>
                      <button
                        onClick={() => handleDownloadImage(selectedDriver)}
                        disabled={isExporting}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 disabled:opacity-50"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>이미지 저장 (PNG)</span>
                      </button>

                      <button
                        onClick={() => handleDownloadPdf(selectedDriver)}
                        disabled={isExporting}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF 다운로드</span>
                      </button>
                    </>
                  )}

                  <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                  <button
                    onClick={() => handleDownloadAll('pdf')}
                    disabled={isExporting}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>전체 기사 일괄 PDF</span>
                  </button>
                </div>
              </div>

              {exportProgress && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-bold flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>{exportProgress}</span>
                </div>
              )}

              {/* Card Preview Target */}
              {selectedDriver && (
                <div className="p-4 bg-slate-200/60 rounded-2xl flex justify-center overflow-x-auto">
                  <DriverMonthlyScheduleCard
                    driver={selectedDriver}
                    targetMonth={targetMonth}
                    assignments={assignments}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
