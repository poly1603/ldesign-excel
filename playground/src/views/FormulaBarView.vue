<template>
  <DemoContainer
    title="公式栏"
    description="展示公式栏功能，支持编辑单元格内容和公式"
    :native-code="nativeCode"
    :vue-code="vueCode"
  />
</template>

<script setup lang="ts">
import DemoContainer from '../components/DemoContainer.vue';

const nativeCode = `import { ExcelViewer, FormulaBar } from '@excel-viewer/core';

const viewer = new ExcelViewer({
  container: '#excel-container',
  toolbar: { visible: true }
});

// 公式栏会自动集成在工具栏中
// 也可以单独创建公式栏组件
const formulaBar = new FormulaBar(
  document.querySelector('#formula-bar-container'),
  {
    onValueChange: (value) => {
      // 实时预览输入值
      console.log('输入值变化:', value);
    },
    onConfirm: (value) => {
      // 确认输入（按回车）
      console.log('确认输入:', value);
      
      // 获取当前活动单元格
      const activeCell = viewer.domRenderer?.getActiveCell();
      if (activeCell) {
        viewer.domRenderer?.setCellValue(
          activeCell.row,
          activeCell.col,
          value
        );
      }
    }
  }
);

// 更新公式栏显示
formulaBar.setAddress('A1');
formulaBar.setValue('=SUM(B1:B10)');`;

const vueCode = `<template>
  <ExcelViewer
    ref="viewerRef"
    :file="currentFile"
    :toolbar="{ visible: true }"
    width="100%"
    height="100%"
    @cell-click="handleCellClick"
    @selection-change="handleSelectionChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ExcelViewer } from '@excel-viewer/vue';
import type { CellClickEvent, SelectionChangeEvent } from '@excel-viewer/vue';

const currentFile = ref<File | null>(null);
const viewerRef = ref<InstanceType<typeof ExcelViewer> | null>(null);

// 点击单元格时，公式栏会自动显示单元格内容
const handleCellClick = (data: CellClickEvent) => {
  console.log('选中单元格:', data.address);
  console.log('单元格值:', data.cell?.text);
  console.log('公式:', data.cell?.formula?.text);
};

// 选区变化
const handleSelectionChange = (data: SelectionChangeEvent) => {
  console.log('活动单元格:', data.activeCell);
  console.log('选区范围:', data.selection);
};
<\/script>`;
</script>
