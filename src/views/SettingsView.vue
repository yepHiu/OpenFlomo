<script setup lang="ts">
import { ref } from "vue";
import { useSettingsStore } from "../stores/settingsStore";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import DataModal from "../components/DataModal.vue";
import Dropdown from "primevue/dropdown";

const settingsStore = useSettingsStore();
const router = useRouter();
const { t } = useI18n();
const showDataModal = ref(false);

// 语言选项
const languages = ref([
  { value: 'zh-CN', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' }
]);

function goBack() {
  router.push("/");
}

function handleLanguageChange(value: string) {
  settingsStore.setAppLocale(value as 'zh-CN' | 'en' | 'ja');
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-header">
      <button class="back-btn" @click="goBack">
        <i class="pi pi-arrow-left"></i>
      </button>
      <h1>{{ t('app.settings') }}</h1>
    </div>

    <div class="settings-content">
      <!-- 常规设置 -->
      <div class="settings-section">
        <h2>{{ t('settings.general') }}</h2>
        <div class="setting-item">
          <div class="setting-info">
            <i class="pi pi-power-off"></i>
            <span>{{ t('settings.autoStart') }}</span>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              :checked="settingsStore.isAutoStart"
              @change="settingsStore.toggleAutoStart()"
            />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- 外观设置 -->
      <div class="settings-section">
        <h2>{{ t('settings.appearance') }}</h2>
        <div class="setting-item">
          <div class="setting-info">
            <i class="pi pi-moon"></i>
            <span>{{ t('settings.darkMode') }}</span>
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
        <div class="setting-item">
          <div class="setting-info">
            <i class="pi pi-globe"></i>
            <span>{{ t('settings.language') }}</span>
          </div>
          <Dropdown
            :modelValue="settingsStore.locale"
            @update:modelValue="handleLanguageChange"
            :options="languages"
            optionLabel="label"
            optionValue="value"
            class="lang-dropdown"
          />
        </div>
      </div>

      <div class="settings-section">
        <h2>{{ t('settings.about') }}</h2>
        <div class="setting-item">
          <div class="setting-info">
            <i class="pi pi-user"></i>
            <span>{{ t('settings.author') }}</span>
          </div>
          <span class="version">奶茶不加冰</span>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <i class="pi pi-code"></i>
            <span>{{ t('settings.poweredBy') }}</span>
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
            <span>{{ t('settings.version') }}</span>
          </div>
          <span class="version">v{{ settingsStore.version }}</span>
        </div>
      </div>

      <div class="settings-section">
        <h2>{{ t('settings.dataManagement') }}</h2>
        <div class="data-manage-btn" @click="showDataModal = true">
          <div class="btn-icon">
            <i class="pi pi-database"></i>
          </div>
          <div class="btn-text">
            <span class="btn-title">{{ t('settings.importExport') }}</span>
            <span class="btn-desc">{{ t('settings.importExportDesc') }}</span>
          </div>
          <i class="pi pi-chevron-right arrow"></i>
        </div>
      </div>
    </div>

    <!-- 数据管理浮窗 -->
    <DataModal v-if="showDataModal" @close="showDataModal = false" />
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

// 语言选择器
.lang-dropdown {
  width: 140px;
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

// 导出选项样式
.export-option {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 13px;
    color: var(--text-color);
    margin-bottom: 8px;
    font-weight: 500;
  }
}

.format-select {
  display: flex;
  gap: 16px;

  .radio-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 14px;

    input[type="radio"] {
      accent-color: var(--primary-color);
    }
  }
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;

  input[type="date"] {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius-sm);
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--surface-ground);
    color: var(--text-color);
    color-scheme: light;

    &:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    &::-webkit-calendar-picker-indicator {
      cursor: pointer;
    }
  }

  span {
    color: var(--text-color-secondary);
    font-size: 13px;
  }
}

.date-hint {
  margin: 6px 0 0 0;
  font-size: 12px;
  color: var(--text-color-secondary);
}

.tag-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .tag-btn {
    padding: 6px 12px;
    border: 1px solid var(--surface-border);
    border-radius: 16px;
    background: var(--surface-ground);
    color: var(--text-color-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    &.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }
  }
}

.filter-actions {
  margin-bottom: 16px;

  .btn-clear {
    padding: 6px 12px;
    border: none;
    background: transparent;
    color: var(--text-color-secondary);
    font-size: 13px;
    cursor: pointer;

    &:hover {
      color: var(--primary-color);
    }
  }
}

// 数据管理入口按钮
.data-manage-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(79, 195, 247, 0.1);

    .arrow {
      transform: translateX(4px);
      color: var(--primary-color);
    }
  }

  .btn-icon {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #4FC3F7 0%, #29b6f6 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 20px;
      color: white;
    }
  }

  .btn-text {
    flex: 1;
    display: flex;
    flex-direction: column;

    .btn-title {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-color);
    }

    .btn-desc {
      font-size: 13px;
      color: var(--text-color-secondary);
      margin-top: 2px;
    }
  }

  .arrow {
    font-size: 16px;
    color: var(--text-color-secondary);
    transition: all 0.2s ease;
  }
}
</style>
