import type { PermissionItem } from "@/types/permission";

// 权限编码以冒号分段（如 article:read、user:assign_role），首段即所属模块。
export const groupOf = (code: string): string => code.split(":")[0];

const GROUP_LABEL: Record<string, string> = {
  article: "文章",
  user: "用户",
  role: "角色与权限",
  menu: "菜单",
};

export const groupLabel = (group: string): string =>
  GROUP_LABEL[group] ?? group;

export const groupPermissions = (
  permissions: PermissionItem[]
): Record<string, PermissionItem[]> =>
  permissions.reduce<Record<string, PermissionItem[]>>((groups, item) => {
    const group = groupOf(item.code);
    (groups[group] ??= []).push(item);
    return groups;
  }, {});
