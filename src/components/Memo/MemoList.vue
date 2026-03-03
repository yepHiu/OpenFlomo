<script setup lang="ts">
import { useMemoStore } from "../../stores/memoStore";
import MemoCard from "./MemoCard.vue";

const memoStore = useMemoStore();

function handleBatchDelete() {
  const count = memoStore.selectedIds.size;
  // 如果选中数量超过5条，增加更明显的警告
  if (count > 5) {
    if (!confirm(`⚠️ 危险操作！你即将删除 ${count} 条记录，此操作无法撤销。\n\n确定要继续吗？`)) {
      return;
    }
  } else {
    if (!confirm(`确定要删除选中的 ${count} 条记录吗？此操作无法撤销。`)) {
      return;
    }
  }
  memoStore.batchDeleteMemo();
}
</script>

<template>
  <div class="memo-list">
    <!-- 批量操作栏 -->
    <div v-if="memoStore.isBatchMode" class="batch-toolbar">
      <div class="batch-info">
        <span>已选择 {{ memoStore.selectedIds.size }} 项</span>
      </div>
      <div class="batch-actions">
        <button class="batch-btn" @click="memoStore.selectAll">全选</button>
        <button class="batch-btn" @click="memoStore.clearSelection">清空</button>
        <button
          class="batch-btn delete"
          :disabled="memoStore.selectedIds.size === 0"
          @click="handleBatchDelete"
        >
          删除选中
        </button>
        <button class="batch-btn cancel" @click="memoStore.toggleBatchMode">取消</button>
      </div>
    </div>

    <!-- 非批量模式下的批量选择入口 -->
    <div v-if="!memoStore.isBatchMode && memoStore.memos.length > 0" class="batch-entry">
      <button class="batch-entry-btn" @click="memoStore.toggleBatchMode">
        <i class="pi pi-check-square"></i>
        批量管理
      </button>
    </div>

    <div v-if="memoStore.loading" class="loading">
      <i class="pi pi-spin pi-spinner"></i>
      加载中...
    </div>

    <div
      v-else-if="memoStore.filteredMemos.length === 0"
      class="empty-state"
    >
      <i class="pi pi-inbox"></i>
      <p v-if="memoStore.searchQuery">没有找到匹配的结果</p>
      <p v-else-if="memoStore.selectedTag">
        暂无带有 #{{ memoStore.selectedTag }} 标签的记录
      </p>
      <p v-else>还没有任何记录，开始写下你的第一条想法吧</p>
    </div>

    <template v-else>
      <MemoCard
        v-for="memo in memoStore.filteredMemos"
        :key="memo.id"
        :memo="memo"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.memo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.batch-entry {
  margin-bottom: 8px;

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

    i {
      font-size: 14px;
    }
  }
}

.batch-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--surface-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  margin-bottom: 8px;

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

      &.cancel {
        background: var(--surface-ground);
      }
    }
  }
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  color: var(--text-color-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-color-secondary);
  text-align: center;

  i {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
}
</style>
