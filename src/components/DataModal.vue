<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useMemoStore } from "../stores/memoStore";
import { useI18n } from "vue-i18n";
import { exportMemos, importMemos, type ExportData, type ExportOptions } from "../services/database";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { useAppToast } from "../composables/useToast";
import DatePicker from "primevue/datepicker";

const emit = defineEmits<{
  close: []
}>();

const memoStore = useMemoStore();
const { t } = useI18n();
const { showSuccess, showError } = useAppToast();

const isExporting = ref(false);
const isImporting = ref(false);
const importFileName = ref("");
const importPreview = ref<ExportData | null>(null);

const exportFormat = ref<"json" | "markdown">("json");
const startDate = ref<Date | null>(null);
const endDate = ref<Date | null>(null);
const selectedTags = ref<string[]>([]);

const availableTags = computed(() => memoStore.allTags);

const stats = computed(() => ({
  total: memoStore.memos.length,
  tags: memoStore.allTags.length,
  today: memoStore.todayCount,
}));

// 格式化日期为 YYYY-MM-DD
function formatDateString(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const exportPreview = computed(() => {
  const conditions: string[] = [];

  const startStr = formatDateString(startDate.value);
  const endStr = formatDateString(endDate.value);

  if (startStr && endStr) {
    conditions.push(`${startStr} ${t('data.to')} ${endStr}`);
  } else if (startStr) {
    conditions.push(`${startStr}`);
  } else if (endStr) {
    conditions.push(`${endStr}`);
  }

  if (selectedTags.value.length > 0) {
    conditions.push(`#${selectedTags.value.join(' #')}`);
  }

  if (conditions.length === 0) {
    return t('data.exportPreview', { count: stats.value.total });
  }

  return t('data.exportPreviewFiltered');
});

function toggleTag(tag: string) {
  const index = selectedTags.value.indexOf(tag);
  if (index === -1) {
    selectedTags.value.push(tag);
  } else {
    selectedTags.value.splice(index, 1);
  }
}

function clearFilters() {
  startDate.value = null;
  endDate.value = null;
  selectedTags.value = [];
}

function handleBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
    emit('close');
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close');
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  document.body.style.overflow = "hidden";
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = "";
});

