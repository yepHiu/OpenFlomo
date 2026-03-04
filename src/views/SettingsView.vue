<script setup lang="ts">
import { ref } from "vue";
import { useSettingsStore } from "../stores/settingsStore";
import { useRouter } from "vue-router";
import { exportMemos, importMemos, type ExportData } from "../services/database";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

const settingsStore = useSettingsStore();
const router = useRouter();
const isExporting = ref(false);
const isImporting = ref(false);

function goBack() {
  router.push("/");
}

// 导出 memo
async function handleExport() {
  if (isExporting.value) return;
  isExporting.value = true;

  try {
    const data = await exportMemos();
    const jsonStr = JSON.stringify(data, null, 2);

    // 使用系统对话框选择保存位置
    const filePath = await save({
      defaultPath: `openflomo-export-${new Date().toISOString().split("T")[0]}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (filePath) {
      await writeTextFile(filePath, jsonStr);
      alert(`导出成功，共 ${data.memos.length} 条记录`);
    }
  } catch (e) {
    console.error("Export failed:", e);
    alert("导出失败: " + e);
  } finally {
    isExporting.value = false;
  }
}

// 导入 memo
async function handleImport() {
  if (isImporting.value) return;
  isImporting.value = true;

  try {
    // 使用系统对话框选择文件
    const filePath = await open({
      filters: [{ name: "JSON", extensions: ["json"] }],
      multiple: false,
    });

    if (!filePath) {
      isImporting.value = false;
      return;
    }

    // 读取文件内容
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    const text = await readTextFile(filePath as string);
    const data: ExportData = JSON.parse(text);

    if (!data.version || !data.memos) {
      throw new Error("无效的文件格式");
    }

    const count = await importMemos(data);
    alert(`导入成功，共 ${count} 条记录`);

    // 刷新页面以更新数据
    window.location.reload();
  } catch (e) {
    console.error("Import failed:", e);
    alert("导入失败: " + e);
  } finally {
    isImporting.value = false;
  }
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-header">
      <button class="back-btn" @click="goBack">
        <i class="pi pi-arrow-left"></i>
      </button>
      <h1>设置</h1>
    </div>

    <div class="settings-content">
      <div class="settings-section">
        <h2>外观</h2>
        <div class="setting-item">
          <div class="setting-info">
            <i class="pi pi-moon"></i>
            <span>深色模式</span>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              :checked="settingsStore.isDarkMode"
              @change="settingsStore.toggleDarkMode()"
            />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <h2>关于</h2>
        <div class="setting-item">
          <div class="setting-info">
            <i class="pi pi-user"></i>
            <span>作者</span>
          </div>
          <span class="version">奶茶不加冰</span>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <i class="pi pi-code"></i>
            <span>Powered by</span>
          </div>
          <span class="version">MiniMax-M2.5 + Claude Code</span>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <i class="pi pi-heart"></i>
            <span>OpenFlomo</span>
          </div>
          <span class="desc">开源笔记应用</span>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <i class="pi pi-info-circle"></i>
            <span>版本</span>
          </div>
          <span class="version">v1.0.1</span>
        </div>
      </div>

      <div class="settings-section">
        <h2>数据管理</h2>
        <div class="data-actions">
          <button class="btn-export" @click="handleExport" :disabled="isExporting">
            <i class="pi pi-download"></i>
            <span>{{ isExporting ? "导出中..." : "导出数据" }}</span>
          </button>
          <button class="btn-import" @click="handleImport" :disabled="isImporting">
            <i class="pi pi-upload"></i>
            <span>{{ isImporting ? "导入中..." : "导入数据" }}</span>
          </button>
        </div>
        <p class="data-hint">导出将保存为 JSON 文件，导入支持 JSON 格式</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;

  .back-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: var(--surface-card);
    border-radius: var(--border-radius);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color);
    transition: background-color 0.2s;

    &:hover {
      background: var(--surface-ground);
    }

    i {
      font-size: 18px;
    }
  }

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-section {
  background: var(--surface-card);
  border-radius: var(--border-radius);
  padding: 16px;

  h2 {
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: var(--border-radius-sm);
  transition: background-color 0.2s;

  &:hover {
    background: var(--surface-ground);
  }

  .setting-info {
    display: flex;
    align-items: center;
    gap: 12px;

    i {
      font-size: 18px;
      color: var(--primary-color);
    }

    span {
      font-size: 15px;
    }
  }

  .version,
  .desc {
    font-size: 14px;
    color: var(--text-color-secondary);
  }
}

// 开关样式
.toggle {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--surface-border);
    transition: 0.3s;
    border-radius: 26px;

    &:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
  }

  input:checked + .slider {
    background-color: var(--primary-color);
  }

  input:checked + .slider:before {
    transform: translateX(22px);
  }
}

// 数据管理按钮
.data-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.btn-export,
.btn-import {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;

  i {
    font-size: 16px;
  }
}

.btn-export {
  background: linear-gradient(135deg, #4FC3F7 0%, #29b6f6 100%);
  color: white;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #29b6f6 0%, #0288d1 100%);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-import {
  background: linear-gradient(135deg, #81C784 0%, #66bb6a 100%);
  color: white;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #66bb6a 0%, #4caf50 100%);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.data-hint {
  margin: 0;
  font-size: 12px;
  color: var(--text-color-secondary);
  text-align: center;
}
</style>
