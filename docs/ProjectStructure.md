# OpenFlomo 项目结构文档

> 记录项目目录结构、代码架构和技术栈信息。

**文档版本**：v1.0
**更新日期**：2026-03-07

---

## 一、项目概述

OpenFlomo 是一个开源的轻量级笔记和灵感管理工具，是 Flomo (浮墨笔记) 的开源替代品。核心理念是「记录先行，整理后置」—— 让用户能够快速捕获想法，并通过回顾建立联系。

### 技术栈

| 类别 | 技术 |
|------|------|
| 桌面框架 | Tauri v2 |
| 前端框架 | Vue 3 + TypeScript + Vite |
| UI 组件库 | PrimeVue (Aura 主题) |
| 状态管理 | Pinia |
| 数据库 | SQLite (via tauri-plugin-sql) |
| 国际化 | vue-i18n |
| 样式 | SCSS |

---

## 二、目录结构

```
OpenFlomo/
├── .vscode/                 # VS Code 配置
│   └── extensions.json      # 推荐扩展
├── public/                  # 静态资源
│   ├── tauri.svg           # Tauri 图标
│   ├── vite.svg            # Vite 图标
│   └── version.json        # 版本号配置
├── src/                    # 前端源代码
│   ├── assets/             # 资源文件
│   │   └── vue.svg
│   ├── components/         # Vue 组件
│   │   ├── DataModal.vue       # 数据导入导出弹窗
│   │   ├── Layout/             # 布局组件
│   │   │   ├── Heatmap.vue     # 热力图组件
│   │   │   └── TagSidebar.vue  # 标签侧边栏
│   │   └── Memo/               # 笔记相关组件
│   │       ├── MemoCard.vue        # 笔记卡片
│   │       ├── MemoEditDialog.vue  # 编辑弹窗
│   │       ├── MemoInput.vue       # 输入组件
│   │       └── MemoList.vue       # 列表组件
│   ├── composables/        # Vue Composables
│   │   └── useToast.ts    # Toast 通知封装
│   ├── i18n/              # 国际化配置
│   │   └── index.ts       # vue-i18n 配置
│   ├── locales/            # 语言文件
│   │   ├── en.json        # 英语
│   │   ├── ja.json        # 日语
│   │   └── zh-CN.json     # 简体中文
│   ├── router/             # 路由配置
│   │   └── index.ts       # Vue Router 配置
│   ├── services/           # 服务层
│   │   └── database.ts    # SQLite 数据库服务
│   ├── stores/             # Pinia 状态管理
│   │   ├── memoStore.ts   # 笔记状态管理
│   │   └── settingsStore.ts # 设置状态管理
│   ├── styles/            # 样式文件
│   │   └── main.scss     # 全局样式
│   ├── utils/             # 工具函数
│   │   └── markdown.ts   # Markdown 解析
│   ├── views/             # 页面视图
│   │   ├── HomeView.vue  # 首页
│   │   └── SettingsView.vue # 设置页
│   ├── App.vue            # 根组件
│   ├── main.ts            # 应用入口
│   └── vite-env.d.ts     # Vite 类型定义
├── src-tauri/             # Tauri 后端 (Rust)
│   ├── src/
│   │   ├── main.rs       # Rust 入口
│   │   └── lib.rs        # Tauri 插件配置
│   ├── capabilities/      # 权限配置
│   │   └── default.json
│   ├── icons/             # 应用图标
│   ├── Cargo.toml        # Rust 依赖
│   ├── build.rs          # 构建脚本
│   └── tauri.conf.json   # Tauri 配置
├── docs/                  # 文档
│   ├── CrossPlatform.md  # 跨平台适配文档
│   ├── Optimization.md   # 代码优化建议
│   ├── PRD.md           # 产品需求文档
│   └── ProjectStructure.md # 本文档
├── scripts/               # 构建脚本
│   └── update-version.js # 版本号更新
├── package.json          # npm 配置
├── tsconfig.json         # TypeScript 配置
├── tsconfig.node.json    # Node TypeScript 配置
├── vite.config.ts        # Vite 配置
└── index.html           # HTML 入口
```

---

## 三、代码架构

### 3.1 前端架构 (Vue 3 + TypeScript)

