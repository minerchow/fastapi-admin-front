import { Button, Layout, Menu, Spin } from "antd";
import type { MenuProps } from "antd";
import { observer } from "mobx-react";
import { Suspense, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import NoPermission from "../components/NoPermission";
import { useStore } from "@/store";
import { collectNavPaths } from "@/store/menu";
import type { MenuTreeNode } from "@/types/menu";

const { Sider, Content } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

// 有子节点的菜单是分组（不可点），叶子才挂 Link —— 与改造前的渲染规则一致，
// 但深度由服务端的树决定，不再限制为两层。
const toMenuItems = (nodes: MenuTreeNode[]): MenuItem[] =>
  nodes.map((node) => {
    const children = node.children ?? [];
    if (children.length > 0) {
      return {
        key: node.path,
        label: node.name,
        children: toMenuItems(children),
      };
    }
    return { key: node.path, label: <Link to={node.path}>{node.name}</Link> };
  });

const centerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 120,
};

function Index() {
  const location = useLocation();
  const { menuStore } = useStore();

  useEffect(() => {
    // 每次布局挂载都重新拉：菜单是按当前账号的权限裁剪出来的视图，不能缓存
    menuStore.fetchNav();
  }, [menuStore]);

  // 首次导航还没到手时既不显示菜单也不显示 NoPermission ——
  // 否则真能访问的页面会在请求在途时被闪一下拒绝。
  if (!menuStore.navLoaded) {
    const failed = !menuStore.navLoading && !!menuStore.navError;
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <Sider>
          <div style={centerStyle}>
            {failed ? (
              <div
                style={{
                  color: "#fff",
                  textAlign: "center",
                  padding: "0 16px",
                }}
              >
                <div style={{ marginBottom: 12 }}>{menuStore.navError}</div>
                <Button size="small" onClick={() => menuStore.fetchNav()}>
                  重试
                </Button>
              </div>
            ) : (
              <Spin />
            )}
          </div>
        </Sider>
        <Content style={{ padding: "24px" }}>
          <div style={centerStyle}>
            <Spin size="default" />
          </div>
        </Content>
      </Layout>
    );
  }

  // 准入白名单 = 导航树里出现过的路径，精确匹配。
  const pathname = location.pathname;
  const hasPermission = collectNavPaths(menuStore.nav).has(pathname);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider>
        <Menu
          theme="dark"
          mode="inline"
          items={toMenuItems(menuStore.nav)}
          selectedKeys={[pathname]}
        />
      </Sider>
      <Content style={{ padding: "24px" }}>
        {hasPermission ? (
          <Suspense
            fallback={<Spin size="default" style={{ margin: "20px 0" }} />}
          >
            <Outlet />
          </Suspense>
        ) : (
          <NoPermission />
        )}
      </Content>
    </Layout>
  );
}

export default observer(Index);
