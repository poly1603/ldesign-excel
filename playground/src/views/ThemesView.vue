<template>
  <DemoContainer
    title="主题样式"
    description="展示 Excel Viewer 的主题配置功能，支持自定义颜色、字体等样式"
    :native-code="nativeCode"
    :vue-code="vueCode"
  />
</template>

<script setup lang="ts">
import DemoContainer from '../components/DemoContainer.vue';

const nativeCode = `import { ExcelViewer, RENDER_THEMES } from '@excel-viewer/core';

// 使用内置主题
const viewer = new ExcelViewer({
  container: '#excel-container',
  renderOptions: {
    theme: 'excel' // 'excel' | 'wps' | 'google'
  }
});

// 查看内置主题
console.log('Excel 主题:', RENDER_THEMES.excel);
console.log('WPS 主题:', RENDER_THEMES.wps);
console.log('Google 主题:', RENDER_THEMES.google);

// 自定义主题
const customTheme = {
  backgroundColor: '#ffffff',
  gridLineColor: '#e0e0e0',
  headerBackground: '#f5f5f5',
  headerTextColor: '#333333',
  selectionColor: 'rgba(26, 115, 232, 0.15)',
  selectionBorderColor: '#1a73e8',
  textColor: '#333333'
};

const viewerWithCustomTheme = new ExcelViewer({
  container: '#excel-container',
  renderOptions: {
    theme: customTheme,
    showGridLines: true,
    showRowColHeaders: true,
    defaultFont: '微软雅黑',
    defaultFontSize: 14,
    defaultColWidth: 100,
    defaultRowHeight: 28
  }
});

// 动态更改主题
viewerWithCustomTheme.setZoom(1.5);`;

const vueCode = `<template>
  <div class="theme-demo">
    <div class="theme-selector">
      <label>选择主题：</label>
      <select v-model="currentTheme">
        <option value="excel">Excel 风格</option>
        <option value="wps">WPS 风格</option>
        <option value="google">Google 风格</option>
        <option value="custom">自定义主题</option>
      </select>
    </div>
    
    <ExcelViewer
      :file="currentFile"
      :render-options="renderOptions"
      width="100%"
      height="calc(100% - 60px)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ExcelViewer } from '@excel-viewer/vue';
import type { RenderOptions } from '@excel-viewer/vue';

const currentFile = ref<File | null>(null);
const currentTheme = ref<string>('excel');

// 自定义主题
const customTheme = {
  backgroundColor: '#1e1e2d',
  gridLineColor: '#3a3a4d',
  headerBackground: '#2a2a3d',
  headerTextColor: '#ffffff',
  selectionColor: 'rgba(16, 185, 129, 0.2)',
  selectionBorderColor: '#10b981',
  textColor: '#e5e7eb'
};

// 渲染选项
const renderOptions = computed<Partial<RenderOptions>>(() => ({
  theme: currentTheme.value === 'custom' 
    ? customTheme 
    : currentTheme.value as 'excel' | 'wps' | 'google',
  showGridLines: true,
  showRowColHeaders: true,
  defaultFont: '微软雅黑',
  defaultFontSize: 14
}));
<\/script>

<style scoped>
.theme-demo {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.theme-selector {
  padding: 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-selector select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}
</style>`;
</script>
