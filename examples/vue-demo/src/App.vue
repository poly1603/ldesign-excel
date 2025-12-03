<template>
  <div class="app">
    <header class="app-header">
      <h1>📊 Excel渲染插件示例</h1>
      <div class="controls">
        <input
          type="file"
          ref="fileInputRef"
          accept=".xlsx,.xls,.csv"
          @change="handleFileChange"
          class="file-input"
        />
        <button @click="selectFile" class="btn btn-primary">
          📁 选择Excel文件
        </button>
        <button @click="toggleTheme" class="btn btn-secondary">
          {{ currentTheme === 'light' ? '🌙 暗色' : '☀️ 亮色' }}
        </button>
        <button @click="toggleLocale" class="btn btn-secondary">
          {{ currentLocale === 'zh-CN' ? '🇨🇳 中文' : '🇺🇸 English' }}
        </button>
      </div>
    </header>

    <main class="app-main">
      <div v-if="!file" class="empty-state">
        <div class="empty-icon">📄</div>
        <h2>请选择一个Excel文件</h2>
        <p>支持 .xlsx, .xls, .csv 格式</p>
        <button @click="selectFile" class="btn btn-primary btn-lg">
          选择文件
        </button>
      </div>

      <ExcelViewer
        v-else
        :file="file"
        :theme="currentTheme"
        :locale="currentLocale"
        :editable="false"
        @load="handleLoad"
        @error="handleError"
        @cell-click="handleCellClick"
        class="excel-viewer"
      />
    </main>

    <footer v-if="workbookInfo" class="app-footer">
      <div class="info-item">
        <span class="label">工作表:</span>
        <span class="value">{{ workbookInfo.sheetCount }}</span>
      </div>
      <div class="info-item">
        <span class="label">当前工作表:</span>
        <span class="value">{{ workbookInfo.currentSheet }}</span>
      </div>
      <div v-if="selectedCell" class="info-item">
        <span class="label">选中单元格:</span>
        <span class="value">{{ selectedCell.ref }} = {{ selectedCell.value }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ExcelViewer } from '@excel-renderer/vue'
import type { WorkbookData } from '@excel-renderer/vue'

// Refs
const fileInputRef = ref<HTMLInputElement>()
const file = ref<File>()
const currentTheme = ref<'light' | 'dark'>('light')
const currentLocale = ref<'zh-CN' | 'en-US'>('zh-CN')
const workbookInfo = ref<{
  sheetCount: number
  currentSheet: string
} | null>(null)
const selectedCell = ref<{
  ref: string
  value: any
} | null>(null)

/**
 * 选择文件
 */
function selectFile() {
  fileInputRef.value?.click()
}

/**
 * 处理文件选择
 */
function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const selectedFile = target.files?.[0]
  if (selectedFile) {
    file.value = selectedFile
    selectedCell.value = null
  }
}

/**
 * 切换主题
 */
function toggleTheme() {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
}

/**
 * 切换语言
 */
function toggleLocale() {
  currentLocale.value = currentLocale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
}

/**
 * 处理加载完成
 */
function handleLoad(workbook: WorkbookData) {
  console.log('Excel文件加载完成:', workbook)
  workbookInfo.value = {
    sheetCount: workbook.sheets.length,
    currentSheet: workbook.sheets[0]?.name || '',
  }
}

/**
 * 处理错误
 */
function handleError(error: Error) {
  console.error('Excel加载错误:', error)
  alert(`加载失败: ${error.message}`)
}

/**
 * 处理单元格点击
 */
function handleCellClick(event: any) {
  console.log('点击单元格:', event)
  selectedCell.value = {
    ref: event.cell.ref,
    value: event.cell.displayValue || event.cell.value,
  }
}
</script>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.app-header {
  background: white;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.file-input {
  display: none;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background: #4285f4;
  color: white;
}

.btn-primary:hover {
  background: #3367d6;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.app-main {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  margin: 0 0 0.5rem;
  color: #333;
}

.empty-state p {
  margin: 0 0 2rem;
  color: #999;
}

.excel-viewer {
  width: 100%;
  height: 100%;
}

.app-footer {
  background: white;
  padding: 0.75rem 2rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 2rem;
  font-size: 0.9rem;
}

.info-item {
  display: flex;
  gap: 0.5rem;
}

.info-item .label {
  color: #666;
  font-weight: 500;
}

.info-item .value {
  color: #333;
  font-weight: 600;
}
</style>