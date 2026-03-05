# OpenFlomo

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-v2-blue" alt="Tauri">
  <img src="https://img.shields.io/badge/Vue-3-green" alt="Vue">
  <img src="https://img.shields.io/badge/TypeScript-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

> 开源笔记应用，Flomo (浮墨笔记) 的开源替代品

## 简介

OpenFlomo 是一个轻量级笔记和灵感管理工具，核心理念是「记录先于整理」—— 让你能够快速捕捉想法，通过回顾建立连接。

## 特性

- **快速记录**: 输入框支持 `#标签` 语法，自动提取标签
- **卡片展示**: 按时间倒序显示，支持双击编辑
- **多级标签**: 自动从内容中提取标签，支持多标签管理
- **标签筛选**: 侧边栏展示所有标签及数量，点击快速筛选
- **搜索功能**: 支持按内容和标签搜索
- **批量管理**: 支持批量选择和删除
- **热力图**: 可视化你的记录习惯
- **深色模式**: 支持浅色/深色模式切换
- **数据本地**: SQLite 本地存储，数据安全可控

## 技术栈

- **桌面框架**: Tauri v2
- **前端框架**: Vue 3 + TypeScript + Vite
- **UI 组件库**: PrimeVue (Aura 主题)
- **状态管理**: Pinia
- **数据库**: SQLite (via tauri-plugin-sql)
- **样式**: SCSS

## 快速开始

### 环境要求

- Node.js 18+
- Rust 1.70+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri dev
```

### 构建生产版本

```bash
npm run tauri build
```

## 项目结构

```
openflomo/
├── src/                      # 前端源码
│   ├── components/           # Vue 组件
│   │   ├── Layout/           # 布局组件
│   │   └── Memo/             # 备忘录组件
│   ├── views/                # 页面视图
│   ├── stores/               # Pinia 状态管理
│   ├── services/             # 数据库服务
│   ├── router/               # 路由配置
│   └── styles/               # 全局样式
├── src-tauri/                # Tauri 后端源码
│   └── src/
│       ├── main.rs           # 入口文件
│       └── lib.rs            # 插件配置
└── docs/                    # 项目文档
```

## 配置

### 更改应用名称

在 `src-tauri/tauri.conf.json` 中修改:

```json
{
  "productName": "YourAppName",
  "version": "1.0.0"
}
```

### 数据库位置

数据存储在系统应用数据目录:
- Windows: `%APPDATA%\com.openflomo.app\openflomo.db`
- macOS: `~/Library/Application Support/com.openflomo.app/`
- Linux: `~/.local/share/com.openflomo.app/`

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.1.0 (2026-03-06)

**新功能**
- 回收站功能：删除的 memo 进入回收站而非直接删除
- 回收站操作：支持恢复和彻底删除
- 自动清理：30天后自动清理回收站内容
- 手动刷新：侧边栏添加刷新按钮
- 自动刷新：窗口重新获得焦点时自动刷新数据

**优化**
- 统计显示优化：总记录包含回收站数量
- 回收站界面：添加浅黄色背景区分

**修复**
- 修复数据库初始化缺少 deleted_at 字段问题
- 修复回收站选中背景色显示问题
- 修复点击回收站后标签状态未清除问题

### v1.0.1 (2026-03-05)

**新功能**
- 设置页面：添加关于页面，显示作者（奶茶不加冰）和技术支持
- 设置页面：支持导出数据为 JSON 文件（使用系统文件对话框）
- 设置页面：支持从 JSON 文件导入数据

**优化**
- 侧边栏优化：标签按使用次数排序
- 侧边栏优化：热力图显示在标签列表上方
- 侧边栏优化：仅标签列表区域可滚动，标题保持固定
- 侧边栏优化：设置按钮移至标题区域
- 首页布局优化：输入框自适应高度，超出后内部滚动
- 首页布局优化：已保存的 memo 列表独立滚动
- 首页布局优化：全屏模式下左右留白
- 输入优化：智能列表功能，连续输入 `-` 或 `*` 自动延续列表
- 输入优化：修复标签正则，不误识别 `# 1` 这类格式

**修复**
- 修复标签输入时正则表达式误 stripping 问题

## 许可证

MIT License
