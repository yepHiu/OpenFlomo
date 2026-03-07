import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  getMemosByPage,
  getMemoCount,
  createMemo,
  updateMemo,
  softDeleteMemo,
  permanentDeleteMemo,
  restoreMemo,
  getTrashMemos,
  getTrashCount,
  cleanExpiredTrash,
  getTodayCount,
  getHeatmapData,
  exportMemos,
  type Memo,
  type HeatmapItem,
  type ExportOptions,
} from "../services/database";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

// 开发环境日志
const isDev = import.meta.env.DEV;
const devLog = (fn: () => void) => {
  if (isDev) fn();
};

const PAGE_SIZE = 20;

// 默认确认函数（浏览器原生 confirm）
const defaultConfirm = (message: string): boolean => {
  return confirm(message);
};

export const useMemoStore = defineStore("memo", () => {
  const memos = ref<Memo[]>([]);
  const loading = ref(false);
  const loadingMore = ref(false);
  const hasMore = ref(true);
  const totalCount = ref(0);
  const searchQuery = ref("");
  const selectedTag = ref<string | null>(null);
  const todayCount = ref(0);
  const heatmapData = ref<HeatmapItem[]>([]);
  const selectedIds = ref<Set<number>>(new Set());
  const isBatchMode = ref(false);

  // 回收站相关状态
  const trashMemos = ref<Memo[]>([]);
  const isTrashMode = ref(false);
  const trashCount = ref(0);

  // 切换批量选择模式
  function toggleBatchMode() {
    isBatchMode.value = !isBatchMode.value;
    if (!isBatchMode.value) {
      selectedIds.value.clear();
    }
  }

  // 切换选择单个 memo
  function toggleSelection(id: number) {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id);
    } else {
      selectedIds.value.add(id);
    }
  }

  // 全选
  function selectAll() {
    filteredMemos.value.forEach((memo) => {
      selectedIds.value.add(memo.id);
    });
  }

  // 清除选择
  function clearSelection() {
    selectedIds.value.clear();
  }

  // 批量删除（软删除到回收站）
  async function batchDeleteMemo(confirmFn?: (message: string) => boolean | Promise<boolean>) {
    if (selectedIds.value.size === 0) return;

    const count = selectedIds.value.size;
    const confirmFunc = confirmFn || defaultConfirm;

    // 动态导入 i18n 函数需要在组件中传入
    const message = `batchDeleteConfirm|${count}`;
    if (!await confirmFunc(message)) {
      return;
    }

    const idsToDelete = Array.from(selectedIds.value);
    // 使用 Promise.all 并行删除
    await Promise.all(idsToDelete.map(id => softDeleteMemo(id)));

    // 从当前列表中移除
    memos.value = memos.value.filter((m) => !selectedIds.value.has(m.id));
    todayCount.value = Math.max(0, todayCount.value - idsToDelete.length);
    // 更新回收站数量
    trashCount.value += idsToDelete.length;
    clearSelection();
    isBatchMode.value = false;
  }

  // 批量导出选中内容
  async function batchExportMemo(format: "markdown" | "json" = "markdown") {
    if (selectedIds.value.size === 0) return;

    const ids = Array.from(selectedIds.value);

    const options: ExportOptions = {
      format,
      ids,
    };

    const result = await exportMemos(options);

    // 使用 Tauri 保存对话框
    const filters = format === "markdown"
      ? [{ name: "Markdown", extensions: ["md"] }]
      : [{ name: "JSON", extensions: ["json"] }];

    const filePath = await save({
      defaultPath: result.filename,
      filters,
    });

    if (filePath) {
      await writeTextFile(filePath, result.content);
    }
  }

  // 包含回收站的总数
  const totalCountWithTrash = computed(() => totalCount.value + trashCount.value);

  // 提取所有标签（按使用频率降序排列）
  const allTags = computed(() => {
    const tagMap = new Map<string, number>();
    memos.value.forEach((memo) => {
      if (memo.tags) {
        const tags = memo.tags.split(",").filter((t) => t.trim());
        tags.forEach((tag) => {
          tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        });
      }
    });
    return Array.from(tagMap.entries())
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  });

  // 过滤后的 memos
  const filteredMemos = computed(() => {
    let result = memos.value;

    // 按标签筛选
    if (selectedTag.value) {
      const tag = selectedTag.value;
      result = result.filter((memo) => {
        const memoTags = memo.tags || "";
        const tags = memoTags.split(",").map((t) => t.trim());
        return tags.includes(tag);
      });
    }

    // 按搜索关键词筛选
    if (searchQuery.value) {
      const keyword = searchQuery.value.toLowerCase();
      result = result.filter(
        (memo) =>
          (memo.content || "").toLowerCase().includes(keyword) ||
          (memo.tags || "").toLowerCase().includes(keyword)
      );
    }

    return result;
  });

  // 获取所有 memos
  async function fetchMemos() {
    loading.value = true;
    devLog(() => console.log("[Store] Starting fetchMemos..."));
    try {
      // 获取总数
      totalCount.value = await getMemoCount();
      // 初始加载第一页
      memos.value = await getMemosByPage(0, PAGE_SIZE);
      hasMore.value = memos.value.length < totalCount.value;
      devLog(() => console.log("[Store] Memos loaded:", memos.value.length, "total:", totalCount.value));
      todayCount.value = await getTodayCount();
      devLog(() => console.log("[Store] Today count:", todayCount.value));
      heatmapData.value = await getHeatmapData();
      devLog(() => console.log("[Store] Heatmap data:", heatmapData.value.length));
      // 加载回收站数量
      trashCount.value = await getTrashCount();
      devLog(() => console.log("[Store] Trash count:", trashCount.value));
    } catch (e) {
      console.error("[Store] Error fetching memos:", e);
    } finally {
      loading.value = false;
    }
  }

  // 加载更多 memos
  async function loadMoreMemos() {
    if (loadingMore.value || !hasMore.value) return;

    loadingMore.value = true;
    devLog(() => console.log("[Store] Loading more memos..."));
    try {
      const newMemos = await getMemosByPage(memos.value.length, PAGE_SIZE);
      memos.value = [...memos.value, ...newMemos];
      hasMore.value = memos.value.length < totalCount.value;
      devLog(() => console.log("[Store] More memos loaded:", newMemos.length, "hasMore:", hasMore.value));
    } catch (e) {
      console.error("[Store] Error loading more memos:", e);
    } finally {
      loadingMore.value = false;
    }
  }

  // 刷新热力图数据
  async function refreshHeatmap() {
    heatmapData.value = await getHeatmapData();
  }

  // 添加 memo
  async function addMemo(content: string, tags: string) {
    const newMemo = await createMemo(content, tags);
    memos.value.unshift(newMemo);
    todayCount.value++;
    // 更新热力图
    await refreshHeatmap();
    return newMemo;
  }

  // 编辑 memo
  async function editMemo(id: number, content: string, tags: string) {
    await updateMemo(id, content, tags);
    const index = memos.value.findIndex((m) => m.id === id);
    if (index !== -1) {
      memos.value[index] = {
        ...memos.value[index],
        content,
        tags,
        updated_at: new Date().toISOString(),
      };
    }
  }

  // 删除 memo（软删除到回收站）
  async function removeMemo(id: number) {
    await softDeleteMemo(id);
    memos.value = memos.value.filter((m) => m.id !== id);
    todayCount.value = Math.max(0, todayCount.value - 1);
    trashCount.value++;
  }

  // 从回收站恢复 memo
  async function restoreMemoFromTrash(id: number) {
    await restoreMemo(id);
    trashMemos.value = trashMemos.value.filter((m) => m.id !== id);
    trashCount.value = Math.max(0, trashCount.value - 1);
  }

  // 批量从回收站恢复
  async function restoreMemosFromTrash() {
    if (selectedIds.value.size === 0) return;

    const idsToRestore = Array.from(selectedIds.value);
    // 使用 Promise.all 并行恢复
    await Promise.all(idsToRestore.map(id => restoreMemo(id)));

    // 从回收站列表中移除
    trashMemos.value = trashMemos.value.filter((m) => !selectedIds.value.has(m.id));
    trashCount.value = Math.max(0, trashCount.value - idsToRestore.length);
    clearSelection();
    isBatchMode.value = false;
  }

  // 永久删除 memo
  async function permanentDelete(id: number) {
    await permanentDeleteMemo(id);
    trashMemos.value = trashMemos.value.filter((m) => m.id !== id);
    trashCount.value = Math.max(0, trashCount.value - 1);
  }

  // 批量永久删除
  async function batchPermanentDelete(confirmFn?: (message: string) => boolean | Promise<boolean>) {
    if (selectedIds.value.size === 0) return;

    const count = selectedIds.value.size;
    const confirmFunc = confirmFn || defaultConfirm;

    const message = `batchPermanentDeleteConfirm|${count}`;
    if (!await confirmFunc(message)) {
      return;
    }

    const idsToDelete = Array.from(selectedIds.value);
    // 使用 Promise.all 并行永久删除
    await Promise.all(idsToDelete.map(id => permanentDeleteMemo(id)));

    // 从回收站列表中移除
    trashMemos.value = trashMemos.value.filter((m) => !selectedIds.value.has(m.id));
    trashCount.value = Math.max(0, trashCount.value - idsToDelete.length);
    clearSelection();
    isBatchMode.value = false;
  }

  // 获取回收站内容
  async function fetchTrashMemos() {
    loading.value = true;
    try {
      trashMemos.value = await getTrashMemos();
      trashCount.value = await getTrashCount();
    } catch (e) {
      console.error("[Store] Error fetching trash memos:", e);
    } finally {
      loading.value = false;
    }
  }

  // 切换回收站模式
  async function toggleTrashMode() {
    isTrashMode.value = !isTrashMode.value;
    if (isTrashMode.value) {
      await fetchTrashMemos();
      clearSelection();
    } else {
      trashMemos.value = [];
    }
  }

  // 清空回收站
  async function cleanTrash(confirmFn?: (message: string) => boolean | Promise<boolean>) {
    if (trashCount.value === 0) return;

    const confirmFunc = confirmFn || defaultConfirm;

    const message = `cleanTrashConfirm|${trashCount.value}`;
    if (!await confirmFunc(message)) {
      return;
    }

    try {
      // 使用 Promise.all 并行永久删除所有回收站中的 memo
      await Promise.all(trashMemos.value.map(memo => permanentDeleteMemo(memo.id)));
      trashMemos.value = [];
      trashCount.value = 0;
    } catch (e) {
      console.error("[Store] Error cleaning trash:", e);
    }
  }

  // 清理过期回收站（启动时调用）
  async function cleanupExpiredTrash() {
    try {
      const cleanedCount = await cleanExpiredTrash();
      if (cleanedCount > 0) {
        devLog(() => console.log("[Store] Cleaned expired trash:", cleanedCount));
        trashCount.value = await getTrashCount();
      }
    } catch (e) {
      console.error("[Store] Error cleaning expired trash:", e);
    }
  }

  // 设置搜索关键词
  function setSearch(query: string) {
    searchQuery.value = query;
  }

  // 设置选中的标签
  function setSelectedTag(tag: string | null) {
    selectedTag.value = tag;
  }

  return {
    memos,
    loading,
    loadingMore,
    hasMore,
    searchQuery,
    selectedTag,
    todayCount,
    totalCount,
    totalCountWithTrash,
    heatmapData,
    allTags,
    filteredMemos,
    selectedIds,
    isBatchMode,
    // 回收站相关
    trashMemos,
    isTrashMode,
    trashCount,
    fetchMemos,
    loadMoreMemos,
    refreshHeatmap,
    addMemo,
    editMemo,
    removeMemo,
    setSearch,
    setSelectedTag,
    toggleBatchMode,
    toggleSelection,
    selectAll,
    clearSelection,
    batchDeleteMemo,
    batchExportMemo,
    // 回收站方法
    fetchTrashMemos,
    toggleTrashMode,
    restoreMemoFromTrash,
    restoreMemosFromTrash,
    permanentDelete,
    batchPermanentDelete,
    cleanTrash,
    cleanupExpiredTrash,
  };
});
