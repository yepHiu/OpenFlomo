<script setup lang="ts">
import { computed } from "vue";
import { useMemoStore } from "../../stores/memoStore";

const memoStore = useMemoStore();

// 生成过去40天的日期数组 (8x5网格)
const days = computed(() => {
  const result: { date: string; count: number; level: number }[] = [];
  const today = new Date();

  for (let i = 39; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayData = memoStore.heatmapData.find((d) => d.date === dateStr);
    const count = dayData?.count || 0;

    // 计算热力等级 0-4
    let level = 0;
    if (count > 0) level = 1;
    if (count >= 3) level = 2;
    if (count >= 6) level = 3;
    if (count >= 10) level = 4;

    result.push({ date: dateStr, count, level });
  }

  return result;
});

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
</script>

<template>
  <div class="heatmap-container">
    <div class="heatmap-header">
      <span class="heatmap-title">热力图</span>
    </div>

    <div class="heatmap-grid">
      <div
        v-for="day in days"
        :key="day.date"
        class="heatmap-cell"
        :class="['level-' + day.level]"
        :title="`${formatDate(day.date)}: ${day.count} 条记录`"
      ></div>
    </div>

    <div class="heatmap-legend">
      <span class="legend-label">少</span>
      <div class="legend-cells">
        <div class="heatmap-cell level-0"></div>
        <div class="heatmap-cell level-1"></div>
        <div class="heatmap-cell level-2"></div>
        <div class="heatmap-cell level-3"></div>
        <div class="heatmap-cell level-4"></div>
      </div>
      <span class="legend-label">多</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.heatmap-container {
  padding: 12px;
  background: var(--surface-card);
  border-radius: var(--border-radius);
  margin: 0 12px 16px;
}

.heatmap-header {
  margin-bottom: 10px;

  .heatmap-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-color-secondary);
  }
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(8, 18px);
  grid-template-rows: repeat(5, 18px);
  gap: 6px;
  justify-content: center;
}

.heatmap-cell {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.1s ease;

  &:hover {
    transform: scale(1.15);
  }

  // 热力等级颜色 - 清新明亮风格
  &.level-0 {
    background: #e8eaed;
  }

  &.level-1 {
    background: #c6e9f7;
  }

  &.level-2 {
    background: #7bcbf2;
  }

  &.level-3 {
    background: #3ba8e8;
  }

  &.level-4 {
    background: #1e88e5;
  }
}

// 深色模式
.dark {
  .heatmap-cell {
    &.level-0 {
      background: #2d2d2d;
    }

    &.level-1 {
      background: #0d47a1;
    }

    &.level-2 {
      background: #1565c0;
    }

    &.level-3 {
      background: #1976d2;
    }

    &.level-4 {
      background: #42a5f5;
    }
  }
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 8px;

  .legend-label {
    font-size: 10px;
    color: var(--text-color-secondary);
  }

  .legend-cells {
    display: flex;
    gap: 2px;

    .heatmap-cell {
      width: 10px;
      height: 10px;
      cursor: default;

      &:hover {
        transform: none;
      }
    }
  }
}
</style>
