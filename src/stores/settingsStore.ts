import { defineStore } from "pinia";
import { ref } from "vue";
import { setLocale, getLocale } from "../i18n";

// 动态获取版本号
async function getVersion() {
  try {
    const response = await fetch('/version.json');
    if (response.ok) {
      const data = await response.json();
      return data.version || '1.0.0';
    }
  } catch {
    // 忽略错误
  }
  return '1.0.0';
}

export const useSettingsStore = defineStore("settings", () => {
  // 从 localStorage 读取主题设置
  const isDarkMode = ref(localStorage.getItem("theme") === "dark");

  // 动态版本号
  const version = ref('1.0.0');
  getVersion().then(v => version.value = v);

  // 语言设置
  const locale = ref<'zh-CN' | 'en'>(getLocale());

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

  // 切换语言
  function toggleLocale() {
    const newLocale = locale.value === 'zh-CN' ? 'en' : 'zh-CN';
    setLocale(newLocale);
    locale.value = newLocale;
  }

  // 设置语言
  function setAppLocale(newLocale: 'zh-CN' | 'en') {
    setLocale(newLocale);
    locale.value = newLocale;
  }

  // 初始化时应用主题
  applyTheme();

  return {
    isDarkMode,
    version,
    locale,
    toggleDarkMode,
    applyTheme,
    toggleLocale,
    setAppLocale,
  };
});
