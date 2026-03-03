import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  getAllMemos,
  createMemo,
  updateMemo,
  deleteMemo,
  getTodayCount,
  getHeatmapData,
  type Memo,
  type HeatmapItem,
} from "../services/database";

export const useMemoStore = defineStore("memo", () => {
  const memos = ref<Memo[]>([]);
  const loading = ref(false);
  const searchQuery = ref("");
  const selectedTag = ref<string | null>(null);
  const todayCount = ref(0);
  const heatmapData = ref<HeatmapItem[]>([]);
  const selectedIds = ref<Set<number>>(new Set());
  const isBatchMode = ref(false);

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

  // 批量删除
  async function batchDeleteMemo() {
    if (selectedIds.value.size === 0) return;

    const idsToDelete = Array.from(selectedIds.value);
    for (const id of idsToDelete) {
      await deleteMemo(id);
    }

    // 更新本地状态
    memos.value = memos.value.filter((m) => !selectedIds.value.has(m.id));
    todayCount.value = Math.max(0, todayCount.value - idsToDelete.length);
    clearSelection();
    isBatchMode.value = false;
  }

  // 提取所有标签
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
    return Array.from(tagMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
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
    console.log("[Store] Starting fetchMemos...");
    try {
      memos.value = await getAllMemos();
      console.log("[Store] Memos loaded:", memos.value.length);
      todayCount.value = await getTodayCount();
      console.log("[Store] Today count:", todayCount.value);
      heatmapData.value = await getHeatmapData();
      console.log("[Store] Heatmap data:", heatmapData.value.length);
    } catch (e) {
      console.error("[Store] Error fetching memos:", e);
    } finally {
      loading.value = false;
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

  // 删除 memo
  async function removeMemo(id: number) {
    await deleteMemo(id);
    memos.value = memos.value.filter((m) => m.id !== id);
    todayCount.value = Math.max(0, todayCount.value - 1);
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
    searchQuery,
    selectedTag,
    todayCount,
    heatmapData,
    allTags,
    filteredMemos,
    selectedIds,
    isBatchMode,
    fetchMemos,
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
  };
});
