export type ContractType = '고정' | '용차' | '백업';
export type WeekPattern = '1,3' | '2,4' | 'both';

export interface DriverCampRouteInfo {
  campId: number;
  campName: string;
  route: string;
}

export interface Driver {
  id: number;
  driverCode: string;
  name: string;
  phone: string;
  camp: string;          // 콤마 구분 캠프 목록
  routeNumber: string;   // 메인 라우트
  routesWeek13: string;  // 콤마 구분 라우트 목록 (camp와 1:1)
  routesWeek24: string;
  weekPattern: WeekPattern;
  contractType: ContractType;
  createdAt: string;
  isDeleted: boolean;
  campRoutes?: DriverCampRouteInfo[];
}

export interface CreateDriverForm {
  driverCode?: string;
  name: string;
  phone: string;
  camp: string;    // 콤마구분 캠프명 목록
  routes: string;  // 콤마구분 라우트 목록 (camp와 1:1 대응)
  contractType: ContractType;
}

export interface UpdateDriverForm {
  driverCode?: string;
  name: string;
  phone: string;
  camp: string;
  routes: string;
  contractType: ContractType;
}
