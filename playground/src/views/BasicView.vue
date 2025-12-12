<template>
  <DemoContainer
    title="基础用法"
    description="演示 Excel Viewer 的基本使用方法，支持原生 JS 和 Vue 组件两种方式"
    :native-code="nativeCode"
    :vue-code="vueCode"
  />
</template>

<script setup lang="ts">
import DemoContainer from '../components/DemoContainer.vue';

const nativeCode = `import { ExcelViewer } from '@excel-viewer/core';

// 创建 Excel 查看器实例
const viewer = new ExcelViewer({
  container: '#excel-container',
  toolbar: { visible: true },
  readonly: false
});

// 加载文件
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    await viewer.loadFile(file);
  }
});

// 监听事件
viewer.on('load', (data) => {
  console.log('加载完成:', data.workbook);
});

viewer.on('cellClick', (data) => {
  console.log('单元格点击:', data.address);
});

// 销毁实例
// viewer.destroy();`;

const vueCode = `<template>
  <ExcelViewer
    :file="currentFile"
    :toolbar="{ visible: true }"
    :readonly="false"
    width="100%"
    height="100%"
    @load="handleLoad"
    @cell-click="handleCellClick"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ExcelViewer } from '@excel-viewer/vue';
import type { LoadEvent, CellClickEvent } from '@excel-viewer/vue';

const currentFile = ref<File | null>(null);

const handleLoad = (data: LoadEvent) => {
  console.log('加载完成:', data.workbook);
};

const handleCellClick = (data: CellClickEvent) => {
  console.log('单元格点击:', data.address);
};
<\/script>`;
</script>
