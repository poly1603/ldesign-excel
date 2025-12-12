<template>
  <div class="demo-container">
    <!-- 页面标题 -->
    <header class="demo-header">
      <div class="header-info">
        <h1 class="demo-title">{{ title }}</h1>
        <p class="demo-description">{{ description }}</p>
      </div>
    </header>

    <!-- 标签切换 -->
    <div class="demo-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'native' }"
        @click="activeTab = 'native'"
      >
        <Code2 :size="16" />
        <span>原生 JS</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'vue' }"
        @click="activeTab = 'vue'"
      >
        <Component :size="16" />
        <span>Vue 组件</span>
      </button>
      <div class="tab-actions">
        <button class="action-btn" @click="showCodePanel = !showCodePanel">
          <FileCode :size="16" />
          <span>{{ showCodePanel ? '隐藏代码' : '查看代码' }}</span>
        </button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="demo-body" :class="{ 'with-code': showCodePanel }">
      <!-- 预览区 -->
      <div class="preview-panel">
        <!-- 文件选择区 -->
        <div v-if="!currentFile" class="file-picker" @drop.prevent="handleDrop" @dragover.prevent="isDragOver = true" @dragleave="isDragOver = false" :class="{ 'drag-over': isDragOver }">
          <div class="picker-content">
            <FileUp :size="48" class="picker-icon" />
            <h3>选择或拖放 Excel 文件</h3>
            <p>支持 .xlsx, .xls 格式</p>
            <button class="picker-btn" @click="selectFile">
              <Upload :size="16" />
              <span>选择文件</span>
            </button>
          </div>
        </div>

        <!-- 渲染区 -->
        <div v-else class="render-area">
          <div class="render-toolbar">
            <div class="file-info">
              <FileSpreadsheet :size="16" />
              <span>{{ currentFile.name }}</span>
            </div>
            <button class="toolbar-btn" @click="resetFile">
              <X :size="16" />
              <span>关闭</span>
            </button>
          </div>
          <div class="render-content">
            <!-- Native JS 渲染 -->
            <div v-if="activeTab === 'native'" ref="nativeContainerRef" class="native-render"></div>
            <!-- Vue 组件渲染 -->
            <ExcelViewer
              v-if="activeTab === 'vue'"
              :file="currentFile"
              width="100%"
              height="100%"
              @load="handleLoad"
              @load-error="handleError"
            />
          </div>
        </div>
      </div>

      <!-- 代码面板 -->
      <div v-if="showCodePanel" class="code-panel">
        <div class="code-tabs">
          <button
            class="code-tab"
            :class="{ active: codeTab === 'native' }"
            @click="codeTab = 'native'"
          >
            原生 JS
          </button>
          <button
            class="code-tab"
            :class="{ active: codeTab === 'vue' }"
            @click="codeTab = 'vue'"
          >
            Vue
          </button>
        </div>
        <div class="code-content">
          <pre><code v-html="highlightedCode"></code></pre>
        </div>
        <button class="copy-btn" @click="copyCode">
          <Copy :size="14" />
          <span>复制代码</span>
        </button>
      </div>
    </div>

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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { ExcelViewer } from '@excel-viewer/vue';
import { ExcelViewer as CoreExcelViewer } from '@excel-viewer/core';
import type { LoadEvent, LoadErrorEvent } from '@excel-viewer/vue';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';
import {
  Code2,
  Component,
  FileCode,
  FileUp,
  Upload,
  FileSpreadsheet,
  X,
  Copy
} from 'lucide-vue-next';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('xml', xml);

const props = defineProps<{
  title: string;
  description: string;
  nativeCode: string;
  vueCode: string;
}>();

const emit = defineEmits<{
  (e: 'load', data: LoadEvent): void;
  (e: 'error', data: LoadErrorEvent): void;
}>();

// 状态
const activeTab = ref<'native' | 'vue'>('vue');
const showCodePanel = ref(false);
const codeTab = ref<'native' | 'vue'>('native');
const currentFile = ref<File | null>(null);
const isDragOver = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const nativeContainerRef = ref<HTMLElement | null>(null);

// 原生 JS 渲染器实例
let nativeViewer: CoreExcelViewer | null = null;

