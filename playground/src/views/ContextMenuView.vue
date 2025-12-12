<template>
  <DemoContainer
    title="右键菜单"
    description="演示单元格右键菜单功能，包含复制、粘贴、插入行列、合并单元格等操作"
    :native-code="nativeCode"
    :vue-code="vueCode"
  />
</template>

<script setup lang="ts">
import DemoContainer from '../components/DemoContainer.vue';

const nativeCode = `import { CellContextMenu, createCellContextMenu } from '@excel-viewer/core';

// 创建右键菜单
const contextMenu = new CellContextMenu({
  readonly: false,
  onAction: (action, cellInfo) => {
    console.log('菜单操作:', action.id);
    console.log('单元格信息:', cellInfo);
    
    switch (action.id) {
      case 'copy':
        // 复制选中单元格
        break;
      case 'paste':
        // 粘贴
        break;
      case 'insertRowAbove':
        // 在上方插入行
        break;
      case 'deleteRow':
        // 删除行
        break;
      case 'mergeAll':
        // 合并单元格
        break;
      case 'sortAsc':
        // 升序排序
        break;
    }
  }
});

// 显示菜单
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  contextMenu.show(e.clientX, e.clientY, {
    row: 0,
    col: 0,
    address: 'A1',
    value: 'Hello',
    hasSelection: true,
    selectionBounds: {
      startRow: 0,
      startCol: 0,
      endRow: 2,
      endCol: 3
    }
  });
});

// 添加自定义菜单项
contextMenu.addCustomItem({
  id: 'custom-action',
  label: '自定义操作',
  icon: '<svg>...</svg>',
  onClick: (cellInfo) => {
    console.log('自定义操作', cellInfo);
  }
});`;

const vueCode = `<template>
  <ExcelViewer
    :file="currentFile"
    width="100%"
    height="100%"
    @cell-right-click="handleRightClick"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ExcelViewer } from '@excel-viewer/vue';
import type { CellClickEvent } from '@excel-viewer/vue';

const currentFile = ref<File | null>(null);

// 处理右键点击
const handleRightClick = (data: CellClickEvent) => {
  console.log('右键点击单元格:', data.address);
  console.log('单元格内容:', data.cell?.text);
  console.log('行:', data.row, '列:', data.col);
  
  // 内置右键菜单会自动显示
  // 如需自定义，可以阻止默认行为并显示自定义菜单
};
<\/script>`;
</script>
