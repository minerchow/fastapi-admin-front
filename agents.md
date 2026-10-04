# AGENTS.md

FastAPI 后端配套的后台管理系统前端（fastapi-admin-front）。

## 技术栈

- **构建**: Rsbuild（Rspack 内核）+ React 18.3 + TypeScript 5.7（strict 模式）
- **UI**: Ant Design 5 + Sass（`@rsbuild/plugin-sass`）
- **状态管理**: MobX 6（`makeAutoObservable`）+ `mobx-react` Provider
- **路由**: react-router-dom 6.28，全部页面 `React.lazy` 懒加载
- **请求**: axios 封装（`src/utils/http.ts`）
- **React Compiler**: 通过 babel 插件启用自动 memo 编译
- 包管理：仓库中同时存在 pnpm 与 npm lock 文件，本机 Windows + Git Bash 环境

## 常用命令

```bash
npm run dev          # 开发服务器（CROSS_ENV=dev），/api 代理到 http://127.0.0.1:8000
npm run build:test   # 测试环境构建（CROSS_ENV=test）
npm run build:prod   # 生产构建（CROSS_ENV=production，移除 console）
npm run type-check   # tsc --noEmit
npm run lint         # eslint src（.ts/.tsx）
npm run check        # type-check + lint + build:test，提交前跑这个
npm run format       # prettier --write
```

## 目录结构

```
src/
├── index.tsx        # 入口：ReactDOM.createRoot + StrictMode
├── App.tsx          # Provider(rootStore) + BrowserRouter + useRoutes
├── routes.tsx       # 路由表（lazy 加载），/ 下嵌套 Index 布局
├── pages/           # 页面组件；users/ 下为用户管理子页面
│   └── Index.tsx    # Layout：Sider 菜单（读 MenuStore）+ Content，按 nav 路径做白名单准入
├── components/      # 通用组件（NoPermission、count/ 示例等）
├── api/             # 接口层：按模块组织，只调 utils/http 的 get/post/put
├── store/           # MobX：RootStore 聚合 countStore/userStore/menuStore，单例导出
├── types/           # TS 类型：base.ts 定义 ApiResponse/分页等通用响应结构
├── utils/           # http.ts（axios 封装）、auth.ts（token 管理）、cookie.ts
└── config/          # common.ts（baseUrl）、routePaths.ts（从 routes.tsx 派生可选路由）、permissionGroup.ts（权限分组）
```

## 核心架构约定

### 请求层（src/utils/http.ts）

- 统一 axios 实例，`baseURL` 由 `config/common.ts` 的 `baseUrl()` 决定；dev/test 环境返回空串走 dev 代理。
- 响应拦截器直接返回 `response.data`，因此 API 层拿到的就是后端 JSON 体（`ApiResponse<T>` 结构：`{ code, msg, data }`）。
- **Token 机制**：access/refresh token 存 cookie（`utils/auth.ts`），JWT payload 解析 `exp`；请求前若 accessToken 距过期 < 5 分钟自动用 refreshToken 刷新，并发请求共享同一次刷新（`refreshPromise` 单飞）。401 时用 refreshToken 重试一次，仍失败则 `logout()` 并跳转 `/login`。
- 免登录接口在 api 层传 `config: { noToken: true }`。
- 新增接口：在 `src/api/` 按模块添加函数，入参/返回类型放 `src/types/`，不要直接 import axios。

### 状态管理（src/store/）

- `RootStore` 聚合各子 store，`App.tsx` 用 `mobx-react` 的 `Provider` 注入；组件用 `@inject`/`observer` 或 `useStore()` hook 访问。
- 登录用户信息持久化在 `sessionStorage`，token 在 cookie（见 auth.ts）。

### 路由与权限

- 路由集中在 `src/routes.tsx`，均需 `lazy()`。
- 左侧菜单由后端驱动：`store/menu.ts` 的 `MenuStore` 拉 `GET /api/menus/nav`（按当前用户权限裁剪过的树），`pages/Index.tsx` 渲染它。页面准入是**路径精确匹配白名单**（不做前缀匹配：nav 是裁剪过的树，「子节点被裁光的父节点」看起来像叶子，前缀匹配会放大权限），不在白名单的路由渲染 `NoPermission`。
- 菜单行在「菜单管理」页（`/home/system/menu`）维护，`icon` 字段暂未接前端。新增受控页面需两步：`routes.tsx` 加路由 + 菜单管理页加一行（路径下拉的候选由 `config/routePaths.ts` 遍历 `routes.tsx` 导出算出，是唯一真源，不要再建常量表）。

### 路径别名

- `@` → `src/`（tsconfig paths + rsbuild alias），新代码统一用 `@/xxx` 导入。

## 代码风格

- Prettier 格式化 + ESLint（react-hooks、typescript-eslint），提交时 lint-staged 自动处理。
- 组件函数式写法；业务注释多为中文。
- 环境区分靠 `process.env.CROSS_ENV`（rsbuild `source.define` 注入），不要引入 `.env` 方案。

## 注意事项

- `config/common.ts` 与 `api/kpi-report.ts` 中存在占位 URL（`xxx`），属未完成配置，改动时保持空串/占位逻辑由用户确认。
- 后端为 FastAPI（默认 8000 端口），接口前缀 `/api`；登录相关接口：`/api/users/login|register|refresh|info`。
