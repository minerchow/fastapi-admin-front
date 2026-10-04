import type { RouteObject } from "react-router-dom";
import { routes } from "@/routes";

const joinPath = (parent: string, child: string): string => {
  const base = parent === "/" || parent === "" ? "" : parent;
  const tail = child.startsWith("/") ? child : `/${child}`;
  return `${base}${tail}`;
};

/**
 * 菜单可绑定的前端路由路径，从 src/routes.tsx 派生，而不是再维护一份硬编码清单 ——
 * routes.tsx 是唯一真源，新增页面只改路由表，菜单管理页的下拉会自动跟上。
 *
 * 只收集带侧边栏布局（有 children 的那条路由）下的后代：顶层的 /login、/register、
 * /count 是不带外壳的独立页，挂进菜单树会让 admin 造出坏菜单。
 * 跳过 ""（索引重定向）与 "*"（兜底 NoPermission）。
 */
export const collectMenuablePaths = (): string[] => {
  const paths: string[] = [];

  const walk = (nodes: RouteObject[], parent: string) => {
    for (const node of nodes) {
      const raw = node.path ?? "";
      if (raw === "" || raw.startsWith("*")) continue;
      const full = joinPath(parent, raw);
      paths.push(full);
      if (node.children) walk(node.children, full);
    }
  };

  for (const top of routes) {
    if (!top.children) continue;
    walk(top.children, top.path ?? "/");
  }

  return Array.from(new Set(paths));
};
