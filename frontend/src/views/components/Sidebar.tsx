import React from 'react';
import { Users, CalendarRange, CalendarDays, Truck, X, ExternalLink } from 'lucide-react';

interface Props {
  activeTab: 'drivers' | 'schedule' | 'calendar';
  setActiveTab: (tab: 'drivers' | 'schedule' | 'calendar') => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<Props> = ({ activeTab, setActiveTab, isOpen = false, onClose }) => {
  const menuItems = [
    {
      id: 'drivers',
      label: '기사 관리',
      icon: Users,
      description: '기사 관리 및 계약 형태',
    },
    {
      id: 'schedule',
      label: '근무 스케줄표',
      icon: CalendarRange,
      description: '주간/월간 근무 & 대차 지정',
    },
    {
      id: 'calendar',
      label: '휴무 달력 (Calendar)',
      icon: CalendarDays,
      description: '월간/주간 휴무 현황판',
    }
  ] as const;

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col justify-between shrink-0 shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between px-3 py-4 mb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  <span>FleetSync</span>
                  <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                    PRO
                  </span>
                </h1>
                <p className="text-xs text-slate-400 font-medium">쿠팡 기사 및 노선 관리자</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              메인 메뉴
            </div>
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-200 text-left group ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                >
                  <Icon
                    className={`w-5 h-5 mt-0.5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                      }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <p
                      className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-blue-100/80' : 'text-slate-400'
                        }`}
                    >
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* External Links Section */}
          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              외부 바로가기
            </div>
            <a
              href="https://fly.coupang.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white transition-all duration-200 group shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 font-extrabold text-xs group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  C
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-100 group-hover:text-white truncate">
                    쿠팡 어드민 페이지
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono truncate">fly.coupang.com</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0 ml-1 transition-colors" />
            </a>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
          <div className="flex justify-between items-center text-slate-300 font-semibold">
            <span>관리자 모드</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <p className="text-[11px] text-slate-400">캠프 노선 & 대차 실시간 시스템</p>
        </div>
      </aside>
    </>
  );
};
