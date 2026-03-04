<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { useMemoStore } from "../../stores/memoStore";

const memoStore = useMemoStore();
const rawInput = ref("");
const isSubmitting = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// 列表模式状态
const isListMode = ref(false);

// 自动调整高度
function autoResize() {
  const textarea = textareaRef.value;
  if (!textarea) return;

  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

// 检测无序列表模式
function detectListMode(value: string) {
  const lastLine = value.split("\n").pop() || "";

  // 检测空无序列表标记
  if (/^[-*]\s*$/.test(lastLine)) {
    isListMode.value = true;
    return;
  }

  // 检测无序列表开头
  if (/^[-*]\s/.test(lastLine)) {
    isListMode.value = true;
    return;
  }

  // 非列表
  isListMode.value = false;
}

// 提取内容
const extractedContent = computed(() => {
  const tagRegex = /#[\p{L}\d\/]+(?=\s|$|[，,。.])/gu;
  return rawInput.value.replace(tagRegex, "").trim();
});

const extractedTags = computed(() => {
  const tagRegex = /#[\p{L}\d\/]+(?=\s|$|[，,。.])/gu;
  const matches = rawInput.value.match(tagRegex) || [];
  const uniqueTags = [...new Set(matches.map((t) => t.slice(1)))];
  return uniqueTags.join(",");
});

// 处理键盘 - 智能列表
function handleKeydown(event: KeyboardEvent) {
  const textarea = textareaRef.value;
  if (!textarea) return;

  // Ctrl/Cmd + Enter 发送
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    handleSubmit();
    return;
  }

  // Enter 换行 + 智能列表续接
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();

    const { selectionStart, selectionEnd, value } = textarea;
    const beforeCursor = value.slice(0, selectionStart);
    const afterCursor = value.slice(selectionEnd);

    // 获取当前行
    const beforeLines = beforeCursor.split("\n");
    const currentLine = beforeLines[beforeLines.length - 1] || "";
    const currentLineTrimmed = currentLine.trim();

    // 检查是否在空列表项上按 Enter（不续接）
    const isEmptyList = currentLineTrimmed === "-" || currentLineTrimmed === "*";

    if (isListMode.value && !isEmptyList) {
      // 续接无序列表
      const continuation = "- ";

      // 构建新值
      const beforePart = beforeLines.slice(0, -1).join("\n");
      const newValue = beforePart
        ? beforePart + "\n" + currentLine + "\n" + continuation + afterCursor
        : currentLine + "\n" + continuation + afterCursor;

      rawInput.value = newValue;

      const newPos = selectionStart + 1 + continuation.length;
      nextTick(() => {
        textarea.setSelectionRange(newPos, newPos);
        autoResize();
      });
    } else {
      // 普通换行
      const newValue = value.slice(0, selectionStart) + "\n" + value.slice(selectionEnd);
      rawInput.value = newValue;

      const newPos = selectionStart + 1;
      nextTick(() => {
        textarea.setSelectionRange(newPos, newPos);
        autoResize();
      });

      // 检测新行是否需要进入列表模式
      detectListMode(rawInput.value);
    }
  }
}

// 处理输入
function handleInput() {
  autoResize();
  detectListMode(rawInput.value);
}

async function handleSubmit() {
  if (!extractedContent.value || isSubmitting.value) return;

  // 重置列表模式
  isListMode.value = false;

  isSubmitting.value = true;
  try {
    await memoStore.addMemo(extractedContent.value, extractedTags.value);
    rawInput.value = "";
  } catch (e) {
    console.error("Failed to submit:", e);
    alert("提交失败: " + e);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="memo-input">
    <textarea
      ref="textareaRef"
      v-model="rawInput"
      placeholder="记录今天的学习、思考或灵感... (支持 #标签、- 列表、**加粗**)"
      @keydown="handleKeydown"
      @input="handleInput"
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
    font-family: inherit;
    overflow-y: auto;
    min-height: 24px;
    max-height: 300px;

    // 隐藏滚动条
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }

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
