import { defineStore } from "pinia";
import { ref } from "vue";
import { setLocale, getLocale } from "../i18n";

// 检测操作系统
function getIsMac(): boolean {
  return typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

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
  const storedTheme = localStorage.getItem("theme");
  const systemPrefersDark = typeof window !== 'undefined' && window.matchMedia("(prefers-color-scheme: dark)").matches;

  // 优先使用用户设置，否则跟随系统
  const isDarkMode = ref(storedTheme ? storedTheme === "dark" : systemPrefersDark);

  // 动态版本号
  const version = ref('1.0.0');
  getVersion().then(v => version.value = v);

  // 语言设置
  const locale = ref<'zh-CN' | 'en' | 'ja'>(getLocale());

  // 操作系统
  const isMac = ref(getIsMac());

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
    const locales: ('zh-CN' | 'en' | 'ja')[] = ['zh-CN', 'en', 'ja'];
    const currentIndex = locales.indexOf(locale.value);
    const nextIndex = (currentIndex + 1) % locales.length;
    const newLocale = locales[nextIndex];
    setLocale(newLocale);
    locale.value = newLocale;
  }

  // 设置语言
  function setAppLocale(newLocale: 'zh-CN' | 'en' | 'ja') {
    setLocale(newLocale);
    locale.value = newLocale;
  }

  // 初始化主题和系统主题监听
  function initTheme() {
    applyTheme();

    // 监听系统主题变化
    if (typeof window !== 'undefined') {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        // 只有在没有手动设置主题时才跟随系统
        if (!localStorage.getItem("theme")) {
          isDarkMode.value = e.matches;
          applyTheme();
        }
      });
    }
  }

  // 初始化时应用主题
  initTheme();

  return {
    isDarkMode,
    version,
    locale,
    isMac,
    toggleDarkMode,
    applyTheme,
    toggleLocale,
    setAppLocale,
  };
});
