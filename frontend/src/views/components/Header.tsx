import React from 'react';
import { Calendar, UserCheck, ShieldCheck } from 'lucide-react';

interface Props {
  title: string;
  subtitle: string;
}

export const Header: React.FC<Props> = ({ title, subtitle }) => {
  const todayStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>{todayStr}</span>
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow">
            AD
          </div>
          <div className="text-left text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1">
              <span>쿠팡 노선 관리자</span>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-emerald-500" />
              <span>온라인</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