async function handleExport() {
  if (isExporting.value) return;
  isExporting.value = true;

  try {
    const options: ExportOptions = {
      format: exportFormat.value,
      startDate: formatDateString(startDate.value) || undefined,
      endDate: formatDateString(endDate.value) || undefined,
      tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
    };

    const result = await exportMemos(options);

    const filters = exportFormat.value === "markdown"
      ? [{ name: "Markdown", extensions: ["md"] }]
      : [{ name: "JSON", extensions: ["json"] }];

    const filePath = await save({
      defaultPath: result.filename,
      filters,
    });

    if (filePath) {
      await writeTextFile(filePath, result.content);

      let count = 0;
      if (exportFormat.value === "json") {
        const data = JSON.parse(result.content);
        count = data.memos?.length || 0;
      } else {
        const matches = result.content.match(/^## /gm);
        count = matches ? matches.length : 0;
      }

      showSuccess(t('data.exportSuccess', { count }));
    }
  } catch (e) {
    console.error("Export failed:", e);
    showError(t('data.exportFailed', { error: String(e) }));
  } finally {
    isExporting.value = false;
  }
}

async function handleSelectFile() {
  if (isImporting.value) return;

  try {
    const filePath = await open({
      filters: [{ name: "JSON", extensions: ["json"] }],
      multiple: false,
    });

    if (!filePath) return;

    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    const text = await readTextFile(filePath as string);
    const data: ExportData = JSON.parse(text);

    if (!data.version || !data.memos) {
      throw new Error(t('data.invalidFile'));
    }

    importFileName.value = (filePath as string).split(/[/\\]/).pop() || "Unknown";
    importPreview.value = data;
  } catch (e) {
    console.error("Import preview failed:", e);
    showError(t('data.importFailed', { error: String(e) }));
    importPreview.value = null;
    importFileName.value = "";
  }
}

async function handleImport() {
  if (!importPreview.value || isImporting.value) return;
  isImporting.value = true;

  try {
    const count = await importMemos(importPreview.value);
    showSuccess(t('data.importSuccessCount', { count }));

    await memoStore.fetchMemos();

    importPreview.value = null;
    importFileName.value = "";
  } catch (e) {
    console.error("Import failed:", e);
    showError(t('data.importFailed', { error: String(e) }));
  } finally {
    isImporting.value = false;
  }
}

function cancelImport() {
  importPreview.value = null;
  importFileName.value = "";
}
</script>

<template>
  <div class="modal-backdrop" @click="handleBackdropClick">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ t('data.title') }}</h2>
        <button class="close-btn" @click="$emit('close')">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon blue">
            <i class="pi pi-file"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">{{ t('data.totalRecords') }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">
            <i class="pi pi-tag"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.tags }}</span>
            <span class="stat-label">{{ t('data.tagCount') }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange">
            <i class="pi pi-calendar"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.today }}</span>
            <span class="stat-label">{{ t('data.todayNew') }}</span>
          </div>
        </div>
      </div>

      <div class="modal-body">
        <div class="data-card export-card">
          <div class="card-header">
            <i class="pi pi-download"></i>
            <h3>{{ t('data.export') }}</h3>
          </div>

          <div class="format-section">
            <label class="section-label">{{ t('data.selectFormat') }}</label>
            <div class="format-cards">
              <div class="format-card" :class="{ active: exportFormat === 'json' }" @click="exportFormat = 'json'">
                <span class="format-icon">📦</span>
                <div class="format-info">
                  <span class="format-name">JSON</span>
                  <span class="format-desc">{{ t('data.exportJson').replace('导出为 ', '') }}</span>
                </div>
                <div class="format-check" v-if="exportFormat === 'json'">
                  <i class="pi pi-check"></i>
                </div>
              </div>
              <div class="format-card" :class="{ active: exportFormat === 'markdown' }" @click="exportFormat = 'markdown'">
                <span class="format-icon">📝</span>
                <div class="format-info">
                  <span class="format-name">Markdown</span>
                  <span class="format-desc">{{ t('data.exportMarkdown').replace('导出为 ', '') }}</span>
                </div>
                <div class="format-check" v-if="exportFormat === 'markdown'">
                  <i class="pi pi-check"></i>
                </div>
              </div>
            </div>
          </div>

          <div class="filter-section">
            <label class="section-label">{{ t('data.filterConditions') }}</label>

            <div class="filter-row">
              <span class="filter-label">{{ t('data.date') }}</span>
              <div class="date-range">
                <DatePicker v-model="startDate" :placeholder="t('data.startDate')" dateFormat="yy-mm-dd" showIcon iconDisplay="input" class="date-picker" />
                <span>{{ t('data.to') }}</span>
                <DatePicker v-model="endDate" :placeholder="t('data.endDate')" dateFormat="yy-mm-dd" showIcon iconDisplay="input" class="date-picker" />
              </div>
            </div>

            <div class="filter-row" v-if="availableTags.length > 0">
              <span class="filter-label">{{ t('sidebar.tags') }}</span>
              <div class="tag-filters">
                <button v-for="tag in availableTags" :key="tag.name" class="tag-btn" :class="{ active: selectedTags.includes(tag.name) }" @click="toggleTag(tag.name)">
                  #{{ tag.name }}
                </button>
              </div>
            </div>

            <button class="btn-clear" @click="clearFilters" v-if="startDate || endDate || selectedTags.length > 0">
              {{ t('data.clearFilter') }}
            </button>
          </div>

          <div class="preview-section">
            <i class="pi pi-info-circle"></i>
            <span>{{ exportPreview }}</span>
          </div>

          <button class="btn-export" @click="handleExport" :disabled="isExporting">
            <i class="pi pi-download"></i>
            <span>{{ isExporting ? t('data.exporting') : t('data.startExport') }}</span>
          </button>
        </div>

        <div class="data-card import-card">
          <div class="card-header">
            <i class="pi pi-upload"></i>
            <h3>{{ t('data.import') }}</h3>
          </div>

          <div v-if="!importPreview" class="upload-section">
            <div class="upload-area" @click="handleSelectFile">
              <div class="upload-icon">
                <i class="pi pi-file-upload"></i>
              </div>
              <div class="upload-text">
                <span class="upload-title">{{ t('data.clickSelectFile') }}</span>
                <span class="upload-hint">{{ t('data.supportJson') }}</span>
              </div>
            </div>
          </div>

          <div v-else class="import-preview">
            <div class="preview-header">
              <i class="pi pi-file"></i>
              <span class="file-name">{{ importFileName }}</span>
              <button class="btn-cancel" @click="cancelImport">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <div class="preview-content">
              <div class="preview-stat">
                <span class="stat-num">{{ importPreview.memos.length }}</span>
                <span class="stat-text">{{ t('data.records') }}</span>
              </div>

              <div class="preview-list">
                <div v-for="(memo, index) in importPreview.memos.slice(0, 3)" :key="index" class="preview-item">
                  <span class="preview-date">{{ memo.created_at?.slice(0, 10) }}</span>
                  <span class="preview-content-text">
                    {{ memo.content?.slice(0, 40) }}{{ memo.content?.length > 40 ? '...' : '' }}
                  </span>
                </div>
                <div v-if="importPreview.memos.length > 3" class="preview-more">
                  + {{ importPreview.memos.length - 3 }} {{ t('data.records') }}
                </div>
              </div>
            </div>

            <button class="btn-import" @click="handleImport" :disabled="isImporting">
              <i class="pi pi-upload"></i>
              <span>{{ isImporting ? t('data.importing') : t('data.confirmImport') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.modal-backdrop {
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
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: var(--surface-ground);
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--surface-border);

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: var(--surface-card);
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color-secondary);
    transition: all 0.2s ease;

    &:hover {
      background: var(--surface-border);
      color: var(--text-color);
    }
  }
}

