export interface AdminPermissions {
  isAllCampsAccessible: boolean;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  assignedCampIds: number[];
  assignedCampNames: string[];
}

export interface UserSession {
  adminId: number;
  loginId: string;
  adminName: string;
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
  isAllCampsAccessible: boolean;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  assignedCampIds?: number[];
  assignedCampNames?: string[];
  createdAt: string;
}
