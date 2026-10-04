export interface MenuTreeNode {
  id: number;
  parent_id: number | null;
  name: string;
  path: string;
  icon: string | null;
  sort_order: number;
  is_visible: boolean;
  permission_id: number | null;
  // 后端冗余下发的绑定权限编码。null 有两种含义：未绑定权限，或绑定的权限已被软删除
  // （导航里按隐藏处理）。区分两者要靠 permission_id 是否非空。
  permission_code: string | null;
  children: MenuTreeNode[];
}

export interface MenuItem {
  id: number;
  name: string;
  path: string;
  icon: string | null;
  sort_order: number;
  is_visible: boolean;
  parent_id: number | null;
  permission_id: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface MenuCreateBody {
  name: string;
  path: string;
  sort_order?: number;
  is_visible?: boolean;
  parent_id?: number | null;
  permission_id?: number | null;
}

// 后端按 exclude_unset 做部分更新：字段不传 = 不改，显式 null = 提升为根 / 解除权限绑定。
// 所以表单要「全量发送」，想清空绑定必须发 null，靠 omit 做不到。
export interface MenuUpdateBody {
  name?: string;
  path?: string;
  sort_order?: number;
  is_visible?: boolean;
  parent_id?: number | null;
  permission_id?: number | null;
}
