# @excel-viewer/vue

Excel 文档查看器 Vue 3 组件，基于 @excel-viewer/core 封装。

## 特性

- 🎯 **Vue 3 组件** - 开箱即用的 Vue 3 组件
- 🪝 **Composables** - 提供 useExcelViewer、useFileDrop 等 hooks
- 📦 **TypeScript** - 完整的类型定义
- 🔄 **响应式** - 支持 v-model 双向绑定
- 🎨 **插槽支持** - 自定义加载和错误状态

## 安装

```bash
npm install @excel-viewer/vue
# 或
pnpm add @excel-viewer/vue
# 或
yarn add @excel-viewer/vue
```

## 快速开始

### 组件方式

```vue
<template>
  <ExcelViewer
    :src="fileUrl"
    :width="800"
    :height="600"
    v-model:zoom="zoom"
    v-model:sheet-index="sheetIndex"
    @load="handleLoad"
    @cell-click="handleCellClick"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ExcelViewer } from '@excel-viewer/vue';
import '@excel-viewer/vue/styles';

const fileUrl = ref('/path/to/file.xlsx');
const zoom = ref(1);
const sheetIndex = ref(0);

const handleLoad = (data) => {
  console.log('加载完成', data.workbook);
};

const handleCellClick = (data) => {
  console.log('点击单元格', data.address);
};
</script>
```

### Composable 方式

```vue
<template>
  <div ref="containerRef" style="width: 100%; height: 600px;"></div>
  <input type="file" @change="handleFileChange" accept=".xlsx,.xls" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useExcelViewer } from '@excel-viewer/vue';
import '@excel-viewer/vue/styles';

const containerRef = ref<HTMLElement | null>(null);

const {
  init,
  loadFile,
  workbook,
  currentSheet,
  zoom,
  setZoom
} = useExcelViewer();

onMounted(() => {
  if (containerRef.value) {
    init({
      container: containerRef.value,
      toolbar: { visible: true }
    });
  }
});

const handleFileChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    await loadFile(file);
  }
};
</script>
```

### 文件拖放

```vue
<template>
  <div
    ref="dropRef"
    :class="['drop-zone', { dragging: isDragging }]"
  >
    <p v-if="!files.length">拖放 Excel 文件到这里</p>
    <p v-else>已选择: {{ files[0].name }}</p>
  </div>
</template>

<script setup lang="ts">
import { useFileDrop } from '@excel-viewer/vue';

const { dropRef, isDragging, files } = useFileDrop({
  onDrop: (files) => {
    console.log('拖放文件:', files);
  }
});
</script>

<style scoped>
.drop-zone {
  border: 2px dashed #ccc;
  padding: 40px;
  text-align: center;
}
.drop-zone.dragging {
  border-color: #2196f3;
  background: rgba(33, 150, 243, 0.1);
}
</style>
```

## 组件 Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | `string` | `''` | Excel 文件 URL |
| `file` | `File` | `null` | Excel 文件对象 |
| `data` | `ArrayBuffer` | `null` | Excel 文件二进制数据 |
| `renderOptions` | `RenderOptions` | `{}` | 渲染选项 |
| `toolbar` | `ToolbarConfig` | `{}` | 工具栏配置 |
| `readonly` | `boolean` | `true` | 是否只读 |
| `enableSelection` | `boolean` | `true` | 是否启用选择 |
| `zoom` | `number` | `1` | 缩放比例 (支持 v-model) |
| `sheetIndex` | `number` | `0` | 工作表索引 (支持 v-model) |
| `width` | `string \| number` | `'100%'` | 容器宽度 |
| `height` | `string \| number` | `'100%'` | 容器高度 |
| `loadingText` | `string` | `'加载中...'` | 加载文本 |

## 组件事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `load` | `LoadEvent` | 加载完成 |
| `load-error` | `LoadErrorEvent` | 加载失败 |
| `sheet-change` | `SheetChangeEvent` | 工作表切换 |
| `cell-click` | `CellClickEvent` | 单元格点击 |
| `cell-double-click` | `CellClickEvent` | 单元格双击 |
| `cell-right-click` | `CellClickEvent` | 单元格右键 |
| `selection-change` | `SelectionChangeEvent` | 选区变化 |
| `zoom-change` | `ZoomEvent` | 缩放变化 |

## 组件插槽

```vue
<ExcelViewer :src="fileUrl">
  <!-- 自定义加载状态 -->
  <template #loading>
    <div class="custom-loading">正在加载...</div>
  </template>

  <!-- 自定义错误状态 -->
  <template #error="{ error }">
    <div class="custom-error">
      <p>加载失败: {{ error.message }}</p>
      <button @click="retry">重试</button>
    </div>
  </template>
</ExcelViewer>
```

## 组件方法

通过 ref 访问组件实例方法：

```vue
<template>
  <ExcelViewer ref="viewerRef" :src="fileUrl" />
  <button @click="handleZoomIn">放大</button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ExcelViewer } from '@excel-viewer/vue';

const viewerRef = ref<InstanceType<typeof ExcelViewer> | null>(null);

const handleZoomIn = () => {
  viewerRef.value?.zoomIn();
};
</script>
```

可用方法：
- `getViewer()` - 获取核心查看器实例
- `getWorkbook()` - 获取工作簿
- `getCurrentSheet()` - 获取当前工作表
- `getCell(address)` - 获取单元格
- `switchSheet(index)` - 切换工作表
- `setZoom(zoom)` - 设置缩放
- `zoomIn()` - 放大
- `zoomOut()` - 缩小
- `toggleFullscreen()` - 切换全屏
- `print()` - 打印
- `load()` - 重新加载
- `retry()` - 重试加载

## 插件安装

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import ExcelViewerPlugin from '@excel-viewer/vue';
import '@excel-viewer/vue/styles';

const app = createApp(App);
app.use(ExcelViewerPlugin);
app.mount('#app');
```

然后可以直接在模板中使用：

```vue
<template>
  <ExcelViewer :src="fileUrl" />
</template>
```

## 浏览器支持

- Chrome >= 80
- Firefox >= 75
- Safari >= 13
- Edge >= 80

## 许可证

MIT
