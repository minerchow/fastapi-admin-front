import type { PermissionItem } from "@/types/permission";

export interface RoleItem {
  id: number;
  name: string;
  description?: string | null;
  permissions?: PermissionItem[];
  created_at?: string;
  updated_at?: string;
}

export interface RoleCreateBody {
  name: string;
  description?: string | null;
  permission_ids?: number[];
}

export interface RoleUpdateBody {
  name?: string;
  description?: string | null;
  permission_ids?: number[];
}
