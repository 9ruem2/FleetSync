import { useState, useEffect } from "react";
import { Sidebar } from "./views/components/Sidebar";
import { Header } from "./views/components/Header";
import { DriverListView } from "./views/drivers/DriverListView";
import { ScheduleGridView } from "./views/schedule/ScheduleGridView";
import { VacationCalendarView } from "./views/calendar/VacationCalendarView";
import { AdminManagementView } from "./views/admin/AdminManagementView";
import { SettingsModal } from "./views/components/SettingsModal";
import { LoginView } from "./views/auth/LoginView";
import { UserSession } from "./models/user.model";

export function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<
    "drivers" | "schedule" | "calendar" | "admins"
  >("drivers");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load User Session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("fleetsync_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed || !parsed.companyId || !parsed.loginId) {
          localStorage.removeItem("fleetsync_session");
          return;
        }
        const normalized: UserSession = {
          adminId: parsed.adminId || 0,
          loginId: parsed.loginId,
          adminName: parsed.adminName || parsed.loginId,
          isMaster: !!parsed.isMaster,
          companyId: parsed.companyId,
          companyCode: parsed.companyCode || "",
          companyName: parsed.companyName || "",
          permissions: parsed.permissions || {
            isAllCampsAccessible: true,
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true,
            assignedCampIds: [],
            assignedCampNames: [],
          },
        };
        setCurrentUser(normalized);
        localStorage.setItem("fleetsync_session", JSON.stringify(normalized));
      } catch (e) {
        localStorage.removeItem("fleetsync_session");
      }
    }
  }, []);

  const handleLoginSuccess = (userInfo: UserSession) => {
    setCurrentUser(userInfo);
    localStorage.setItem("fleetsync_session", JSON.stringify(userInfo));
  };

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      setCurrentUser(null);
      localStorage.removeItem("fleetsync_session");
    }
  };

  const handleTabChange = (tab: "drivers" | "schedule" | "calendar" | "admins") => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const getHeaderMeta = () => {
    switch (activeTab) {
      case "drivers":
        return {
          title: "기사 관리 (User & Fleet Management)",
          subtitle:
            "기사 관리, 회사/캠프/라우터 연동 및 고정/용차/백업 계약 형태 통합 대시보드",
        };
      case "schedule":
        return {
          title: "노선 배차 관리 (Schedule Management)",
          subtitle: "주간 / 월간 스케줄 관리",
        };
      case "calendar":
        return {
          title: "휴무 달력 조회 (Vacation Calendar View)",
          subtitle: "월간/주간 휴무 조회",
        };
      case "admins":
        return {
          title: "관리자 및 권한 관리 (Admin & Permissions)",
          subtitle: "총괄관리자 전용: 관리자 계정 등록, 담당 캠프/노선 및 C/R/U/D 권한 설정",
        };
    }
  };

  // If not logged in, render LoginView
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const headerMeta = getHeaderMeta();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-['Pretendard',sans-serif] relative">
      {/* Sidebar Navigation (화면 좌측에 완전 고정) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area (우측 영역만 독립 세로 스크롤) */}
      <main className="flex-1 min-w-0 h-full flex flex-col overflow-y-auto">
        <Header
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLogout={handleLogout}
          user={currentUser}
        />

        <div className="flex-1 pb-10">
          {activeTab === "drivers" && <DriverListView />}
          {activeTab === "schedule" && <ScheduleGridView />}
          {activeTab === "calendar" && <VacationCalendarView />}
          {activeTab === "admins" && <AdminManagementView currentUser={currentUser} />}
        </div>
      </main>

      {/* Master Settings Modal (Company -> Camp -> Route) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
