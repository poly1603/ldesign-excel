<template>
  <DemoContainer
    title="工具栏"
    description="展示 Excel Viewer 的完整工具栏功能，包含格式化、对齐、合并单元格等操作"
    :native-code="nativeCode"
    :vue-code="vueCode"
  />
</template>

<script setup lang="ts">
import DemoContainer from '../components/DemoContainer.vue';

const nativeCode = `import { ExcelViewer, SpreadsheetToolbar } from '@excel-viewer/core';

// 方式一：使用内置工具栏
const viewer = new ExcelViewer({
  container: '#excel-container',
  toolbar: {
    visible: true,
    showZoom: true,
    showFullscreen: true,
    showPrint: true,
    showExport: true
  }
});

// 方式二：自定义工具栏
const toolbar = new SpreadsheetToolbar(
  document.querySelector('#toolbar-container'),
  {
    fileName: '我的工作簿.xlsx',
    sheetCount: 3,
    zoom: 100,
    onAction: (action) => {
      console.log('工具栏操作:', action.id, action.value);
      // 根据 action.id 执行相应操作
    },
    onZoomChange: (zoom) => {
      viewer.setZoom(zoom);
    },
    onOpenFile: () => {
      // 打开文件选择器
    }
  }
);

// 更新工具栏状态
toolbar.setFileName('新文件名.xlsx');
toolbar.setSheetCount(5);
toolbar.setZoom(150);`;

const vueCode = `<template>
  <ExcelViewer
    :file="currentFile"
    :toolbar="toolbarConfig"
    width="100%"
    height="100%"
  />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ExcelViewer } from '@excel-viewer/vue';
import type { ToolbarConfig } from '@excel-viewer/vue';

const currentFile = ref<File | null>(null);

// 工具栏配置
const toolbarConfig = reactive<Partial<ToolbarConfig>>({
  visible: true,
  showZoom: true,
  showFullscreen: true,
  showPrint: true,
  showExport: true,
  showSearch: true,
  showSheetTabs: true
});
<\/script>`;
</script>
