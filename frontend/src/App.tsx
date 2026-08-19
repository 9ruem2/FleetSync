import { useState } from 'react';
import { Sidebar } from './views/components/Sidebar';
import { Header } from './views/components/Header';
import { DriverListView } from './views/drivers/DriverListView';
import { ScheduleGridView } from './views/schedule/ScheduleGridView';
import { VacationCalendarView } from './views/calendar/VacationCalendarView';

export function App() {
  const [activeTab, setActiveTab] = useState<'drivers' | 'schedule' | 'calendar'>('schedule');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabChange = (tab: 'drivers' | 'schedule' | 'calendar') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const getHeaderMeta = () => {
    switch (activeTab) {
      case 'drivers':
        return {
          title: '계정 및 기사 관리 (User & Fleet Management)',
          subtitle: '기사 관리, 라우트 번호 연동 및 고정/용차/백업 계약 형태 통합 대시보드'
        };
      case 'schedule':
        return {
          title: '스케줄 및 배차 관리 (Shift & Schedule Management)',
          subtitle: '주간 / 월간 그리드 스케줄 매트릭스 및 셀 단위 실시간 변경'
        };
      case 'calendar':
        return {
          title: '휴무 달력 현황판 (Vacation Calendar View)',
          subtitle: '월간/주간 휴무자 현황 모아보기, 일별 휴무 요약 및 대차(백업 기사) 매칭'
        };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="flex min-h-screen bg-slate-50 font-['Pretendard',sans-serif] relative overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        <Header
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        />

        <div className="flex-1">
          {activeTab === 'drivers' && <DriverListView />}
          {activeTab === 'schedule' && <ScheduleGridView />}
          {activeTab === 'calendar' && <VacationCalendarView />}
        </div>
      </main>
    </div>
  );
}

export default App;
