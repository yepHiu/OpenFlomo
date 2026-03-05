<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useMemoStore } from './stores/memoStore'
import { useSettingsStore } from './stores/settingsStore'

const memoStore = useMemoStore()
const settingsStore = useSettingsStore()

const isDev = import.meta.env.DEV

// 窗口重新获得焦点时刷新数据
function handleVisibilityChange() {
  if (!document.hidden) {
    memoStore.fetchMemos()
  }
}

onMounted(async () => {
  // 应用保存的主题
  settingsStore.applyTheme()
  await memoStore.fetchMemos()

  // 监听窗口可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <router-view />
  <!-- 开发模式水印 -->
  <div v-if="isDev" class="dev-watermark">DEV</div>
</template>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
}

/* 开发模式水印 */
.dev-watermark {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 8px 16px;
  background: rgba(255, 152, 0, 0.9);
  color: white;
  font-weight: bold;
  font-size: 14px;
  border-radius: 4px;
  pointer-events: none;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>
