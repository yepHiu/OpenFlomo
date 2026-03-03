<script setup lang="ts">
import { onMounted } from 'vue'
import { useMemoStore } from './stores/memoStore'
import { useSettingsStore } from './stores/settingsStore'

const memoStore = useMemoStore()
const settingsStore = useSettingsStore()

onMounted(async () => {
  // 应用保存的主题
  settingsStore.applyTheme()
  await memoStore.fetchMemos()
})
</script>

<template>
  <router-view />
</template>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>
