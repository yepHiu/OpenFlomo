<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useMemoStore } from "../stores/memoStore";
import { useI18n } from "vue-i18n";
import MemoInput from "../components/Memo/MemoInput.vue";
import MemoList from "../components/Memo/MemoList.vue";
import TagSidebar from "../components/Layout/TagSidebar.vue";

const memoStore = useMemoStore();
const searchQuery = ref("");
const { t } = useI18n();

// 防抖定时器
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// 防抖搜索
function debounceSearch() {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  searchDebounceTimer = setTimeout(() => {
    memoStore.setSearch(searchQuery.value);
  }, 300);
}

// 应用启动时清理过期回收站，并确保数据已加载
onMounted(async () => {
  // 如果数据未加载，则加载
  if (memoStore.memos.length === 0) {
    await memoStore.fetchMemos();
  }
  await memoStore.cleanupExpiredTrash();
});

function handleSearch() {
  debounceSearch();
}

function clearSearch() {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = null;
  }
  searchQuery.value = "";
  memoStore.setSearch("");
}

// 确认处理函数 - 解析 store 传入的消息
async function handleBatchDeleteConfirm(message: string): Promise<boolean> {
  const [key, count] = message.split('|');
  if (key === 'batchDeleteConfirm') {
    return confirm(t('batch.confirmBatchDelete', { count: parseInt(count) }));
  }
  return false;
}

async function handleBatchPermanentDeleteConfirm(message: string): Promise<boolean> {
  const [key, count] = message.split('|');
  if (key === 'batchPermanentDeleteConfirm') {
    return confirm(t('batch.confirmBatchPermanentDelete', { count: parseInt(count) }));
  }
  return false;
}

async function handleCleanTrashConfirm(message: string): Promise<boolean> {
  const [key, count] = message.split('|');
  if (key === 'cleanTrashConfirm') {
    return confirm(t('trash.confirmCleanTrash', { count: parseInt(count) }));
  }
  return false;
}
</script>

<template>
  <div class="home-layout">
    <!-- 左侧标签栏 -->
    <TagSidebar class="sidebar" />

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部固定区域 -->
      <div class="content-fixed">
        <!-- 顶部搜索和统计 -->
        <div class="top-bar">
          <div class="search-box">
            <i class="pi pi-search"></i>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('search.placeholder')"
              @input="handleSearch"
              @keyup.escape="clearSearch"
            />
            <i
              v-if="searchQuery"
              class="pi pi-times clear-btn"
              @click="clearSearch"
            ></i>
          </div>
        </div>

        <!-- 当前位置标签 -->
        <div v-if="memoStore.selectedTag && !memoStore.isTrashMode" class="current-filter">
          <span class="filter-label">{{ t('search.clear') }}：</span>
          <span class="tag">#{{ memoStore.selectedTag }}</span>
          <i class="pi pi-times" @click="memoStore.setSelectedTag(null)"></i>
        </div>

        <!-- 回收站标题 -->
        <div v-if="memoStore.isTrashMode" class="trash-header">
          <h3><i class="pi pi-trash"></i> {{ t('trash.title') }}</h3>
          <p class="trash-tip">{{ t('trash.description') }}</p>
        </div>

        <!-- 记录输入框（非回收站模式显示） -->
        <MemoInput v-if="!memoStore.isTrashMode" />
      </div>

      <!-- 批量操作栏（固定不滚动） -->
      <div v-if="memoStore.isBatchMode" class="batch-toolbar-fixed">
        <div class="batch-info">
          <span>{{ t('batch.selected', { count: memoStore.selectedIds.size }) }}</span>
        </div>
        <div class="batch-actions">
          <button class="batch-btn" @click="memoStore.selectAll">{{ t('batch.selectAll') }}</button>
          <button class="batch-btn" @click="memoStore.clearSelection">{{ t('batch.clearSelection') }}</button>

          <!-- 回收站模式下的操作 -->
          <template v-if="memoStore.isTrashMode">
            <button
              class="batch-btn restore"
              :disabled="memoStore.selectedIds.size === 0"
              @click="memoStore.restoreMemosFromTrash"
            >
              {{ t('batch.restoreSelected') }}
            </button>
            <button
              class="batch-btn permanent-delete"
              :disabled="memoStore.selectedIds.size === 0"
              @click="memoStore.batchPermanentDelete(handleBatchPermanentDeleteConfirm)"
            >
              {{ t('batch.permanentDeleteSelected') }}
            </button>
          </template>

          <!-- 非回收站模式下的操作 -->
          <template v-else>
            <button
              class="batch-btn export"
              :disabled="memoStore.selectedIds.size === 0"
              @click="memoStore.batchExportMemo('markdown')"
            >
              {{ t('batch.exportSelected') }}
            </button>
            <button
              class="batch-btn delete"
              :disabled="memoStore.selectedIds.size === 0"
              @click="memoStore.batchDeleteMemo(handleBatchDeleteConfirm)"
            >
              {{ t('batch.deleteSelected') }}
            </button>
          </template>

          <button class="batch-btn cancel" @click="memoStore.toggleBatchMode">{{ t('batch.cancel') }}</button>
        </div>
      </div>

      <!-- 非批量模式下的批量选择入口 -->
      <div v-if="!memoStore.isBatchMode && !memoStore.isTrashMode && memoStore.memos.length > 0" class="batch-entry">
        <button class="batch-entry-btn" @click="memoStore.toggleBatchMode">
          <i class="pi pi-check-square"></i>
          {{ t('batch.batchManage') }}
        </button>
      </div>

      <!-- 回收站模式下的批量选择入口 -->
      <div v-if="!memoStore.isBatchMode && memoStore.isTrashMode && memoStore.trashMemos.length > 0" class="batch-entry">
        <button class="batch-entry-btn" @click="memoStore.toggleBatchMode">
          <i class="pi pi-check-square"></i>
          {{ t('batch.batchManage') }}
        </button>
        <button class="batch-entry-btn danger" @click="memoStore.cleanTrash(handleCleanTrashConfirm)">
          <i class="pi pi-trash"></i>
          {{ t('trash.cleanTrash') }}
        </button>
      </div>

      <!-- 记录列表（可滚动） -->
      <MemoList class="content-scrollable" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.home-layout {
  display: flex;
  height: 100vh;
  background: var(--surface-ground);
  overflow: hidden;
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.content-fixed {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.content-scrollable {
  flex: 1;
  overflow-y: auto;
  margin-top: 16px;
  padding-right: 8px;
}

.top-bar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;

  .pi-search {
    position: absolute;
    left: 14px;
    color: var(--text-color-secondary);
  }

  input {
    width: 100%;
    padding: 12px 40px 12px 40px;
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.15);
    }

    &::placeholder {
      color: var(--text-color-secondary);
    }
  }

  .clear-btn {
    position: absolute;
    right: 14px;
    cursor: pointer;
    color: var(--text-color-secondary);

    &:hover {
      color: var(--text-color);
    }
  }
}

