# OpenFlomo 跨平台适配文档

> 记录项目在 macOS、Windows、Linux 平台上的适配与优化项。

**文档版本**：v1.1
**更新日期**：2026-03-06

---

## 一、当前状态

### 已正确处理的跨平台部分

| 项目 | 状态 | 说明 |
|------|------|------|
| 数据存储路径 | ✅ | 使用 `app.path().app_data_dir()` 跨平台兼容 |
| 文件路径分隔符 | ✅ | 使用 `split(/[/\\])` 兼容 Win/Mac |
| 快捷键检测 | ✅ | 使用 `event.ctrlKey \|\| event.metaKey` |
| SQLite 数据库 | ✅ | 跨平台兼容 |
| Tauri 框架 | ✅ | 本身跨平台 |

---

## 二、需要优化的跨平台问题

### 2.1 快捷键提示硬编码

| 项目 | 内容 |
|------|------|
| **优先级** | 高 |
| **位置** | `src/components/Memo/MemoInput.vue` |
| **问题** | 硬编码显示 "Ctrl + Enter 发送"，Mac 用户应显示 "Cmd + Enter" |
| **优化方案** | 动态检测平台显示对应快捷键 |
| **状态** | ✅ 已完成 |

**优化代码**：
```typescript
// 检测操作系统
const isMac = computed(() => {
  return typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
});

// 快捷键提示
const shortcutHint = computed(() => isMac.value ? 'Cmd + Enter' : 'Ctrl + Enter');
```

---

### 2.2 缺少系统主题检测

| 项目 | 内容 |
|------|------|
| **优先级** | 中 |
| **位置** | `src/stores/settingsStore.ts` |
| **问题** | 只从 localStorage 读取主题设置，没有检测系统主题偏好 |
| **优化方案** | 添加 `prefers-color-scheme` 监听，自动跟随系统主题 |
| **状态** | ✅ 已完成 |

**优化代码**：
```typescript
// 优先使用用户设置，否则跟随系统
const isDarkMode = ref(storedTheme ? storedTheme === "dark" : systemPrefersDark);

// 监听系统主题变化
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if (!localStorage.getItem("theme")) {
    isDarkMode.value = e.matches;
    applyTheme();
  }
});
```

---

### 2.3 Tauri 配置不完整

| 项目 | 内容 |
|------|------|
| **优先级** | 中 |
| **位置** | `src-tauri/tauri.conf.json` |
| **问题** | 缺少 Windows/Linux 特定配置，macOS 窗口效果可优化 |
| **优化方案** | 完善各平台配置 |

**优化配置示例**：
```json
{
  "app": {
    "windows": [
      {
        "title": "OpenFlomo",
        "width": 1000,
        "height": 700,
        "minWidth": 800,
        "minHeight": 600,
        "center": true,
        "resizable": true,
        "decorations": true,
        "transparent": false,
        "backdrop": "macos"
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis", "dmg", "app", "deb", "rpm", "appimage"],
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": ""
    },
    "macOS": {
      "minimumSystemVersion": "10.15"
    },
    "linux": {
      "appimage": {
        "bundleMediaFramework": false
      }
    }
  }
}
```

---

### 2.4 缺少系统级功能

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 系统托盘 | 中 | Windows/Linux 常用，macOS 可选 |
| 全局快捷键 | 中 | 快速唤起应用 |
| 系统通知 | 低 | 记录成功/回收站清理提醒 |
| 自动更新 | 低 | Tauri 内置 updater 插件 |

---

### 2.5 语言检测

| 项目 | 内容 |
|------|------|
| **优先级** | 低 |
| **位置** | `src/i18n/index.ts` |
| **问题** | 没有自动检测系统语言并设置默认语言 |
| **优化方案** | 添加系统语言检测逻辑 |

---

## 三、优化计划

### 第一阶段：快速修复 ✅ 已完成

| 编号 | 任务 | 预计时间 | 状态 |
|------|------|----------|------|
| P1-1 | 修复快捷键提示显示 | 0.5h | ✅ |
| P1-2 | 添加系统主题自动检测 | 1h | ✅ |

### 第二阶段：配置完善

| 编号 | 任务 | 预计时间 |
|------|------|----------|
| P2-1 | 完善 tauri.conf.json 各平台配置 | 1h |
| P2-2 | 添加平台特定图标 | 1h |
| P2-3 | 配置正确的 bundle targets | 0.5h |

### 第三阶段：功能增强

| 编号 | 任务 | 预计时间 |
|------|------|----------|
| P3-1 | 添加系统托盘功能 | 2h |
| P3-2 | 添加全局快捷键 | 2h |
| P3-3 | 添加系统通知 | 2h |
| P3-4 | 集成自动更新 | 2h |

---

## 四、平台数据存储位置

| 平台 | 数据目录 |
|------|----------|
| **macOS** | `~/Library/Application Support/com.openflomo.app/` |
| **Windows** | `%APPDATA%\com.openflomo.app\` |
| **Linux** | `~/.local/share/com.openflomo.app/` |

---

## 五、平台特性对照表

| 特性 | macOS | Windows | Linux |
|------|-------|---------|-------|
| 标题栏 | ✅ 原生 | ✅ 原生 | ✅ 原生 |
| 窗口阴影 | ✅ 系统 | ✅ 系统 | ❌ 无 |
| 毛玻璃效果 | ✅ | ❌ | ❌ |
| 系统托盘 | ⚠️ 可选 | ✅ 常用 | ✅ 常用 |
| 自动更新 | ✅ | ✅ | ✅ |
| DMG 安装 | ✅ | ❌ | ❌ |
| MSI/NSIS | ❌ | ✅ | ❌ |
| AppImage/deb | ❌ | ❌ | ✅ |

---

## 六、修订记录

| 版本 | 日期 | 修订内容 |
|------|------|----------|
| v1.0 | 2026-03-06 | 初版：跨平台适配分析与优化计划 |
| v1.1 | 2026-03-06 | 完成 P1-1 快捷键提示动态显示、P1-2 系统主题检测 |
