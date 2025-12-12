<template>
  <DemoContainer
    title="选区操作"
    description="演示单元格选区功能，支持单选、多选、范围选择、拖拽选择等"
    :native-code="nativeCode"
    :vue-code="vueCode"
  />
</template>

<script setup lang="ts">
import DemoContainer from '../components/DemoContainer.vue';

const nativeCode = `import { ExcelViewer, SelectionManager } from '@excel-viewer/core';

const viewer = new ExcelViewer({
  container: '#excel-container',
  enableSelection: true
});

// 获取选区管理器
const selectionManager = viewer.domRenderer?.getSelectionManager();

// 选择单个单元格
selectionManager?.selectCell(0, 0); // 选择 A1

// 选择范围
selectionManager?.selectRange({
  start: { row: 0, col: 0 },
  end: { row: 4, col: 3 }
}); // 选择 A1:D5

// 添加到选区（Ctrl+点击）
selectionManager?.addToSelection({
  start: { row: 10, col: 0 },
  end: { row: 10, col: 0 }
});

// 选择整行
selectionManager?.selectRow(5); // 选择第6行

// 选择整列
selectionManager?.selectCol(2); // 选择第C列

// 全选
selectionManager?.selectAll();

// 获取当前选区
const selection = selectionManager?.getSelection();
console.log('活动单元格:', selection?.activeCell);
console.log('选区范围:', selection?.ranges);

// 获取选区边界
const bounds = selectionManager?.getSelectionBounds();
console.log('起始行:', bounds?.start.row);
console.log('结束列:', bounds?.end.col);

// 清除选区
selectionManager?.clearSelection();`;

const vueCode = `<template>
  <ExcelViewer
    ref="viewerRef"
    :file="currentFile"
    :enable-selection="true"
    width="100%"
    height="100%"
    @selection-change="handleSelectionChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ExcelViewer } from '@excel-viewer/vue';
import type { SelectionChangeEvent } from '@excel-viewer/vue';

const currentFile = ref<File | null>(null);
const viewerRef = ref<InstanceType<typeof ExcelViewer> | null>(null);

// 选区变化事件
const handleSelectionChange = (data: SelectionChangeEvent) => {
  console.log('活动单元格:', data.activeCell);
  console.log('选区列表:', data.selection);
  
  // 获取选区范围
  data.selection.forEach((range, index) => {
    console.log(\`选区\${index + 1}:\`, 
      \`\${getColumnLabel(range.start.col)}\${range.start.row + 1}:\` +
      \`\${getColumnLabel(range.end.col)}\${range.end.row + 1}\`
    );
  });
};

// 列号转字母
const getColumnLabel = (col: number): string => {
  let label = '';
  let c = col + 1;
  while (c > 0) {
    const remainder = (c - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    c = Math.floor((c - 1) / 26);
  }
  return label;
};
<\/script>`;
</script>
