import { ApiResponse } from "@/types/user";
import type { PageData, PageParams } from "@/types/page";
import type { RoleCreateBody, RoleItem, RoleUpdateBody } from "@/types/role";
import { del, get, post, put } from "@/utils/http";

export const getAllRoles = (): Promise<ApiResponse<RoleItem[]>> =>
  get({ url: "/api/roles/all" });

export const getRoleList = (
  params: PageParams
): Promise<ApiResponse<PageData<RoleItem>>> =>
  get({ url: "/api/roles", params });

export const createRole = (
  data: RoleCreateBody
): Promise<ApiResponse<RoleItem>> => post({ url: "/api/roles", data });

export const updateRole = (
  roleId: number,
  data: RoleUpdateBody
): Promise<ApiResponse<RoleItem>> => put({ url: `/api/roles/${roleId}`, data });

export const deleteRole = (roleId: number): Promise<ApiResponse<RoleItem>> =>
  del({ url: `/api/roles/${roleId}` });

// 分配权限复用角色更新接口：只传 permission_ids，后端按未设置的字段不更新处理，
// 因此不会误改角色的名称与描述；传空数组表示清空该角色的全部权限。
export const assignRolePermissions = (
  roleId: number,
  permission_ids: number[]
): Promise<ApiResponse<RoleItem>> =>
  put({ url: `/api/roles/${roleId}`, data: { permission_ids } });
