export type ContractType = '고정' | '용차' | '백업';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  routeNumber: string;
  contractType: ContractType;
  createdAt: string;
  isDeleted: boolean;
}

export interface CreateDriverForm {
  name: string;
  phone: string;
  routeNumber: string;
  contractType: ContractType;
}

export interface UpdateDriverForm {
  name: string;
  phone: string;
  routeNumber: string;
  contractType: ContractType;
}
