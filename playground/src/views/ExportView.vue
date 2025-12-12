<template>
  <DemoContainer
    title="导出功能"
    description="演示数据导出功能，支持导出为 CSV、HTML 等格式"
    :native-code="nativeCode"
    :vue-code="vueCode"
  />
</template>

<script setup lang="ts">
import DemoContainer from '../components/DemoContainer.vue';

const nativeCode = `import { ExcelViewer } from '@excel-viewer/core';

const viewer = new ExcelViewer({
  container: '#excel-container',
  toolbar: {
    visible: true,
    showExport: true,
    showPrint: true
  }
});

// 导出为 CSV
const exportToCsv = () => {
  const workbook = viewer.getWorkbook();
  const sheet = viewer.getCurrentSheet();
  
  if (!sheet) return;
  
  const rows: string[] = [];
  const maxRow = sheet.dimension?.end.row ?? 0;
  const maxCol = sheet.dimension?.end.col ?? 0;
  
  for (let row = 0; row <= maxRow; row++) {
    const cols: string[] = [];
    for (let col = 0; col <= maxCol; col++) {
      const address = getAddress(row, col);
      const cell = sheet.cells.get(address);
      cols.push(cell?.text ?? '');
    }
    rows.push(cols.join(','));
  }
  
  const csv = rows.join('\\n');
  downloadFile(csv, 'export.csv', 'text/csv');
};

// 导出为 HTML
const exportToHtml = () => {
  const sheet = viewer.getCurrentSheet();
  if (!sheet) return;
  
  // 获取渲染后的 HTML
  const html = document.querySelector('.excel-table')?.outerHTML;
  if (html) {
    downloadFile(html, 'export.html', 'text/html');
  }
};

// 打印
const print = () => {
  viewer.print();
};

// 下载文件
function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// 获取单元格地址
function getAddress(row: number, col: number): string {
  let colStr = '';
  let c = col + 1;
  while (c > 0) {
    const remainder = (c - 1) % 26;
    colStr = String.fromCharCode(65 + remainder) + colStr;
    c = Math.floor((c - 1) / 26);
  }
  return \`\${colStr}\${row + 1}\`;
}`;

const vueCode = `<template>
  <div class="export-demo">
    <div class="export-actions">
      <button @click="exportCsv">导出 CSV</button>
      <button @click="exportHtml">导出 HTML</button>
      <button @click="printSheet">打印</button>
    </div>
    
    <ExcelViewer
      ref="viewerRef"
      :file="currentFile"
      :toolbar="{ showExport: true, showPrint: true }"
      width="100%"
      height="calc(100% - 60px)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ExcelViewer } from '@excel-viewer/vue';

const currentFile = ref<File | null>(null);
const viewerRef = ref<InstanceType<typeof ExcelViewer> | null>(null);

const exportCsv = () => {
  const viewer = viewerRef.value?.getViewer();
  const sheet = viewer?.getCurrentSheet();
  
  if (!sheet) return;
  
  // 构建 CSV 内容
  const rows: string[] = [];
  sheet.cells.forEach((cell, address) => {
    // 简化示例
  });
  
  console.log('导出 CSV');
};

const exportHtml = () => {
  console.log('导出 HTML');
};

const printSheet = () => {
  viewerRef.value?.print();
};
<\/script>`;
</script>
