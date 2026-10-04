export interface PermissionItem {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PermissionCreateBody {
  code: string;
  name: string;
  description?: string | null;
}

export interface PermissionUpdateBody {
  code?: string;
  name?: string;
  description?: string | null;
}
