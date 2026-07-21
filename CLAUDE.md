# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
pnpm dev          # 启动开发服务器（HMR）
pnpm build        # 类型检查 + 生产构建
pnpm lint         # oxlint 代码检查
pnpm preview      # 预览生产构建
```

## 技术栈

- **运行时**: React 19 + TypeScript 6 + Vite 8（ESM 模块）
- **路由**: React Router v8，使用 `createBrowserRouter` 数据路由模式
- **状态管理**: Zustand v5
- **样式**: Tailwind CSS v4（通过 `@import "tailwindcss"` 导入，零配置）
- **包管理**: pnpm

## 架构要点

### React Compiler（已启用）

项目启用了 `babel-plugin-react-compiler`（React 19 的自动记忆化编译器）。这意味着：
- 组件不再需要手动 `useMemo`、`useCallback`、`React.memo`
- 编译器自动分析并优化重新渲染
- 需遵守 [React Compiler 规则](https://react.dev/learn/react-compiler)（不能违反 hooks 规则、不能使用过时的 API）

### 入口与应用结构

- `index.html` → `src/main.tsx`：应用入口，在此创建路由并挂载到 `#root`
- `src/App.tsx`：根路由组件
- 路由定义在 `main.tsx` 中，使用 `createBrowserRouter` + `<RouterProvider>`（React Router v8 的 DOM 渲染方式）

### 样式

- `src/App.css` 仅包含 `@import "tailwindcss"`，引入 Tailwind v4
- Tailwind v4 使用 CSS 优先的配置方式，没有 `tailwind.config.js`
- 全局重置样式在 `src/index.css`（目前仅重置 body margin）

### TypeScript 配置

- `tsconfig.app.json`：应用源码配置（target: es2023，bundler 模式解析）
- `tsconfig.node.json`：Vite 配置文件专用（NodeNext 模块解析）
- 已启用严格检查：`noUnusedLocals`、`noUnusedParameters`、`erasableSyntaxOnly`
