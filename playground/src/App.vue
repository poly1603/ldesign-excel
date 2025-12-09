<template>
  <div class="app">
    <!-- 顶部工具栏 -->
    <header class="toolbar">
      <div class="toolbar-left">
        <div class="logo">
          <span class="logo-icon">📊</span>
          <span class="logo-text">Excel 预览器</span>
        </div>
        <div class="file-name" v-if="fileName">{{ fileName }}</div>
      </div>
      <div class="toolbar-center">
        <button class="tool-btn" @click="openFile">
          <span>📁</span>
          <span>打开文件</span>
        </button>
        <template v-if="isLoaded">
          <button class="tool-btn" @click="zoomOut">➖</button>
          <span class="zoom-label">{{ Math.round(zoom * 100) }}%</span>
          <button class="tool-btn" @click="zoomIn">➕</button>
        </template>
      </div>
      <div class="toolbar-right">
        <span class="sheet-info" v-if="sheetCount > 0">
          {{ sheetCount }} 个工作表
        </span>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 空状态 - 拖放区域 -->
      <div 
        v-if="!currentFile" 
        class="empty-state" 
        :class="{ 'drag-over': isDragOver }"
        @drop.prevent="handleDrop" 
        @dragover.prevent="isDragOver = true" 
        @dragleave="isDragOver = false"
      >
        <div class="empty-icon">📄</div>
        <h2>拖放 Excel 文件到这里</h2>
        <p>支持 .xlsx 格式</p>
        <button class="primary-btn" @click="openFile">选择文件</button>
      </div>

      <!-- Excel 查看器 -->
      <ExcelViewer
        v-if="currentFile"
        ref="viewerRef"
        :file="currentFile"
        v-model:zoom="zoom"
        width="100%"
        height="100%"
        @load="handleLoad"
        @load-error="handleError"
      />

      <!-- 加载中 (覆盖在查看器上) -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>正在加载...</p>
      </div>
    </main>

    <input
      ref="fileInputRef"
      type="file"
      accept=".xlsx,.xls"
      class="hidden-input"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ExcelViewer } from '@excel-viewer/vue';
import type { LoadEvent, LoadErrorEvent } from '@excel-viewer/vue';

// 状态
const fileInputRef = ref<HTMLInputElement | null>(null);
const viewerRef = ref<InstanceType<typeof ExcelViewer> | null>(null);
const currentFile = ref<File | null>(null);
const fileName = ref('');
const isLoading = ref(false);
const isLoaded = ref(false);
const isDragOver = ref(false);
const zoom = ref(1.5);
const sheetCount = ref(0);

// 打开文件对话框
const openFile = () => {
  fileInputRef.value?.click();
};

// 处理文件选择
const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    loadFile(file);
  }
  input.value = '';
};

// 处理拖放
const handleDrop = (e: DragEvent) => {
  isDragOver.value = false;
  const file = e.dataTransfer?.files[0];
  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    loadFile(file);
  }
};

// 加载文件
const loadFile = (file: File) => {
  console.log('loadFile called:', file.name);
  isLoading.value = true;
  fileName.value = file.name;
  currentFile.value = file;
};

// 加载完成
const handleLoad = (data: LoadEvent) => {
  isLoading.value = false;
  isLoaded.value = true;
  sheetCount.value = data.workbook.sheets.length;
  console.log('Excel 加载完成:', data.workbook);
};

// 加载失败
const handleError = (data: LoadErrorEvent) => {
  isLoading.value = false;
  isLoaded.value = false;
  currentFile.value = null;
  alert('加载失败: ' + data.message);
  console.error('加载失败:', data.error);
};

// 缩放
const zoomIn = () => viewerRef.value?.zoomIn();
const zoomOut = () => viewerRef.value?.zoomOut();
</script>

<style>
:root {
  --primary-color: #217346;
  --primary-hover: #1a5c38;
  --border-color: #e1e1e1;
  --text-color: #333;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--text-color);
}

.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  height: 48px;
}

.toolbar-left, .toolbar-center, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.file-name {
  font-size: 13px;
  opacity: 0.9;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 13px;
  cursor: pointer;
}

.tool-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.zoom-label {
  min-width: 50px;
  text-align: center;
  font-size: 12px;
}

.sheet-info {
  font-size: 12px;
  opacity: 0.8;
}

.main-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
}

.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.empty-state.drag-over {
  background: #e8f5e9;
  border: 2px dashed var(--primary-color);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-state h2 {
  font-size: 20px;
  color: #555;
  margin-bottom: 8px;
}

.empty-state p {
  color: #888;
  margin-bottom: 24px;
}

.primary-btn {
  padding: 10px 28px;
  border: none;
  border-radius: 4px;
  background: var(--primary-color);
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.primary-btn:hover {
  background: var(--primary-hover);
}

.loading-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  z-index: 100;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.hidden-input {
  display: none;
}
</style>
