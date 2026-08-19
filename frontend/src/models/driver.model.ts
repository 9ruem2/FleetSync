export type ContractType = '고정' | '용차' | '백업';
export type WeekPattern = '1,3' | '2,4' | 'both';

export interface Driver {
  id: number;
  driverCode: string;
  name: string;
  phone: string;
  routeNumber: string;
  routesWeek13: string;
  routesWeek24: string;
  weekPattern: WeekPattern;
  contractType: ContractType;
  createdAt: string;
  isDeleted: boolean;
}

export interface CreateDriverForm {
  driverCode: string;
  name: string;
  phone: string;
  routesWeek13: string;
  routesWeek24: string;
  weekPattern: WeekPattern;
  contractType: ContractType;
}

export interface UpdateDriverForm {
  driverCode: string;
  name: string;
  phone: string;
  routesWeek13: string;
  routesWeek24: string;
  weekPattern: WeekPattern;
  contractType: ContractType;
}
