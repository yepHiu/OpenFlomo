<script setup lang="ts">
import { ref, watch } from "vue";
import { useMemoStore } from "../../stores/memoStore";
import type { Memo } from "../../services/database";

const props = defineProps<{
  visible: boolean;
  memo: Memo;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "close"): void;
}>();

const memoStore = useMemoStore();
const editContent = ref("");
const editTags = ref("");
const isSaving = ref(false);

// 监听弹窗打开时初始化数据
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      editContent.value = props.memo.content;
      editTags.value = props.memo.tags;
    }
  }
);

async function handleSave() {
  if (!editContent.value.trim() || isSaving.value) return;

  isSaving.value = true;
  try {
    await memoStore.editMemo(props.memo.id, editContent.value.trim(), editTags.value);
    emit("update:visible", false);
    emit("close");
  } finally {
    isSaving.value = false;
  }
}

function handleClose() {
  emit("update:visible", false);
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="dialog-overlay" @click="handleClose">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h2>编辑记录</h2>
          <button class="close-btn" @click="handleClose">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="dialog-body">
          <textarea
            v-model="editContent"
            placeholder="记录内容..."
            rows="6"
          ></textarea>

          <div class="tags-section">
            <label>标签（用逗号分隔）</label>
            <input
              v-model="editTags"
              type="text"
              placeholder="例如: 学习, 工作, 灵感"
            />
            <div v-if="editTags" class="tags-preview">
              <span v-for="tag in editTags.split(',')" :key="tag" class="tag">
                #{{ tag.trim() }}
              </span>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn-cancel" @click="handleClose">取消</button>
          <button
            class="btn-save"
            :disabled="!editContent.trim() || isSaving"
            @click="handleSave"
          >
            {{ isSaving ? "保存中..." : "保存" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.dialog-overlay {
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

.dialog-content {
  background: var(--surface-card);
  border-radius: var(--border-radius);
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--surface-border);

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
  }

  .close-btn {
    background: none;
    border: none;
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    color: var(--text-color-secondary);

    &:hover {
      background: var(--surface-ground);
    }
  }
}

.dialog-body {
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;

  textarea {
    width: 100%;
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius-sm);
    padding: 12px;
    font-size: 15px;
    line-height: 1.6;
    resize: vertical;
    outline: none;
    font-family: inherit;

    &:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.15);
    }
  }

  .tags-section {
    display: flex;
    flex-direction: column;
    gap: 8px;

    label {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-color);
    }

    input {
      width: 100%;
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius-sm);
      padding: 10px 12px;
      font-size: 14px;
      outline: none;

      &:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.15);
      }
    }

    .tags-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--surface-border);
}

.btn-cancel {
  background: var(--surface-ground);
  border: none;
  border-radius: var(--border-radius-sm);
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: var(--surface-border);
  }
}

.btn-save {
  background: var(--primary-color);
  border: none;
  border-radius: var(--border-radius-sm);
  padding: 10px 20px;
  color: white;
  cursor: pointer;
  font-weight: 500;

  &:hover:not(:disabled) {
    background: #29b6f6;
  }

  &:disabled {
    background: #b0bec5;
    cursor: not-allowed;
  }
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
}
</style>
