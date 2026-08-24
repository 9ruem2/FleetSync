export interface AdminCampRouteMapping {
  campId: number;
  campName: string;
  routeId?: number | null;
  routeName: string;
}

export interface AdminPermissions {
  isAllCampsAccessible: boolean;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  assignedCampIds: number[];
  assignedCampNames: string[];
  assignedCampRoutes?: AdminCampRouteMapping[];
}

export interface UserSession {
  adminId: number;
  loginId: string;
  adminName: string;
  isMaster?: boolean;
  companyId: number;
  companyCode: string;
  companyName: string;
  permissions: AdminPermissions;
}

export interface AdminUser {
  id: number;
  companyId: number;
  loginId: string;
  name: string;
  isMaster: boolean;
  isAllCampsAccessible: boolean;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  assignedCampIds?: number[];
  assignedCampNames?: string[];
  assignedCampRoutes?: AdminCampRouteMapping[];
  createdAt: string;
}

export interface CreateAdminRequest {
  companyId: number;
  loginId: string;
  password: string;
  name: string;
  isMaster?: boolean;
  isAllCampsAccessible?: boolean;
  canCreate?: boolean;
  canRead?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  assignedCampIds?: number[];
  assignedCampRoutes?: {
    campId: number;
    routeId?: number | null;
    routeName?: string;
  }[];
}

export interface UpdateAdminRequest {
  loginId?: string;
  password?: string;
  name?: string;
  isMaster?: boolean;
  isAllCampsAccessible?: boolean;
  canCreate?: boolean;
  canRead?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  assignedCampIds?: number[];
  assignedCampRoutes?: {
    campId: number;
    routeId?: number | null;
    routeName?: string;
  }[];
}
