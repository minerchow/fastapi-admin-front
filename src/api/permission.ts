import { ApiResponse } from "@/types/user";
import type { PageData, PageParams } from "@/types/page";
import type {
  PermissionCreateBody,
  PermissionItem,
  PermissionUpdateBody,
} from "@/types/permission";
import { del, get, post, put } from "@/utils/http";

export const getAllPermissions = (): Promise<ApiResponse<PermissionItem[]>> =>
  get({ url: "/api/permissions/all" });

export const getPermissionList = (
  params: PageParams
): Promise<ApiResponse<PageData<PermissionItem>>> =>
  get({ url: "/api/permissions", params });

export const createPermission = (
  data: PermissionCreateBody
): Promise<ApiResponse<PermissionItem>> =>
  post({ url: "/api/permissions", data });

export const updatePermission = (
  permissionId: number,
  data: PermissionUpdateBody
): Promise<ApiResponse<PermissionItem>> =>
  put({ url: `/api/permissions/${permissionId}`, data });

export const deletePermission = (
  permissionId: number
): Promise<ApiResponse<PermissionItem>> =>
  del({ url: `/api/permissions/${permissionId}` });
