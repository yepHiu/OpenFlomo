<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useMemoStore } from "../../stores/memoStore";
import MemoCard from "./MemoCard.vue";

const memoStore = useMemoStore();
const listRef = ref<HTMLElement | null>(null);

// 根据模式显示不同的列表
const currentMemos = computed(() => {
  return memoStore.isTrashMode ? memoStore.trashMemos : memoStore.filteredMemos;
});

function handleScroll() {
  if (!listRef.value || memoStore.isTrashMode) return;

  const { scrollTop, scrollHeight, clientHeight } = listRef.value;
  // 滚动到距离底部 100px 时加载更多
  if (scrollHeight - scrollTop - clientHeight < 100) {
    memoStore.loadMoreMemos();
  }
}

onMounted(() => {
  if (listRef.value) {
    listRef.value.addEventListener("scroll", handleScroll);
  }
});

onUnmounted(() => {
  if (listRef.value) {
    listRef.value.removeEventListener("scroll", handleScroll);
  }
});
</script>

<template>
  <div ref="listRef" class="memo-list">
    <div v-if="memoStore.loading" class="loading">
      <i class="pi pi-spin pi-spinner"></i>
      加载中...
    </div>

    <!-- 回收站空状态 -->
    <div
      v-else-if="memoStore.isTrashMode && memoStore.trashMemos.length === 0"
      class="empty-state"
    >
      <i class="pi pi-trash"></i>
      <p>回收站是空的</p>
    </div>

    <!-- 普通模式空状态 -->
    <div
      v-else-if="!memoStore.isTrashMode && currentMemos.length === 0"
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
        v-for="memo in currentMemos"
        :key="memo.id"
        :memo="memo"
        :is-trash-mode="memoStore.isTrashMode"
      />

      <!-- 加载更多（非回收站模式） -->
      <div v-if="!memoStore.isTrashMode && memoStore.loadingMore" class="loading-more">
        <i class="pi pi-spin pi-spinner"></i>
        加载中...
      </div>

      <!-- 没有更多了（非回收站模式） -->
      <div v-else-if="!memoStore.isTrashMode && !memoStore.hasMore && currentMemos.length > 0" class="no-more">
        没有更多了
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.memo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  color: var(--text-color-secondary);
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  color: var(--text-color-secondary);
  font-size: 13px;
}

.no-more {
  text-align: center;
  padding: 20px;
  color: var(--text-color-secondary);
  font-size: 13px;
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
