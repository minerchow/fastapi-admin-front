import { makeAutoObservable } from "mobx";
import { getMyMenus } from "@/api/menu";
import type { MenuTreeNode } from "@/types/menu";

// 请求序号：菜单管理页写完会立刻 refreshNav，若此时上一次 /nav 还在途，
// 旧响应可能后到并覆盖新结果。只让「最新一次请求」的响应落地。
let navReqSeq = 0;

/**
 * 摊平导航树为「准入路径集」。只做精确匹配，不做前缀匹配。
 *
 * 前缀匹配在这里是有害的：nav 是裁剪过的树，父节点的子节点可能因为权限被全部裁掉，
 * 于是它在 nav 里看起来就是叶子。若按叶子放行前缀，只有「首页」的账号访问
 * /home/system/menu 会因为 startsWith("/home/") 而通过 —— 裁剪越裁越松。
 * 改造前的硬编码判定里，前缀只作用于「有 children 的父节点下的子项」，
 * /home 这种顶层叶子不参与前缀匹配，所以那时这条路径是拒的。这里保持拒。
 */
export const collectNavPaths = (nodes: MenuTreeNode[]): Set<string> => {
  const paths = new Set<string>();
  const walk = (list: MenuTreeNode[]) => {
    for (const node of list) {
      paths.add(node.path);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return paths;
};

/**
 * 左侧菜单的唯一真源。每次布局挂载都会重新拉取（不做缓存短路）：
 * 菜单是权限视图，换账号登录后必须看到新账号的可见集，缓存它等于缓存越权判定。
 */
class MenuStore {
  nav: MenuTreeNode[] = [];
  navLoading = false;
  navLoaded = false;
  navError: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  fetchNav = async () => {
    const seq = ++navReqSeq;
    this.navLoading = true;
    this.navError = null;
    try {
      const res = await getMyMenus();
      if (seq !== navReqSeq) return;
      if (res.code === 200 && res.data) {
        this.nav = res.data;
        this.navLoaded = true;
      } else {
        this.navError = res.message || "获取菜单失败";
      }
    } catch (error: any) {
      if (seq !== navReqSeq) return;
      this.navError = error?.response?.data?.message || "获取菜单失败";
    } finally {
      if (seq === navReqSeq) this.navLoading = false;
    }
  };

  // 菜单管理页写成功之后调用，让侧边栏当场反映改动
  refreshNav = () => this.fetchNav();
}

export default MenuStore;
