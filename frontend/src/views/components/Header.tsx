import React from 'react';
import { Calendar, UserCheck, ShieldCheck, Menu } from 'lucide-react';

interface Props {
  title: string;
  subtitle: string;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<Props> = ({ title, subtitle, onToggleMobileMenu }) => {
  const todayStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 sm:py-5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger Menu Toggle Button for Mobile */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition shrink-0"
            title="메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <h1 className="text-base sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
            {title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block truncate">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Date Display (Hidden on very small screens, compact on sm) */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>{todayStr}</span>
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-200">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            AD
          </div>
          <div className="text-left text-xs hidden xs:block sm:block">
            <div className="font-bold text-slate-800 flex items-center gap-1">
              <span>권광훈</span>
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
