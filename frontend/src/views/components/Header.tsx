import React from "react";
import {
  Calendar,
  UserCheck,
  ShieldCheck,
  Menu,
  ExternalLink,
  Globe,
  Settings,
  Building2,
} from "lucide-react";
import { UserSession } from "../../models/user.model";

interface Props {
  title: string;
  subtitle: string;
  onToggleMobileMenu?: () => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
  user?: UserSession | null;
}

export const Header: React.FC<Props> = ({
  title,
  subtitle,
  onToggleMobileMenu,
  onOpenSettings,
  onLogout,
  user,
}) => {
  const todayStr = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const avatarText = (() => {
    // if (!user) return "AD";
    // const text =
    //   user.adminName || user.loginId || (user as any).userId || "관리자";
    // return String(text).slice(1, 3).toUpperCase();
    return "AD";
  })();

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
          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block truncate">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>{todayStr}</span>
        </div>

        {/* User Profile Badge & Settings */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-200">
          {/* 아바타 동그라미 클릭 시 로그아웃 */}
          <button
            type="button"
            onClick={onLogout}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs transition cursor-pointer active:scale-95 border border-slate-700"
            title="클릭 시 로그아웃"
          >
            {avatarText}
          </button>

          <div className="text-left text-xs hidden xs:block sm:block">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>
                {user?.adminName ||
                  user?.loginId ||
                  (user as any)?.userId ||
                  "관리자"}
              </span>
              {user?.permissions?.isAllCampsAccessible !== false ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 font-bold border border-blue-200">
                  전체
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-600 font-bold border border-emerald-200">
                  {user?.permissions?.assignedCampNames?.[0] || "캠프"}
                </span>
              )}
            </div>
            {user?.companyName && (
              <div className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>
                  {user.companyName}
                  {user.companyCode ? ` (${user.companyCode})` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
