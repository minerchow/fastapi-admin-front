import { ApiResponse } from "@/types/user";
import type {
  MenuCreateBody,
  MenuItem,
  MenuTreeNode,
  MenuUpdateBody,
} from "@/types/menu";
import { del, get, post, put } from "@/utils/http";

// 当前用户可见的导航树：只需登录态，不能要求 menu:read —— 普通用户的侧边栏也用它。
export const getMyMenus = (): Promise<ApiResponse<MenuTreeNode[]>> =>
  get({ url: "/api/menus/nav" });

// 管理端全量树（含被隐藏的菜单），需要 menu:read；配置表不分页，对齐 /api/roles/all。
export const getMenuTree = (): Promise<ApiResponse<MenuTreeNode[]>> =>
  get({ url: "/api/menus/tree" });

export const createMenu = (
  data: MenuCreateBody
): Promise<ApiResponse<MenuItem>> => post({ url: "/api/menus", data });

export const updateMenu = (
  menuId: number,
  data: MenuUpdateBody
): Promise<ApiResponse<MenuItem>> => put({ url: `/api/menus/${menuId}`, data });

// 有子节点时后端返回 400「存在子菜单，无法删除」，软删除。
export const deleteMenu = (menuId: number): Promise<ApiResponse<MenuItem>> =>
  del({ url: `/api/menus/${menuId}` });
