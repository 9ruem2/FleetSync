import React, { useEffect, useRef } from "react";
import {
  Database,
  CheckCircle2,
  Loader2,
  AlertCircle,
  CloudUpload,
  ClipboardList,
  Trash2,
  FileCheck,
} from "lucide-react";

export type SaveProgressStep =
  | "idle"
  | "preparing"
  | "pruning"
  | "deleting_old"
  | "inserting_master"
  | "inserting_items"
  | "done"
  | "error";

export interface SaveProgressState {
  step: SaveProgressStep;
  totalItems: number;
  insertedItems: number;
  errorMessage?: string;
}

interface Props {
  isOpen: boolean;
  state: SaveProgressState;
  targetMonth: string;
  onClose: () => void;
}

const STEP_CONFIG: {
  key: SaveProgressStep;
  label: string;
}[] = [
  { key: "preparing", label: "배차 데이터 준비 중" },
  { key: "pruning", label: "오래된 데이터 정리 중" },
  { key: "deleting_old", label: "기존 근무표 삭제 중" },
  { key: "inserting_master", label: "근무표 헤더 생성 중" },
  { key: "inserting_items", label: "배차 항목 저장 중" },
  { key: "done", label: "저장 완료" },
];

const STEP_ORDER: SaveProgressStep[] = [
  "preparing",
  "pruning",
  "deleting_old",
  "inserting_master",
  "inserting_items",
  "done",
];

function getOverallPercent(state: SaveProgressState): number {
  if (state.step === "idle") return 0;
  if (state.step === "done") return 100;
  if (state.step === "error") return 55;

  if (state.step === "inserting_items" && state.totalItems > 0) {
    const base = 60;
    return Math.round(base + (state.insertedItems / state.totalItems) * 30);
  }

  const percentMap: Record<SaveProgressStep, number> = {
    idle: 0,
    preparing: 10,
    pruning: 25,
    deleting_old: 40,
    inserting_master: 55,
    inserting_items: 60,
    done: 100,
    error: 55,
  };
  return percentMap[state.step] ?? 0;
}

export const SaveProgressModal: React.FC<Props> = ({
  isOpen,
  state,
  targetMonth,
  onClose,
}) => {
  const percent = getOverallPercent(state);
  const isDone = state.step === "done";
  const isError = state.step === "error";

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (isDone || isError)) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, isDone, isError, onClose]);

  if (!isOpen) return null;

  const curIdx = isDone
    ? STEP_ORDER.length
    : isError
      ? STEP_ORDER.indexOf("inserting_master")
      : STEP_ORDER.indexOf(state.step);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(15, 23, 42, 0.72)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.28)" }}
      >
        {/* 헤더 */}
        <div
          className="px-7 pt-7 pb-5"
          style={{
            background: isError
              ? "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)"
              : isDone
                ? "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)"
                : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                isError ? "bg-red-100" : isDone ? "bg-emerald-100" : "bg-blue-100"
              }`}
            >
              {isError ? (
                <AlertCircle className="w-6 h-6 text-red-500" />
              ) : isDone ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              ) : (
                <Database className="w-6 h-6 text-blue-600 animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base leading-tight">
                {isError ? "저장 실패" : isDone ? "저장 완료!" : "근무표 DB 저장 중..."}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {targetMonth} 월 배차 노선표
              </p>
            </div>
          </div>

          {/* 진행률 바 */}
          <div className="w-full h-2.5 rounded-full bg-white/60 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isError ? "bg-red-400" : isDone ? "bg-emerald-500" : "bg-blue-500"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] font-bold">
            <span className={isError ? "text-red-600" : isDone ? "text-emerald-700" : "text-blue-700"}>
              {isError ? "오류 발생" : `${percent}% 완료`}
            </span>
            {state.step === "inserting_items" && state.totalItems > 0 && (
              <span className="text-slate-500">
                {state.insertedItems} / {state.totalItems} 건
              </span>
            )}
          </div>
        </div>

        {/* 단계 체크리스트 */}
        <div className="px-7 py-5 space-y-2">
          {STEP_CONFIG.map((sc) => {
            const scIdx = STEP_ORDER.indexOf(sc.key);
            const isCompleted = scIdx < curIdx;
            const isCurrent = !isDone && !isError && sc.key === state.step;
            const isPending = !isCompleted && !isCurrent;

            return (
              <div
                key={sc.key}
                className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-blue-50 border border-blue-200"
                    : isCompleted
                      ? "bg-slate-50 border border-slate-100"
                      : "opacity-35"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm ${
                    isCompleted
                      ? "bg-emerald-100 text-emerald-600"
                      : isCurrent
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="text-[10px] font-black">{scIdx + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-xs font-bold block truncate ${
                      isCompleted ? "text-emerald-700" : isCurrent ? "text-blue-700" : "text-slate-400"
                    }`}
                  >
                    {sc.label}
                  </span>
                  {isCurrent && sc.key === "inserting_items" && state.totalItems > 0 && (
                    <span className="text-[10px] text-blue-500 font-medium">
                      {state.insertedItems} / {state.totalItems}건 처리 중
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {isError && state.errorMessage && (
            <div className="mt-1 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {state.errorMessage}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        {(isDone || isError) ? (
          <div className="px-7 pb-7">
            <button
              onClick={onClose}
              className={`w-full py-3 rounded-2xl font-black text-sm transition-all shadow-sm ${
                isError
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
              }`}
            >
              {isError ? "닫기" : "확인"}
            </button>
          </div>
        ) : (
          <div className="px-7 pb-6">
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              데이터베이스에 저장하는 중입니다.
              <br />
              창을 닫거나 새로고침하지 마세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
