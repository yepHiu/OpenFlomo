<script setup lang="ts">
import { ref } from "vue";
import { useMemoStore } from "../stores/memoStore";
import MemoInput from "../components/Memo/MemoInput.vue";
import MemoList from "../components/Memo/MemoList.vue";
import TagSidebar from "../components/Layout/TagSidebar.vue";

const memoStore = useMemoStore();
const searchQuery = ref("");

function handleSearch() {
  memoStore.setSearch(searchQuery.value);
}

function clearSearch() {
  searchQuery.value = "";
  memoStore.setSearch("");
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
              placeholder="搜索记录..."
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
        <div v-if="memoStore.selectedTag" class="current-filter">
          <span class="filter-label">当前筛选：</span>
          <span class="tag">#{{ memoStore.selectedTag }}</span>
          <i class="pi pi-times" @click="memoStore.setSelectedTag(null)"></i>
        </div>

        <!-- 记录输入框 -->
        <MemoInput />
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

  // 隐藏滚动条
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  // 最大宽度限制，超大屏幕时左右留白
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

  // 隐藏滚动条
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
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
</style>
