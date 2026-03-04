<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { useMemoStore } from "../../stores/memoStore";
import { parseMarkdown } from "../../utils/markdown";
import type { Memo } from "../../services/database";

const props = defineProps<{
  memo: Memo;
}>();

const memoStore = useMemoStore();
const isEditing = ref(false);
const editContent = ref("");
const editTags = ref("");
const showConfirmDelete = ref(false);
const contentInputRef = ref<HTMLTextAreaElement | null>(null);

// 渲染内容
const renderedNodes = computed(() => parseMarkdown(props.memo.content));

const tagsList = computed(() => {
  const memoTags = props.memo.tags || "";
  if (!memoTags) return [];
  return memoTags.split(",").filter((t) => t.trim());
});

const formattedDate = computed(() => {
  const date = new Date(props.memo.created_at);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
});

// 开始编辑
function startEdit() {
  editContent.value = props.memo.content;
  editTags.value = props.memo.tags;
  isEditing.value = true;
  nextTick(() => {
    contentInputRef.value?.focus();
    autoResize();
  });
}

// 自动调整文本框高度
function autoResize() {
  nextTick(() => {
    if (contentInputRef.value) {
      contentInputRef.value.style.height = 'auto';
      contentInputRef.value.style.height = contentInputRef.value.scrollHeight + 'px';
    }
  });
}

// 取消编辑
function cancelEdit() {
  isEditing.value = false;
  editContent.value = "";
  editTags.value = "";
}

// 保存编辑
async function saveEdit() {
  if (!editContent.value.trim()) return;

  // 提取标签
  const tagRegex = /#[\p{L}\d\/]+(?=\s|$|[，,。.])/gu;
  const matches = editContent.value.match(tagRegex) || [];
  editContent.value = editContent.value.replace(tagRegex, "").trim();
  const uniqueTags = [...new Set(matches.map((t) => t.slice(1)))];

  // 合并已有标签和新标签
  const existingTags = editTags.value ? editTags.value.split(",").map(t => t.trim()).filter(t => t) : [];
  const allTags = [...new Set([...existingTags, ...uniqueTags])].join(",");

  await memoStore.editMemo(props.memo.id, editContent.value, allTags);
  cancelEdit();
}

// 删除相关
function confirmDelete() {
  showConfirmDelete.value = true;
}

async function handleDelete() {
  await memoStore.removeMemo(props.memo.id);
  showConfirmDelete.value = false;
}
</script>

<template>
  <div
    class="memo-card"
    :class="{ editing: isEditing, selected: memoStore.selectedIds.has(memo.id), 'batch-mode': memoStore.isBatchMode }"
    @dblclick="!memoStore.isBatchMode && startEdit()"
  >
    <!-- 批量选择复选框 -->
    <div v-if="memoStore.isBatchMode" class="batch-checkbox" @click.stop="memoStore.toggleSelection(memo.id)" @dblclick.stop>
      <div class="checkbox" :class="{ checked: memoStore.selectedIds.has(memo.id) }">
        <i v-if="memoStore.selectedIds.has(memo.id)" class="pi pi-check"></i>
      </div>
    </div>
    <!-- 查看模式 -->
    <template v-if="!isEditing">
      <div class="card-header">
        <span class="date">{{ formattedDate }}</span>
        <div v-if="!memoStore.isBatchMode" class="actions" @dblclick.stop>
          <button class="action-btn" title="编辑" @click.stop="startEdit">
            <i class="pi pi-pencil"></i>
          </button>
          <button class="action-btn delete" title="删除" @click.stop="confirmDelete">
            <i class="pi pi-trash"></i>
          </button>
        </div>
      </div>

      <div class="card-content">
        <template v-for="(node, index) in renderedNodes" :key="index">
          <component :is="node" />
        </template>
      </div>

      <div v-if="tagsList.length > 0" class="card-tags" @dblclick.stop>
        <span
          v-for="tag in tagsList"
          :key="tag"
          class="tag"
          :class="{
            'tag-green': tag.includes('学习'),
            'tag-orange': tag.includes('工作') || tag.includes('紧急'),
          }"
          @click.stop="memoStore.setSelectedTag(tag)"
        >
          #{{ tag }}
        </span>
      </div>
    </template>

    <!-- 编辑模式 -->
    <template v-else>
      <div class="card-edit">
        <textarea
          ref="contentInputRef"
          v-model="editContent"
          class="edit-textarea"
          placeholder="编辑内容..."
          @input="autoResize"
        ></textarea>

        <input
          v-model="editTags"
          class="edit-tags"
          placeholder="标签（用逗号分隔）"
        />

        <div class="edit-actions">
          <button class="btn-giveup" @click.stop="cancelEdit">放弃编辑</button>
          <button class="btn-save-edit" @click.stop="saveEdit">保存编辑</button>
        </div>
      </div>
    </template>

    <!-- 删除确认 -->
    <Teleport to="body">
      <div v-if="showConfirmDelete" class="confirm-overlay" @click="showConfirmDelete = false">
        <div class="confirm-dialog" @click.stop>
          <h3>确认删除</h3>
          <p>确定要删除这条记录吗？此操作无法撤销。</p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="showConfirmDelete = false">取消</button>
            <button class="btn-delete" @click="handleDelete">删除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.memo-card {
  background: var(--surface-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  padding: 16px;
  padding-left: 16px;
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
  border: 2px solid transparent;
  position: relative;

  // 批量模式下才增加左侧padding以显示复选框
  &.batch-mode {
    padding-left: 44px;
  }

  &:hover:not(.editing) {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
    border-color: var(--primary-color);

    .actions {
      opacity: 1;
    }
  }

  &.editing {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-md);
    padding-left: 16px;
  }

  &.selected {
    border-color: var(--primary-color);
    background: rgba(79, 195, 247, 0.05);
  }
}

