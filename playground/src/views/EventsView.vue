<template>
  <DemoContainer
    title="事件监听"
    description="演示 Excel Viewer 支持的各种事件，包括加载、点击、选区变化等"
    :native-code="nativeCode"
    :vue-code="vueCode"
  />
</template>

<script setup lang="ts">
import DemoContainer from '../components/DemoContainer.vue';

const nativeCode = `import { ExcelViewer } from '@excel-viewer/core';

const viewer = new ExcelViewer({
  container: '#excel-container'
});

// 加载完成事件
viewer.on('load', (data) => {
  console.log('工作簿:', data.workbook);
  console.log('工作表数量:', data.workbook.sheets.length);
  console.log('加载耗时:', data.loadTime, 'ms');
});

// 加载错误事件
viewer.on('loadError', (data) => {
  console.error('加载失败:', data.message);
  console.error('错误对象:', data.error);
});

// 工作表切换事件
viewer.on('sheetChange', (data) => {
  console.log('切换到工作表:', data.sheetName);
  console.log('工作表索引:', data.sheetIndex);
  console.log('之前的索引:', data.previousIndex);
});

// 单元格点击事件
viewer.on('cellClick', (data) => {
  console.log('点击单元格:', data.address);
  console.log('单元格内容:', data.cell?.text);
  console.log('行:', data.row, '列:', data.col);
});

// 单元格双击事件
viewer.on('cellDoubleClick', (data) => {
  console.log('双击单元格:', data.address);
});

// 单元格右键事件
viewer.on('cellRightClick', (data) => {
  console.log('右键单元格:', data.address);
});

// 选区变化事件
viewer.on('selectionChange', (data) => {
  console.log('选区变化:', data.selection);
  console.log('活动单元格:', data.activeCell);
});

// 缩放事件
viewer.on('zoom', (data) => {
  console.log('缩放比例:', data.zoom);
  console.log('之前比例:', data.previousZoom);
});

// 滚动事件
viewer.on('scroll', (data) => {
  console.log('滚动位置:', data.scrollLeft, data.scrollTop);
});

// 取消监听
const unsubscribe = viewer.on('cellClick', handler);
unsubscribe(); // 取消该监听`;

const vueCode = `<template>
  <ExcelViewer
    :file="currentFile"
    width="100%"
    height="100%"
    @load="handleLoad"
    @load-error="handleError"
    @sheet-change="handleSheetChange"
    @cell-click="handleCellClick"
    @cell-double-click="handleDoubleClick"
    @cell-right-click="handleRightClick"
    @selection-change="handleSelectionChange"
    @zoom-change="handleZoomChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ExcelViewer } from '@excel-viewer/vue';
import type {
  LoadEvent,
  LoadErrorEvent,
  SheetChangeEvent,
  CellClickEvent,
  SelectionChangeEvent,
  ZoomEvent
} from '@excel-viewer/vue';

const currentFile = ref<File | null>(null);

const handleLoad = (data: LoadEvent) => {
  console.log('加载完成:', data.workbook);
};

const handleError = (data: LoadErrorEvent) => {
  console.error('加载失败:', data.message);
};

const handleSheetChange = (data: SheetChangeEvent) => {
  console.log('切换工作表:', data.sheetName);
};

const handleCellClick = (data: CellClickEvent) => {
  console.log('点击:', data.address);
};

const handleDoubleClick = (data: CellClickEvent) => {
  console.log('双击:', data.address);
};

const handleRightClick = (data: CellClickEvent) => {
  console.log('右键:', data.address);
};

const handleSelectionChange = (data: SelectionChangeEvent) => {
  console.log('选区变化:', data.selection);
};

const handleZoomChange = (data: ZoomEvent) => {
  console.log('缩放:', data.zoom);
};
<\/script>`;
</script>