.current-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(79, 195, 247, 0.1);
  border-radius: var(--border-radius-sm);

  .filter-label {
    color: var(--text-color-secondary);
    font-size: 13px;
  }

  .tag {
    background: var(--primary-color);
    color: white;
  }

  .pi-times {
    cursor: pointer;
    color: var(--text-color-secondary);
    margin-left: 4px;

    &:hover {
      color: var(--text-color);
    }
  }
}

.trash-header {
  display: flex;
  flex-direction: column;
  gap: 4px;

  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 18px;
    color: #ff9800;

    i {
      font-size: 20px;
    }
  }

  .trash-tip {
    margin: 0;
    font-size: 12px;
    color: var(--text-color-secondary);
  }
}

.batch-toolbar-fixed {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--surface-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  margin-top: 16px;
  flex-shrink: 0;

  .batch-info {
    font-size: 14px;
    color: var(--text-color);
    font-weight: 500;
  }

  .batch-actions {
    display: flex;
    gap: 8px;

    .batch-btn {
      padding: 6px 12px;
      border-radius: var(--border-radius-sm);
      font-size: 13px;
      cursor: pointer;
      border: 1px solid var(--surface-border);
      background: var(--surface-ground);
      color: var(--text-color);
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: var(--surface-card);
        border-color: var(--primary-color);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.delete {
        background: #ffebee;
        border-color: #ffcdd2;
        color: #c62828;

        &:hover:not(:disabled) {
          background: #ffcdd2;
        }
      }

      &.restore {
        background: #e8f5e9;
        border-color: #c8e6c9;
        color: #2e7d32;

        &:hover:not(:disabled) {
          background: #c8e6c9;
        }
      }

      &.permanent-delete {
        background: #ffebee;
        border-color: #ffcdd2;
        color: #c62828;

        &:hover:not(:disabled) {
          background: #ffcdd2;
        }
      }

      &.export {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: white;

        &:hover:not(:disabled) {
          background: #29b6f6;
          border-color: #29b6f6;
        }
      }

      &.cancel {
        background: var(--surface-ground);
      }
    }
  }
}

.batch-entry {
  margin-top: 16px;
  flex-shrink: 0;
  display: flex;
  gap: 8px;

  .batch-entry-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--surface-ground);
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius-sm);
    padding: 8px 14px;
    font-size: 13px;
    color: var(--text-color-secondary);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--surface-card);
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    &.danger {
      color: #c62828;
      border-color: #ffcdd2;

      &:hover {
        background: #ffebee;
        border-color: #c62828;
      }
    }

    i {
      font-size: 14px;
    }
  }
}
</style>
