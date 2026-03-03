import { defineStore } from "pinia";
import { ref } from "vue";

export const useSettingsStore = defineStore("settings", () => {
  // 从 localStorage 读取主题设置
  const isDarkMode = ref(localStorage.getItem("theme") === "dark");

  // 切换深色模式
  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value;
    applyTheme();
  }

  // 应用主题
  function applyTheme() {
    if (isDarkMode.value) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  // 初始化时应用主题
  applyTheme();

  return {
    isDarkMode,
    toggleDarkMode,
    applyTheme,
  };
});
