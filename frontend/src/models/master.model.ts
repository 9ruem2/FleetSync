export interface Company {
  id: number;
  name: string;
  createdAt: string;
}

export interface Camp {
  id: number;
  companyId: number;
  name: string;
  createdAt: string;
}

export interface Route {
  id: number;
  campId: number;
  name: string;
  createdAt: string;
}
