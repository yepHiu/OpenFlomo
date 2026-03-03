<script setup lang="ts">
import { useSettingsStore } from "../stores/settingsStore";
import { useRouter } from "vue-router";

const settingsStore = useSettingsStore();
const router = useRouter();

function goBack() {
  router.push("/");
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
            <i class="pi pi-info-circle"></i>
            <span>版本</span>
          </div>
          <span class="version">v1.0.0</span>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <i class="pi pi-heart"></i>
            <span>OpenFlomo</span>
          </div>
          <span class="desc">开源笔记应用</span>
        </div>
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
</style>
