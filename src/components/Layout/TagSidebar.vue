<script setup lang="ts">
import { useMemoStore } from "../../stores/memoStore";
import { useRouter } from "vue-router";
import Heatmap from "./Heatmap.vue";

const memoStore = useMemoStore();
const router = useRouter();

function selectTag(tag: string) {
  if (memoStore.isTrashMode) return;
  if (memoStore.selectedTag === tag) {
    memoStore.setSelectedTag(null);
  } else {
    memoStore.setSelectedTag(tag);
  }
}

function handleTagKeydown(event: KeyboardEvent, tag: string) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    selectTag(tag);
  }
}

function goToSettings() {
  router.push("/settings");
}

function goToTrash() {
  memoStore.setSelectedTag(null); // 清除标签选中状态
  memoStore.setSearch(""); // 清除搜索
  memoStore.toggleTrashMode();
}

// 刷新数据
function refreshData() {
  memoStore.fetchMemos();
}
</script>

<template>
  <div class="tag-sidebar">
    <div class="sidebar-header">
      <h2>OpenFlomo</h2>
      <div class="header-actions">
        <div
          class="icon-btn"
          @click="refreshData"
          tabindex="0"
          @keydown="(e) => e.key === 'Enter' && refreshData()"
          role="button"
          aria-label="刷新"
          title="刷新数据"
        >
          <i class="pi pi-refresh"></i>
        </div>
        <div
          class="icon-btn"
          @click="goToSettings"
          tabindex="0"
          @keydown="(e) => e.key === 'Enter' && goToSettings()"
          role="button"
          aria-label="设置"
        >
          <i class="pi pi-cog"></i>
        </div>
      </div>
    </div>

    <div class="sidebar-section">
      <div
        class="menu-item"
        :class="{ active: !memoStore.selectedTag && !memoStore.isTrashMode }"
        @click="memoStore.setSelectedTag(null); memoStore.isTrashMode && memoStore.toggleTrashMode()"
        tabindex="0"
        @keydown="(e) => e.key === 'Enter' && (memoStore.setSelectedTag(null), memoStore.isTrashMode && memoStore.toggleTrashMode())"
      >
        <i class="pi pi-home"></i>
        <span>全部记录</span>
        <span class="count">{{ memoStore.totalCount }}</span>
      </div>
    </div>

    <!-- 统计 -->
    <div class="sidebar-stats">
      <div class="stat-item">
        <span class="stat-value">{{ memoStore.totalCountWithTrash }}</span>
        <span class="stat-label">总记录</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ memoStore.todayCount }}</span>
        <span class="stat-label">今日</span>
      </div>
    </div>

    <!-- 回收站入口 -->
    <div class="sidebar-section">
      <div
        class="menu-item trash-item"
        :class="{ active: memoStore.isTrashMode }"
        @click="goToTrash"
        tabindex="0"
        @keydown="(e) => e.key === 'Enter' && goToTrash()"
      >
        <i class="pi pi-trash"></i>
        <span>回收站</span>
        <span v-if="memoStore.trashCount > 0" class="count badge">{{ memoStore.trashCount }}</span>
      </div>
    </div>

    <!-- 热力图 -->
    <Heatmap />

    <div class="tag-header">
      <h3>标签</h3>
    </div>

    <div class="tag-section">
      <ul class="tag-list" v-if="memoStore.allTags.length > 0">
        <li
          v-for="tag in memoStore.allTags"
          :key="tag.name"
          :class="{ active: memoStore.selectedTag === tag.name }"
          @click="selectTag(tag.name)"
          @keydown="(e) => handleTagKeydown(e, tag.name)"
          tabindex="0"
          role="button"
          :aria-pressed="memoStore.selectedTag === tag.name"
        >
          <span class="tag-name">
            <i class="pi pi-hashtag"></i>
            {{ tag.name }}
          </span>
          <span class="count">{{ tag.count }}</span>
        </li>
      </ul>
      <p v-else class="empty-tags">暂无标签</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tag-sidebar {
  width: 240px;
  height: 100vh;
  background: var(--surface-card);
  border-right: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 20px;
  margin-bottom: 16px;

  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    font-family: "Nunito", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #4FC3F7 0%, #81C784 50%, #FFB74D 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    color: var(--text-color-secondary);
    transition: all 0.2s ease;
    outline: none;

    &:hover {
      background: var(--surface-ground);
      color: var(--text-color);
    }

    &:focus-visible {
      box-shadow: 0 0 0 2px var(--primary-color);
    }

    i {
      font-size: 16px;
    }
  }
}

.sidebar-section {
  padding: 0 12px;
  margin-bottom: 20px;

  h3 {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-color-secondary);
    margin: 0 0 10px 8px;
  }

}

.tag-header {
  padding: 0 12px;
  margin-bottom: 10px;

  h3 {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-color-secondary);
    margin: 0 0 10px 8px;
  }
}

.tag-section {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 12px;
  box-sizing: border-box;

  // 隐藏滚动条
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

// 共用列表项样式
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: background-color 0.2s ease;
  outline: none;

  &:hover {
    background: var(--surface-ground);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--primary-color);
  }

  &.active {
    background: rgba(79, 195, 247, 0.15);
    color: var(--primary-color);
  }

  .count {
    margin-left: auto;
    font-size: 12px;
    color: var(--text-color-secondary);
    background: var(--surface-ground);
    padding: 2px 8px;
    border-radius: 10px;
  }
}

.menu-item {
  @extend .sidebar-item;

  i {
    font-size: 16px;
  }

  span {
    font-size: 14px;
  }

  &.trash-item {
    color: var(--text-color-secondary);

    &.active {
      color: #ff9800;
    }

    &:hover {
      color: #ff9800;
    }
  }

  .badge {
    background: #9e9e9e;
    color: white;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 10px;
  }
}

.tag-list {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    @extend .sidebar-item;
    justify-content: space-between;

    .tag-name {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;

      i {
        font-size: 12px;
        opacity: 0.6;
      }
    }
  }
}

.empty-tags {
  font-size: 13px;
  color: var(--text-color-secondary);
  text-align: center;
  padding: 20px;
}

.sidebar-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  margin: 0 12px 16px;
  background: var(--surface-ground);
  border-radius: var(--border-radius);

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-color);
    }

    .stat-label {
      font-size: 11px;
      color: var(--text-color-secondary);
      margin-top: 2px;
    }
  }
}
</style>