```
src/
├── main.ts                 # 应用入口
│   ├── 配置 PrimeVue       # UI 框架
│   ├── 配置 Pinia         # 状态管理
│   ├── 配置 Router        # 路由
│   └── 配置 i18n          # 国际化
│
├── stores/                 # 状态管理 (Pinia)
│   ├── memoStore.ts       # 笔记状态
│   │   ├── memos[]       # 笔记列表
│   │   ├── selectedTag   # 选中标签
│   │   ├── search        # 搜索关键词
│   │   ├── isTrashMode   # 回收站模式
│   │   └── Actions:
│   │       ├── fetchMemos()
│   │       ├── addMemo()
│   │       ├── updateMemo()
│   │       ├── deleteMemo()
│   │       ├── restoreMemo()
│   │       └── batchDelete()
│   │
│   └── settingsStore.ts   # 设置状态
│       ├── isDarkMode    # 深色模式
│       ├── locale        # 当前语言
│       ├── version       # 版本号
│       └── isMac         # 是否 Mac
│
├── services/               # 服务层
│   └── database.ts        # SQLite 数据库
│       ├── getDb()       # 获取数据库连接
│       ├── getAllMemos() # 获取所有笔记
│       ├── createMemo()  # 创建笔记
│       ├── updateMemo()  # 更新笔记
│       ├── softDeleteMemo()    # 软删除
│       ├── permanentDeleteMemo() # 永久删除
│       ├── getTrashMemos()     # 获取回收站
│       ├── searchMemos()       # 搜索
│       ├── getHeatmapData()    # 热力图数据
│       ├── exportMemos()      # 导出
│       └── importMemos()      # 导入
│
├── components/             # UI 组件
│   ├── Memo/
│   │   ├── MemoInput.vue    # 输入框 (支持 #标签、-列表)
│   │   ├── MemoList.vue      # 列表展示
│   │   ├── MemoCard.vue     # 单条笔记卡片
│   │   └── MemoEditDialog.vue # 编辑弹窗
│   │
│   ├── Layout/
│   │   ├── TagSidebar.vue   # 左侧标签栏
│   │   └── Heatmap.vue      # 热力图
│   │
│   └── DataModal.vue       # 数据导入导出
│
└── views/                  # 页面视图
    ├── HomeView.vue        # 首页 (笔记列表 + 输入)
    └── SettingsView.vue    # 设置页面
```

### 3.2 后端架构 (Tauri + Rust)

```
src-tauri/
├── src/
│   ├── main.rs            # 应用入口，设置窗口
│   └── lib.rs             # 插件初始化
│       ├── tauri-plugin-sql   # SQLite 插件
│       ├── tauri-plugin-dialog # 文件对话框
│       ├── tauri-plugin-fs    # 文件系统
│       └── tauri-plugin-opener # 打开外部链接
│
└── tauri.conf.json        # Tauri 配置
    ├── app identifier
    ├── window settings     # 1000x700, min 800x600
    └── plugins config
```

### 3.3 数据模型

```typescript
// 笔记 (Memo)
interface Memo {
  id: number;           // 主键
  content: string;       // 内容
  tags: string;         // 标签 (逗号分隔)
  created_at: string;   // 创建时间 (ISO)
  updated_at: string;   // 更新时间 (ISO)
  deleted_at?: string;  // 删除时间 (软删除)
}

// 热力图数据
interface HeatmapItem {
  date: string;         // 日期 YYYY-MM-DD
  count: number;        // 记录数量
}

// 导出数据
interface ExportData {
  version: string;
  exportedAt: string;
  memos: {
    content: string;
    tags: string;
    created_at: string;
  }[];
}
```

---

## 四、路由配置

```typescript
// src/router/index.ts
const routes = [
  { path: '/', component: HomeView },
  { path: '/settings', component: SettingsView }
]
```

---

## 五、国际化 (i18n)

支持的语言：
- `zh-CN` - 简体中文
- `en` - English
- `ja` - 日本語

语言文件位置：`src/locales/*.json`

---

## 六、已实现功能

1. **快速记录** - 输入框支持 `#标签` 语法
2. **卡片列表** - 倒序显示笔记，相对时间标签
3. **多级标签** - 自动从内容中提取标签
4. **标签过滤** - 侧边栏显示所有标签及数量
5. **搜索** - 搜索内容和标签
6. **编辑/删除** - 点击编辑，删除时确认
7. **统计** - 总数、今日数量、热力图显示
8. **回收站** - 软删除，30天过期
9. **导出** - 导出为 JSON 或 Markdown 格式
10. **多语言** - 中文、英语、日语

---

## 七、构建命令

```bash
# 安装依赖
npm install

# 开发模式
npm run tauri dev

# 生产构建
npm run tauri build

# 仅类型检查
npm run build
```

---

## 八、数据库

- 开发环境: `openflomo_dev.db`
- 生产环境: `openflomo.db`
- 位置: `~/Library/Application Support/com.openflomo.app/`

---

## 九、修订记录

| 版本 | 日期 | 内容 |
|------|------|------|
| v1.0 | 2026-03版项目结构-07 | 初文档 |