.stats-cards {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px 24px;
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;

  .stat-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;

    &.blue {
      background: rgba(79, 195, 247, 0.15);
      color: #0288d1;
    }

    &.green {
      background: rgba(129, 199, 132, 0.15);
      color: #388e3c;
    }

    &.orange {
      background: rgba(255, 183, 77, 0.15);
      color: #f57c00;
    }
  }

  .stat-info {
    display: flex;
    flex-direction: column;

    .stat-value {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-color);
    }

    .stat-label {
      font-size: 11px;
      color: var(--text-color-secondary);
    }
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;

  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.data-card {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;

  i {
    font-size: 18px;
    color: var(--primary-color);
  }

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
  }
}

.section-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 8px;
}

.format-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.format-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 2px solid var(--surface-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary-color);
  }

  &.active {
    border-color: var(--primary-color);
    background: rgba(79, 195, 247, 0.05);
  }

  .format-icon {
    font-size: 20px;
  }

  .format-info {
    flex: 1;
    display: flex;
    flex-direction: column;

    .format-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-color);
    }

    .format-desc {
      font-size: 11px;
      color: var(--text-color-secondary);
    }
  }

  .format-check {
    width: 18px;
    height: 18px;
    background: var(--primary-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 10px;
  }
}

.filter-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--surface-border);
}

.filter-row {
  margin-bottom: 12px;

  .filter-label {
    display: block;
    font-size: 11px;
    color: var(--text-color-secondary);
    margin-bottom: 6px;
  }
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  .date-picker {
    flex: 1;
    min-width: 140px;
  }

  span {
    color: var(--text-color-secondary);
    font-size: 12px;
  }
}

.tag-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .tag-btn {
    padding: 4px 10px;
    border: 1px solid var(--surface-border);
    border-radius: 12px;
    background: var(--surface-ground);
    color: var(--text-color-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    &.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }
  }
}

.btn-clear {
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: var(--text-color-secondary);
  font-size: 12px;
  cursor: pointer;

  &:hover {
    color: var(--primary-color);
  }
}

.preview-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px;
  background: rgba(79, 195, 247, 0.1);
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-color);

  i {
    color: var(--primary-color);
  }
}

.btn-export,
.btn-import {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  margin-top: 16px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-export {
  background: linear-gradient(135deg, #4FC3F7 0%, #29b6f6 100%);
  color: white;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #29b6f6 0%, #0288d1 100%);
  }
}

.btn-import {
  background: linear-gradient(135deg, #81C784 0%, #66bb6a 100%);
  color: white;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #66bb6a 0%, #4caf50 100%);
  }
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  border: 2px dashed var(--surface-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary-color);
    background: rgba(79, 195, 247, 0.05);
  }

  .upload-icon {
    width: 50px;
    height: 50px;
    background: rgba(129, 199, 132, 0.15);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;

    i {
      font-size: 20px;
      color: #388e3c;
    }
  }

  .upload-text {
    display: flex;
    flex-direction: column;
    align-items: center;

    .upload-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-color);
    }

    .upload-hint {
      font-size: 12px;
      color: var(--text-color-secondary);
      margin-top: 2px;
    }
  }
}

.import-preview {
  .preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px;
    background: var(--surface-ground);
    border-radius: 8px;

    i {
      font-size: 16px;
      color: var(--primary-color);
    }

    .file-name {
      flex: 1;
      font-size: 13px;
      color: var(--text-color);
    }

    .btn-cancel {
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--text-color-secondary);
      border-radius: 4px;

      &:hover {
        background: var(--surface-border);
        color: var(--text-color);
      }
    }
  }

  .preview-content {
    margin-top: 12px;
    padding: 12px;
    background: var(--surface-ground);
    border-radius: 8px;
  }

  .preview-stat {
    text-align: center;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--surface-border);
    margin-bottom: 10px;

    .stat-num {
      font-size: 24px;
      font-weight: 600;
      color: var(--primary-color);
    }

    .stat-text {
      font-size: 12px;
      color: var(--text-color-secondary);
    }
  }

  .preview-list {
    .preview-item {
      display: flex;
      gap: 10px;
      padding: 6px 0;
      font-size: 12px;

      .preview-date {
        color: var(--text-color-secondary);
        flex-shrink: 0;
      }

      .preview-content-text {
        color: var(--text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .preview-more {
      font-size: 11px;
      color: var(--text-color-secondary);
      padding-top: 6px;
    }
  }
}
</style>