.batch-checkbox {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  z-index: 1;

  .checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid var(--surface-border);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    background: var(--surface-card);

    &.checked {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }

    i {
      font-size: 12px;
    }
  }

  &:hover .checkbox {
    border-color: var(--primary-color);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  .date {
    font-size: 12px;
    color: var(--text-color-secondary);
  }

  .actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .action-btn {
    background: none;
    border: none;
    padding: 6px;
    border-radius: 6px;
    cursor: pointer;
    color: var(--text-color-secondary);
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover {
      background: var(--surface-ground);
      color: var(--text-color);
    }

    &.delete:hover {
      background: rgba(239, 83, 80, 0.1);
      color: #ef5350;
    }

    &.save:hover {
      background: rgba(129, 199, 132, 0.1);
      color: #4caf50;
    }

    &.cancel:hover {
      background: rgba(239, 83, 80, 0.1);
      color: #ef5350;
    }
  }
}

.card-content {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-color);
  white-space: pre-wrap;
  word-break: break-word;
  cursor: text;

  :deep(.md-p) {
    margin: 0;
  }

  :deep(.md-ul),
  :deep(.md-ol) {
    margin: 0;
    padding-left: 1.5em;
  }

  :deep(.md-li) {
    margin: 0;
  }

  :deep(strong) {
    font-weight: 600;
  }
}

.card-edit {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .edit-textarea {
    width: 100%;
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius-sm);
    padding: 10px;
    font-size: 15px;
    line-height: 1.6;
    resize: none;
    outline: none;
    font-family: inherit;
    background: var(--surface-ground);
    overflow: hidden;
    min-height: 60px;
    height: auto;

    &:focus {
      border-color: var(--primary-color);
    }
  }

  .edit-tags {
    width: 100%;
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius-sm);
    padding: 8px 10px;
    font-size: 13px;
    outline: none;
    background: var(--surface-ground);

    &:focus {
      border-color: var(--primary-color);
    }
  }

  .edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 4px;

    .btn-save-edit {
      background: var(--primary-color);
      border: none;
      border-radius: var(--border-radius-sm);
      padding: 8px 16px;
      color: white;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background: #29b6f6;
      }
    }

    .btn-giveup {
      background: var(--surface-ground);
      border: none;
      border-radius: var(--border-radius-sm);
      padding: 8px 16px;
      color: var(--text-color-secondary);
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background: var(--surface-border);
      }
    }
  }
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  background-color: rgba(79, 195, 247, 0.15);
  color: #0288d1;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(79, 195, 247, 0.25);
  }

  &.tag-green {
    background-color: rgba(129, 199, 132, 0.15);
    color: #388e3c;

    &:hover {
      background-color: rgba(129, 199, 132, 0.25);
    }
  }

  &.tag-orange {
    background-color: rgba(255, 183, 77, 0.15);
    color: #f57c00;

    &:hover {
      background-color: rgba(255, 183, 77, 0.25);
    }
  }
}

// 删除确认弹窗
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  background: var(--surface-card);
  border-radius: var(--border-radius);
  padding: 24px;
  width: 320px;
  box-shadow: var(--shadow-lg);

  h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
    color: var(--text-color);
  }

  p {
    margin: 0 0 20px 0;
    font-size: 14px;
    color: var(--text-color-secondary);
  }

  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .btn-cancel {
    background: var(--surface-ground);
    border: none;
    border-radius: var(--border-radius-sm);
    padding: 8px 16px;
    cursor: pointer;
    font-weight: 500;

    &:hover {
      background: var(--surface-border);
    }
  }

  .btn-delete {
    background: #ef5350;
    border: none;
    border-radius: var(--border-radius-sm);
    padding: 8px 16px;
    color: white;
    cursor: pointer;
    font-weight: 500;

    &:hover {
      background: #e53935;
    }
  }
}
</style>
