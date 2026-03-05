<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useMemoStore } from "../../stores/memoStore";
import { useI18n } from "vue-i18n";
import MemoCard from "./MemoCard.vue";

const memoStore = useMemoStore();
const listRef = ref<HTMLElement | null>(null);
const { t } = useI18n();

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
      {{ t('memo.loading') || '加载中...' }}
    </div>

    <!-- 回收站空状态 -->
    <div
      v-else-if="memoStore.isTrashMode && memoStore.trashMemos.length === 0"
      class="empty-state"
    >
      <i class="pi pi-trash"></i>
      <p>{{ t('sidebar.trashEmpty') }}</p>
    </div>

    <!-- 普通模式空状态 -->
    <div
      v-else-if="!memoStore.isTrashMode && currentMemos.length === 0"
      class="empty-state"
    >
      <i class="pi pi-inbox"></i>
      <p v-if="memoStore.searchQuery">{{ t('memo.noSearchResults') }}</p>
      <p v-else-if="memoStore.selectedTag">{{ t('memo.noTagRecords', { tag: memoStore.selectedTag }) }}</p>
      <p v-else>{{ t('memo.noRecords') }}</p>
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
        {{ t('memo.loading') || '加载中...' }}
      </div>

      <!-- 没有更多了（非回收站模式） -->
      <div v-else-if="!memoStore.isTrashMode && !memoStore.hasMore && currentMemos.length > 0" class="no-more">
        {{ t('memo.noMore') || '没有更多了' }}
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
