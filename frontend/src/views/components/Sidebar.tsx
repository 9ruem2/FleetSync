import React from 'react';
import { Users, CalendarRange, CalendarDays, Truck } from 'lucide-react';

interface Props {
  activeTab: 'drivers' | 'schedule' | 'calendar';
  setActiveTab: (tab: 'drivers' | 'schedule' | 'calendar') => void;
}

export const Sidebar: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    {
      id: 'drivers',
      label: '기사 및 라우트 관리',
      icon: Users,
      description: '기사 CRUD, 라우트 & 계약 형태',
      // badge: 'F-01'
    },
    {
      id: 'schedule',
      label: '근무 스케줄표 (Grid)',
      icon: CalendarRange,
      description: '주간/월간 근무 & 대차 지정',
      // badge: 'F-02'
    },
    {
      id: 'calendar',
      label: '휴무 달력 (Calendar)',
      icon: CalendarDays,
      description: '월간/주간 휴무 현황판',
      // badge: 'F-02-2'
    }
  ] as const;

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col justify-between shrink-0 shadow-xl">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800">
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
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isActive
                          ? 'bg-blue-800/50 text-blue-100'
                          : 'bg-slate-800 text-slate-400'
                        }`}
                    >
                      {/* {item.badge} */}
                    </span>
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
  );
};
