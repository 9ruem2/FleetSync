export type ContractType = '고정' | '용차' | '백업';

export interface DriverCampRouteInfo {
  campId: number;
  campName: string;
  routeId?: number;
  route: string;
}

export interface DriverFixedHoliday {
  id?: number;
  driverId?: number;
  weekCycle: string; // '매주' | '1,3주' | '2,4주' | '1주' | '2주' | '3주' | '4주' | '5주'
  dayOfWeek: string; // '일' | '월' | '화' | '수' | '목' | '금' | '토' (쉼표 구분 복수 지원, 예: '일,월')
  createdAt?: string;
}

export interface DriverRoutePattern {
  id?: number;
  driverId?: number;
  weekCycle: string; // '매주' | '1,3주' | '2,4주' | '1주'~'5주'
  dayOfWeek: string; // '월' | '화' | '화,수' 등 (쉼표 구분 복수 지원)
  campId?: number;
  campName: string;  // '남양주3'
  routeId?: number;
  routeName: string; // '905CD'
  createdAt?: string;
}

export interface Driver {
  id: number;
  companyId?: number;
  companyName?: string;
  driverCode: string;
  name: string;
  phone: string;
  camp: string;        // 콤마 구분 캠프 목록
  routes: string;      // 콤마 구분 라우트 목록 (camp와 1:1)
  contractType: ContractType;
  createdAt: string;
  isDeleted: boolean;
  campRoutes?: DriverCampRouteInfo[];
  fixedHolidays?: DriverFixedHoliday[];
  routePatterns?: DriverRoutePattern[];
}

export interface CreateDriverForm {
  companyId?: number;
  driverCode?: string;
  name: string;
  phone: string;
  camp: string;    // 콤마구분 캠프명 목록
  routes: string;  // 콤마구분 라우트 목록 (camp와 1:1 대응)
  contractType: ContractType;
  fixedHolidays?: {
    weekCycle: string;
    dayOfWeek: string;
  }[];
  routePatterns?: {
    weekCycle: string;
    dayOfWeek: string;
    campId?: number;
    campName: string;
    routeId?: number;
    routeName: string;
  }[];
}

export interface UpdateDriverForm {
  companyId?: number;
  driverCode?: string;
  name: string;
  phone: string;
  camp: string;
  routes: string;
  contractType: ContractType;
  fixedHolidays?: {
    weekCycle: string;
    dayOfWeek: string;
  }[];
  routePatterns?: {
    weekCycle: string;
    dayOfWeek: string;
    campId?: number;
    campName: string;
    routeId?: number;
    routeName: string;
  }[];
}

