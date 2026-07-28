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
- **路由**: React Router v8，使用 `createHashRouter` 哈希路由（适配 GitHub Pages）
- **状态管理**: Zustand v5
- **样式**: Tailwind CSS v4（通过 `@import "tailwindcss"` 导入，零配置）
- **组件库**: shadcn/ui v4（base-ui 渲染，非 Radix）
- **包管理**: pnpm
- **部署**: GitHub Pages + GitHub Actions（`.github/workflows/deploy.yml`）

## 架构要点

### React Compiler（已启用）

项目启用了 `babel-plugin-react-compiler`（React 19 的自动记忆化编译器）。这意味着：
- 组件不再需要手动 `useMemo`、`useCallback`、`React.memo`
- 编译器自动分析并优化重新渲染
- 需遵守 [React Compiler 规则](https://react.dev/learn/react-compiler)（不能违反 hooks 规则、不能使用过时的 API）

### 入口与应用结构

- `index.html` → `src/main.tsx`：应用入口，在此创建路由并挂载到 `#root`
- `src/App.tsx`：首页，展示所有工具入口卡片
- `src/components/Navbar.tsx`：全局固定导航栏，包含工具菜单
- `src/components/Layout.tsx`：布局组件（Navbar + Outlet）
- 路由定义在 `main.tsx` 中，使用 `createHashRouter` + `<RouterProvider>`
- 每个工具页面放在 `src/tools/<name>/index.tsx`

### 样式

- `src/App.css` 包含 `@import "tailwindcss"`、`tw-animate-css`、shadcn 主题
- Tailwind v4 使用 CSS 优先的配置方式，没有 `tailwind.config.js`
- 文本输入框统一使用 `<textarea>` + `border border-border`，不使用 shadcn Textarea（底部边框问题）
- 输出框使用 `bg-muted/50` + `border border-border`

### TypeScript 配置

- `tsconfig.app.json`：应用源码配置（target: es2023，bundler 模式解析）
- `tsconfig.node.json`：Vite 配置文件专用（NodeNext 模块解析）
- 根 `tsconfig.json` 包含 `baseUrl` + `paths`（shadcn CLI 要求）
- 已启用严格检查：`noUnusedLocals`、`noUnusedParameters`、`erasableSyntaxOnly`

## 工具页面创建流程

添加新工具需要修改 5 个文件：

1. **`src/tools/<name>/index.tsx`** — 工具页面组件
2. **`src/main.tsx`** — 添加路由（`import` + route 配置）
3. **`src/components/Navbar.tsx`** — 添加 `toolsLinks` 数组项
4. **`src/App.tsx`** — 添加首页入口卡片
5. **`README.md`** — 添加工具链接

## Vite 别名配置

部分 npm 包的 `package.json` 中 `browser` 字段指向 UMD 构建，Vite 会优先使用 UMD 而非 ESM，导致运行时错误。需在 `vite.config.ts` 中强制指定 ESM 路径：

```ts
resolve: {
  alias: {
    pinyin: path.resolve(__dirname, './node_modules/pinyin/lib/esm/pinyin.js'),
    xmorse: path.resolve(__dirname, './node_modules/xmorse/esm/index.js'),
  },
},
```

## 已安装的第三方工具库

| 库 | 用途 | 工具页面 |
|---|---|---|
| `opencc-js` | 简繁中文转换 | 简繁转换 |
| `pinyin` | 汉字转拼音 | 汉字转拼音 |
| `easyqrcodejs` | 二维码生成 | 二维码生成器 |
| `xmorse` | 摩斯电码编解码 | 摩斯电码 |
| `cron-parser` | Cron 表达式解析 | Crontab 计算 |
| `js-yaml` | YAML 解析/序列化 | JSON ⇄ YAML |
| `nzh` | 中文数字转换 | 中文数字转换 |

## 编码规范

- 始终使用中文回复用户
- 每个工具页面自包含，不跨目录引用其他工具的实现细节
- `src/tools/encode-decode/utils.ts` 中的 `computeHash`（MD5/SHA）是公共工具函数，可跨工具引用
- 文本区域统一样式：输入 `border border-border bg-transparent`，输出 `border border-border bg-muted/50`

## 强制规则

- **禁止擅自创建新功能**：只有在用户明确提出需求时才能新建工具页面、安装 npm 包或添加功能代码。不要主动「预判」或「联想」下一步工作。上一次任务完成后，若用户没有新指令，就停下来等待。
