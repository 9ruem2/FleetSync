import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Driver } from '../../models/driver.model';
import { SlotAssignment } from '../../viewmodels/useScheduleViewModel';
import { DriverMonthlyScheduleCard } from './DriverMonthlyScheduleCard';
import {
  X,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Users,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetMonth: string; // e.g. '2026-08'
  drivers: Driver[];
  assignments: Record<string, SlotAssignment>;
}

export const ScheduleFinalizeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetMonth,
  drivers,
  assignments,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<number>(drivers[0]?.id || 0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId) || drivers[0];

  // 선택된 기사 배차표를 PNG 이미지로 다운로드
  const handleDownloadImage = async (driver: Driver) => {
    const cardEl = document.getElementById(`driver-schedule-card-${driver.id}`);
    if (!cardEl) return;

    try {
      setIsExporting(true);
      setExportProgress(`${driver.name} 기사님 배차표 이미지 생성 중...`);

      const canvas = await html2canvas(cardEl, {
        scale: 2,
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
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, Math.min(imgHeight, pageHeight - 20));
      pdf.save(`${targetMonth}_배차표_${driver.name}.pdf`);
    } catch (err: any) {
      alert('PDF 생성 실패: ' + err.message);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                기사별 월간 배차표 발급
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {targetMonth} 기준 배차표를 PDF 또는 고해상도 이미지로 내려받습니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
          {/* Driver Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600 shrink-0" />
              <label className="text-xs font-bold text-slate-700">
                발급 대상 기사 선택:
              </label>
            </div>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(Number(e.target.value))}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden min-w-[200px]"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} 기사 ({d.contractType || '일반'} | {d.camp || '캠프미지정'})
                </option>
              ))}
            </select>
          </div>

          {/* Action Download Buttons */}
          {selectedDriver && (
            <div className="flex items-center justify-end gap-2">
              <button
                disabled={isExporting}
                onClick={() => handleDownloadImage(selectedDriver)}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-extrabold text-xs shadow-2xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                )}
                <span>PNG 이미지 다운로드</span>
              </button>

              <button
                disabled={isExporting}
                onClick={() => handleDownloadPdf(selectedDriver)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Download className="w-4 h-4 text-white" />
                )}
                <span>PDF 다운로드</span>
              </button>
            </div>
          )}

          {/* Export Progress Banner */}
          {exportProgress && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
              <span>{exportProgress}</span>
            </div>
          )}

          {/* Driver Schedule Card Preview */}
          {selectedDriver && (
            <div className="border border-slate-200 rounded-3xl p-2 sm:p-4 bg-white shadow-sm">
              <DriverMonthlyScheduleCard
                driver={selectedDriver}
                targetMonth={targetMonth}
                assignments={assignments}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-2xs"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
