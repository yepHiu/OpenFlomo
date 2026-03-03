<script setup lang="ts">
import { useMemoStore } from "../../stores/memoStore";
import { useRouter } from "vue-router";
import Heatmap from "./Heatmap.vue";

const memoStore = useMemoStore();
const router = useRouter();

function selectTag(tag: string) {
  if (memoStore.selectedTag === tag) {
    memoStore.setSelectedTag(null);
  } else {
    memoStore.setSelectedTag(tag);
  }
}

function goToSettings() {
  router.push("/settings");
}
</script>

<template>
  <div class="tag-sidebar">
    <div class="sidebar-header">
      <h2>OpenFlomo</h2>
      <p>记录 · 回顾 · 连接</p>
    </div>

    <div class="sidebar-section">
      <div
        class="menu-item"
        :class="{ active: !memoStore.selectedTag }"
        @click="memoStore.setSelectedTag(null)"
      >
        <i class="pi pi-home"></i>
        <span>全部记录</span>
        <span class="count">{{ memoStore.memos.length }}</span>
      </div>
    </div>

    <!-- 热力图 -->
    <Heatmap />

    <!-- 统计 -->
    <div class="sidebar-stats">
      <div class="stat-item">
        <span class="stat-value">{{ memoStore.memos.length }}</span>
        <span class="stat-label">总记录</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value">{{ memoStore.todayCount }}</span>
        <span class="stat-label">今日</span>
      </div>
    </div>

    <div class="sidebar-section">
      <h3>标签</h3>
      <ul class="tag-list" v-if="memoStore.allTags.length > 0">
        <li
          v-for="tag in memoStore.allTags"
          :key="tag.name"
          :class="{ active: memoStore.selectedTag === tag.name }"
          @click="selectTag(tag.name)"
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

    <div class="sidebar-footer">
      <div class="footer-menu">
        <div class="menu-item" @click="goToSettings">
          <i class="pi pi-cog"></i>
          <span>设置</span>
        </div>
      </div>
      <p>先记录，后整理</p>
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
  overflow-y: auto;
  overflow-x: hidden;

  // 隐藏滚动条
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.sidebar-header {
  padding: 0 20px 20px;
  border-bottom: 1px solid var(--surface-border);
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

  p {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--text-color-secondary);
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

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--surface-ground);
  }

  &.active {
    background: rgba(79, 195, 247, 0.15);
    color: var(--primary-color);
  }

  i {
    font-size: 16px;
  }

  span {
    font-size: 14px;
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

.tag-list {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background: var(--surface-ground);
    }

    &.active {
      background: rgba(79, 195, 247, 0.15);
      color: var(--primary-color);
    }

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

    .count {
      font-size: 12px;
      color: var(--text-color-secondary);
      background: var(--surface-ground);
      padding: 2px 8px;
      border-radius: 10px;
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

  .stat-divider {
    width: 1px;
    height: 30px;
    background: var(--surface-border);
    margin: 0 12px;
  }
}

.sidebar-footer {
  margin-top: auto;
  padding: 20px;
  border-top: 1px solid var(--surface-border);

  .footer-menu {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: background-color 0.2s ease;
    color: var(--text-color-secondary);

    &:hover {
      background: var(--surface-ground);
      color: var(--text-color);
    }

    i {
      font-size: 14px;
    }

    span {
      font-size: 13px;
    }
  }

  p {
    margin: 0;
    font-size: 12px;
    color: var(--text-color-secondary);
    font-style: italic;
    text-align: center;
  }
}
</style>
