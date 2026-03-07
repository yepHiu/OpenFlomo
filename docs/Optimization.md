# OpenFlomo 代码优化建议文档

> 记录项目代码中需要优化的地方及改进建议。

**文档版本**：v1.3
**更新日期**：2026-03-08

---

## 一、代码质量优化

### 1.1 硬编码文本（多语言未覆盖）

| 优先级 | 文件 | 问题描述 | 建议 | 状态 |
|--------|------|----------|------|------|
| **高** | `src/stores/memoStore.ts` | `confirm()` 使用硬编码中文文本 | 使用 i18n | ✅ 已完成 |
| **高** | `src/components/Memo/MemoCard.vue` | 大量硬编码中文文本 | 使用 i18n | ✅ 已完成 |
| **高** | `src/components/Memo/MemoEditDialog.vue` | 硬编码中文文本 | 使用 i18n | ✅ 已完成 |
| **高** | `src/components/Memo/MemoList.vue` | 硬编码中文文本 | 使用 i18n | ✅ 已完成 |
| **高** | `src/components/DataModal.vue` | 硬编码中文文本 | 使用 i18n | ✅ 已完成 |
| **高** | `src/views/HomeView.vue` | 硬编码中文文本 | 使用 i18n | ✅ 已完成 |
| **高** | `src/components/Layout/TagSidebar.vue` | 硬编码中文文本 | 使用 i18n | ✅ 已完成 |

---

### 1.2 生产环境日志

| 优先级 | 文件 | 问题描述 | 建议 |
|--------|------|----------|------|
| **中** | `src/services/database.ts` | 大量 `console.log` | 生产环境移除或使用条件日志 |
| **中** | `src/stores/memoStore.ts` | 大量 `console.log` | 生产环境移除或使用条件日志 |

---

### 1.3 性能优化

| 优先级 | 位置 | 问题描述 | 建议 |
|--------|------|----------|------|
| **中** | `src/stores/memoStore.ts` | 批量删除/恢复使用 for 循环串行执行 | 使用 `Promise.all` 并行执行 |
| **中** | `src/views/HomeView.vue` | 搜索无防抖处理 | 添加 debounce (300-500ms) |
| **低** | `src/components/Layout/Heatmap.vue` | 热力图计算可考虑缓存 | 使用 `computed` 已有，考虑虚拟滚动 |

---

### 1.4 错误处理

| 优先级 | 位置 | 问题描述 | 建议 |
|--------|------|----------|------|
| **中** | `src/stores/memoStore.ts` | 使用 `alert()` 展示错误 | 使用统一的错误提示组件或 Toast |
| **中** | `src/services/database.ts` | 使用 `alert()` 展示错误 | 使用统一的错误提示组件或 Toast |
| **低** | 全局 | 缺少全局错误边界 | 添加 Vue errorHandler |

---

## 二、架构优化

### 2.1 类型安全

| 优先级 | 问题描述 | 建议 |
|--------|----------|------|
| **中** | 部分 `any` 类型 | 明确类型定义 |
| **低** | `database.ts` 返回类型可优化 | 统一使用 `Result<T>` 模式 |

### 2.2 代码复用

| 优先级 | 问题描述 | 建议 |
|--------|----------|------|
| **中** | 标签提取逻辑重复 (`MemoInput`, `MemoCard`, `database.ts`) | 抽取为 `utils/tag.ts` |
| **中** | 日期格式化重复 | 抽取为 `utils/date.ts` |

---

## 三、用户体验优化

### 3.1 加载状态

| 优先级 | 位置 | 问题描述 | 建议 |
|--------|------|----------|------|
| **低** | 全局 | 缺少骨架屏/加载动画 | 添加 Loading 组件 |
| **低** | 批量操作 | 无操作反馈 | 添加操作中的 loading 状态 |

### 3.2 空状态

| 优先级 | 位置 | 问题描述 | 建议 |
|--------|------|----------|------|
| **低** | 搜索无结果 | 显示较单调 | 优化空状态展示 |

---

## 四、安全优化

| 优先级 | 问题描述 | 建议 |
|--------|----------|------|
| **中** | `tauri.conf.json` 中 `csp: null` | 根据需要配置 CSP |

---

## 五、待修复清单

### 高优先级 ✅ 已完成

| 编号 | 任务 | 文件 | 状态 |
|------|------|------|------|
| P1 | memoStore confirm 国际化 | src/stores/memoStore.ts | ✅ |
| P2 | MemoCard 组件文本国际化 | src/components/Memo/MemoCard.vue | ✅ |
| P3 | MemoEditDialog 组件文本国际化 | src/components/Memo/MemoEditDialog.vue | ✅ |
| P4 | MemoList 组件文本国际化 | src/components/Memo/MemoList.vue | ✅ |
| P5 | DataModal 组件文本国际化 | src/components/DataModal.vue | ✅ |
| P6 | HomeView 组件文本国际化 | src/views/HomeView.vue | ✅ |
| P11 | TagSidebar 组件文本国际化 | src/components/Layout/TagSidebar.vue | ✅ |

### 中优先级

| 编号 | 任务 | 文件 | 状态 |
|------|------|------|------|
| P7 | 移除/条件化 console.log | src/services/database.ts | ✅ |
| P8 | 移除/条件化 console.log | src/stores/memoStore.ts | ✅ |
| P9 | 批量操作并行化 | src/stores/memoStore.ts | ✅ |
| P10 | 搜索添加 debounce | src/views/HomeView.vue | ✅ |
| P12 | 替换 alert 为 Toast | 多个文件 | ✅ (无 alert 需替换) |

### 低优先级

| 编号 | 任务 | 文件 |
|------|------|------|
| P13 | 抽取标签提取工具函数 | utils/tag.ts |
| P14 | 抽取日期格式化工具函数 | utils/date.ts |
| P15 | 配置 CSP | src-tauri/tauri.conf.json |

---

## 六、修订记录

| 版本 | 日期 | 修订内容 |
|------|------|----------|
| v1.0 | 2026-03-07 | 初版：代码优化建议清单 |
| v1.1 | 2026-03-07 | 完成 P1-P6 高优先级国际化任务 |
| v1.2 | 2026-03-07 | 完成 P11 TagSidebar 国际化；添加日语支持 |
| v1.3 | 2026-03-08 | 完成 P7-P10, P12 中优先级优化任务 |
