# @excel-renderer/vue

Excel渲染插件的Vue 3适配包。

## 安装

```bash
npm install @excel-renderer/vue
# 或
pnpm add @excel-renderer/vue
```

## 快速开始

### 基础使用

```vue
<template>
  <div class="app">
    <input type="file" @change="handleFileChange" accept=".xlsx,.xls,.csv" />
    
    <ExcelViewer
      :file="file"
      :theme="theme"
      :locale="locale"
      @load="handleLoad"
      @cell-click="handleCellClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ExcelViewer } from '@excel-renderer/vue'

const file = ref<File>()
const theme = ref('light')
const locale = ref('zh-CN')

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  file.value = target.files?.[0]
}

function handleLoad(workbook) {
  console.log('加载完成:', workbook.sheets.length, '个工作表')
}

function handleCellClick(event) {
  console.log('点击单元格:', event.cell.ref, event.cell.value)
}
</script>

<style>
.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.excel-viewer {
  flex: 1;
}
</style>
```

### 使用Composables

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useExcelRenderer, useTheme } from '@excel-renderer/vue'

const container = ref<HTMLElement>()

// 使用渲染器
const {
  renderer,
  isLoading,
  error,
  loadFile,
  getCellValue,
  setActiveSheet,
} = useExcelRenderer({
  container: container.value!,
  theme: 'light',
  locale: 'zh-CN',
})

// 使用主题
const { currentTheme, setTheme, toggleTheme } = useTheme()

// 加载文件
async function handleLoadFile(file: File) {
  await loadFile(file)
}

// 切换主题
function handleToggleTheme() {
  toggleTheme()
  if (renderer.value) {
    renderer.value.setTheme(currentTheme.value)
  }
}
</script>
```

## API

### ExcelViewer 组件

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `file` | `File` | - | Excel文件 |
| `data` | `WorkbookData` | - | 工作簿数据 |
| `theme` | `'light' \| 'dark' \| Theme` | `'light'` | 主题 |
| `locale` | `LocaleCode` | `'zh-CN'` | 语言 |
| `editable` | `boolean` | `false` | 是否可编辑 |
| `features` | `FeaturesConfig` | - | 功能配置 |
| `performance` | `PerformanceConfig` | - | 性能配置 |
| `styleConfig` | `StyleConfig` | - | 样式配置 |
| `activeSheet` | `number` | `0` | 活动工作表索引 |
| `zoom` | `number` | `1` | 缩放级别 |

#### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `load` | `(workbook: WorkbookData)` | 加载完成 |
| `error` | `(error: Error)` | 错误 |
| `cell-click` | `(event: CellClickEvent)` | 单元格点击 |
| `cell-double-click` | `(event: CellDoubleClickEvent)` | 单元格双击 |
| `cell-change` | `(event: CellChangeEvent)` | 单元格值变化 |
| `selection-change` | `(event: SelectionChangeEvent)` | 选择变化 |
| `sheet-change` | `(event: SheetChangeEvent)` | 工作表切换 |
| `scroll` | `(event: ScrollEvent)` | 滚动 |
| `zoom` | `(level: number)` | 缩放 |

#### Methods

通过组件ref访问：

```vue
<script setup>
import { ref } from 'vue'

const viewerRef = ref()

function doSomething() {
  const renderer = viewerRef.value?.getRenderer()
  const sheet = viewerRef.value?.getActiveSheet()
  const value = viewerRef.value?.getCellValue('A1')
}
</script>

<template>
  <ExcelViewer ref="viewerRef" :file="file" />
</template>
```

### Composables

#### useExcelRenderer

```typescript
const {
  container,        // 容器ref
  renderer,         // 渲染器实例
  isLoading,        // 加载状态
  error,            // 错误信息
  workbook,         // 工作簿数据
  loadFile,         // 加载文件
  loadData,         // 加载数据
  getCellValue,     // 获取单元格值
  setActiveSheet,   // 设置活动工作表
  getActiveSheet,   // 获取活动工作表
  getSheetCount,    // 获取工作表数量
  getSheetNames,    // 获取工作表名称
  setTheme,         // 设置主题
  setLocale,        // 设置语言
  t,                // 翻译函数
} = useExcelRenderer(options)
```

#### useTheme

```typescript
const {
  currentTheme,     // 当前主题
  customThemes,     // 自定义主题
  setTheme,         // 设置主题
  registerTheme,    // 注册主题
  getTheme,         // 获取主题
  toggleTheme,      // 切换主题
} = useTheme('light')
```

#### useSelection

```typescript
const {
  selection,         // 选择状态
  selectCell,        // 选择单元格
  selectRange,       // 选择区域
  getSelectedData,   // 获取选中数据
  clearSelection,    // 清除选择
  updateSelection,   // 更新选择
} = useSelection(renderer)
```

## 类型定义

所有类型定义都从 `@excel-renderer/core` 导出：

```typescript
import type {
  WorkbookData,
  SheetData,
  CellData,
  CellStyle,
  Theme,
  LocaleCode,
} from '@excel-renderer/vue'
```

## 示例

查看 `examples/vue-demo` 目录获取完整示例。

## License

MIT