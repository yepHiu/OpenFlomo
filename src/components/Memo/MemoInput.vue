<script setup lang="ts">
import { ref, computed } from "vue";
import { useMemoStore } from "../../stores/memoStore";

const memoStore = useMemoStore();
const rawInput = ref("");
const isSubmitting = ref(false);

// 从输入中提取标签 - 支持中文、英文、数字和斜杠
const extractedContent = computed(() => {
  const tagRegex = /#[\p{L}\d\/]+/gu;
  return rawInput.value.replace(tagRegex, "").trim();
});

const extractedTags = computed(() => {
  const tagRegex = /#[\p{L}\d\/]+/gu;
  const matches = rawInput.value.match(tagRegex) || [];
  const uniqueTags = [...new Set(matches.map((t) => t.slice(1)))];
  return uniqueTags.join(",");
});

async function handleSubmit() {
  if (!extractedContent.value || isSubmitting.value) return;

  isSubmitting.value = true;
  try {
    console.log("Submitting memo:", extractedContent.value, extractedTags.value);
    await memoStore.addMemo(extractedContent.value, extractedTags.value);
    rawInput.value = "";
    console.log("Memo submitted successfully");
  } catch (e) {
    console.error("Failed to submit memo:", e);
    alert("提交失败: " + e);
  } finally {
    isSubmitting.value = false;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    handleSubmit();
  }
}
</script>

<template>
  <div class="memo-input">
    <textarea
      v-model="rawInput"
      placeholder="记录今天的学习、思考或灵感... (支持 #标签)"
      rows="3"
      @keydown="handleKeydown"
    ></textarea>

    <div class="input-footer">
      <div class="tags-preview" v-if="extractedTags">
        <span v-for="tag in extractedTags.split(',')" :key="tag" class="tag">
          #{{ tag }}
        </span>
      </div>

      <div class="actions">
        <span class="hint">Ctrl + Enter 发送</span>
        <button
          class="btn-primary"
          :disabled="!extractedContent || isSubmitting"
          @click="handleSubmit"
        >
          <i class="pi pi-send"></i>
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.memo-input {
  background: var(--surface-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  textarea {
    width: 100%;
    border: none;
    outline: none;
    resize: none;
    font-size: 16px;
    line-height: 1.6;
    background: transparent;
    min-height: 80px;
    font-family: inherit;

    &::placeholder {
      color: var(--text-color-secondary);
    }
  }

  .input-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .tags-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .hint {
      font-size: 12px;
      color: var(--text-color-secondary);
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--primary-color);
      border: none;
      border-radius: var(--border-radius-sm);
      padding: 8px 16px;
      color: white;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover:not(:disabled) {
        background: #29b6f6;
      }

      &:disabled {
        background: #b0bec5;
        cursor: not-allowed;
      }
    }
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