// 高亮代码
const highlightedCode = computed(() => {
  const code = codeTab.value === 'native' ? props.nativeCode : props.vueCode;
  const lang = codeTab.value === 'native' ? 'javascript' : 'xml';
  return hljs.highlight(code, { language: lang }).value;
});

// 选择文件
const selectFile = () => {
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
const loadFile = async (file: File) => {
  // 先销毁旧的 native viewer
  if (nativeViewer) {
    nativeViewer.destroy();
    nativeViewer = null;
  }
  
  currentFile.value = file;
  
  // 如果当前是原生模式，初始化原生渲染器
  if (activeTab.value === 'native') {
    await nextTick();
    await initAndLoadNative(file);
  }
};

// 初始化并加载原生渲染器
const initAndLoadNative = async (file: File) => {
  await nextTick();
  if (!nativeContainerRef.value) return;
  
  nativeViewer = new CoreExcelViewer({
    container: nativeContainerRef.value,
    toolbar: { visible: true },
    readonly: false,
    renderOptions: {
      zoom: 1.5  // 与 Vue 组件保持一致
    }
  });
  
  await nativeViewer.loadFile(file);
};


// 重置文件
const resetFile = () => {
  currentFile.value = null;
  if (nativeViewer) {
    nativeViewer.destroy();
    nativeViewer = null;
  }
};

// 加载完成
const handleLoad = (data: LoadEvent) => {
  emit('load', data);
};

// 加载失败
const handleError = (data: LoadErrorEvent) => {
  emit('error', data);
  alert('加载失败: ' + data.message);
};

// 复制代码
const copyCode = async () => {
  const code = codeTab.value === 'native' ? props.nativeCode : props.vueCode;
  await navigator.clipboard.writeText(code);
  alert('代码已复制');
};

// 切换标签时处理
watch(activeTab, async (newTab, oldTab) => {
  // 切换到原生模式时，初始化并加载
  if (newTab === 'native' && currentFile.value) {
    // 先销毁旧实例
    if (nativeViewer) {
      nativeViewer.destroy();
      nativeViewer = null;
    }
    await initAndLoadNative(currentFile.value);
  }
  
  // 离开原生模式时，销毁实例释放资源
  if (oldTab === 'native' && nativeViewer) {
    nativeViewer.destroy();
    nativeViewer = null;
  }
});

// 清理
onUnmounted(() => {
  if (nativeViewer) {
    nativeViewer.destroy();
    nativeViewer = null;
  }
});
</script>

<style scoped>
.demo-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.demo-header {
  padding: 24px 32px 16px;
  border-bottom: 1px solid var(--border-color);
}

.demo-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
}

.demo-description {
  font-size: 14px;
  color: var(--text-secondary);
}

.demo-tabs {
  display: flex;
  align-items: center;
  padding: 0 32px;
  border-bottom: 1px solid var(--border-color);
  background: #fafafa;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  background: none;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.15s;
}

.tab-btn:hover {
  color: var(--text-color);
}

.tab-btn.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.tab-actions {
  margin-left: auto;
  padding: 8px 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.demo-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.demo-body.with-code .preview-panel {
  width: 60%;
}

.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-picker {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border: 2px dashed #e5e7eb;
  margin: 24px;
  border-radius: 12px;
  transition: all 0.2s;
}

.file-picker.drag-over {
  border-color: var(--primary-color);
  background: #f0fdf4;
}

.picker-content {
  text-align: center;
}

.picker-icon {
  color: #9ca3af;
  margin-bottom: 16px;
}

.picker-content h3 {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 8px;
}

.picker-content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.picker-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  background: var(--primary-color);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.picker-btn:hover {
  background: var(--primary-hover);
}

.render-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.render-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid var(--border-color);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-color);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.toolbar-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.render-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.native-render {
  width: 100%;
  height: 100%;
}

/* 代码面板 */
.code-panel {
  width: 40%;
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  background: #1e1e2d;
  position: relative;
}

.code-tabs {
  display: flex;
  background: #15151f;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.code-tab {
  padding: 12px 20px;
  border: none;
  background: none;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}

.code-tab:hover {
  color: rgba(255, 255, 255, 0.8);
}

.code-tab.active {
  color: #fff;
  border-bottom-color: var(--primary-color);
}

.code-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.code-content pre {
  margin: 0;
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.code-content code {
  color: #e5e7eb;
}

.copy-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.hidden-input {
  display: none;
}
</style>
