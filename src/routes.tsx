import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

// 使用React.lazy()懒加载所有组件
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const UserList = lazy(() => import("./pages/users/list"));
const UserAdd = lazy(() => import("./pages/users/add"));
const RoleList = lazy(() => import("./pages/roles/list"));
const PermissionList = lazy(() => import("./pages/permissions/list"));
const MenuList = lazy(() => import("./pages/menus/list"));
const NoPermission = lazy(() => import("./components/NoPermission"));
const Home = lazy(() => import("./pages/home"));
const Count = lazy(() => import("./pages/count"));
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Index />,
    children: [
      {
        path: "", // 根路径重定向到首页
        element: <Navigate to="/home" replace />,
      },
      {
        path: "home", // 对应/home路径
        element: <Home />,
      },
      // 用户列表路由
      {
        path: "home/user/list",
        element: <UserList />,
      },
      // 添加用户路由
      {
        path: "home/user/add",
        element: <UserAdd />,
      },
      // 角色管理路由
      {
        path: "home/system/role",
        element: <RoleList />,
      },
      // 权限管理路由
      {
        path: "home/system/permission",
        element: <PermissionList />,
      },
      // 菜单管理路由
      {
        path: "home/system/menu",
        element: <MenuList />,
      },
      // 添加通配符路由，处理未定义的路径
      {
        path: "*",
        element: <NoPermission />,
      },
    ],
  },
  {
    path: "/count",
    element: <Count />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
];
