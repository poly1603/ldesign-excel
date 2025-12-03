# Excel渲染插件 - API设计文档

## 📦 Core包 API

### ExcelRenderer 主类

```typescript
class ExcelRenderer {
  constructor(options: ExcelRendererOptions)
  
  // 文件操作
  loadFile(file: File | ArrayBuffer): Promise<void>
  loadData(data: WorkbookData): void
  
  // 工作表操作
  setActiveSheet(index: number): void
  getActiveSheet(): SheetData
  getSheetCount(): number
  getSheetNames(): string[]
  
  // 单元格操作
  getCellValue(ref: string): any
  setCellValue(ref: string, value: any): void
  getCellStyle(ref: string): CellStyle
  setCellStyle(ref: string, style: Partial<CellStyle>): void
  
  // 选择操作
  selectCell(row: number, col: number): void
  selectRange(range: CellRange): void
  getSelection(): Selection
  
  // 视图操作
  scrollTo(row: number, col: number): void
  setZoom(level: number): void
  getZoom(): number
  
  // 主题和语言
  setTheme(theme: string | Theme): void
  getTheme(): Theme
  setLocale(locale: string): void
  getLocale(): string
  
  // 导出
  export(format: 'xlsx' | 'csv' | 'pdf'): Promise<Blob>
  
  // 事件监听
  on(event: string, handler: Function): void
  off(event: string, handler: Function): void
  
  // 销毁
  destroy(): void
}
```

### ExcelRendererOptions

```typescript
interface ExcelRendererOptions {
  // 容器元素
  container: HTMLElement
  
  // 主题配置
  theme?: 'light' | 'dark' | Theme
  
  // 语言配置
  locale?: 'zh-CN' | 'en-US' | string
  
  // 是否可编辑
  editable?: boolean
  
  // 功能开关
  features?: {
    formula?: boolean      // 公式计算
    filter?: boolean       // 筛选
    sort?: boolean         // 排序
    search?: boolean       // 搜索
    contextMenu?: boolean  // 右键菜单
    toolbar?: boolean      // 工具栏
  }
  
  // 性能配置
  performance?: {
    virtualScroll?: boolean     // 虚拟滚动
    workerEnabled?: boolean     // Web Worker
    cacheEnabled?: boolean      // 缓存
    bufferRows?: number         // 缓冲行数
  }
  
  // 样式配置
  style?: {
    rowHeight?: number
    colWidth?: number
    fontSize?: number
    fontFamily?: string
  }
  
  // 回调函数
  onLoad?: (workbook: WorkbookData) => void
  onError?: (error: Error) => void
  onCellClick?: (cell: CellData) => void
  onCellChange?: (cell: CellData, newValue: any) => void
}
```

### 事件系统

```typescript
// 支持的事件类型
type EventType =
  | 'load'              // 文件加载完成
  | 'error'             // 错误
  | 'cellClick'         // 单元格点击
  | 'cellDoubleClick'   // 单元格双击
  | 'cellChange'        // 单元格值变化
  | 'selectionChange'   // 选择变化
  | 'sheetChange'       // 工作表切换
  | 'scroll'            // 滚动
  | 'zoom'              // 缩放

// 事件数据结构
interface CellClickEvent {
  row: number
  col: number
  cell: CellData
}

interface CellChangeEvent {
  row: number
  col: number
  oldValue: any
  newValue: any
}

interface SelectionChangeEvent {
  selection: Selection
}
```

---

## 🎨 Vue包 API

### ExcelViewer 组件

```vue
<ExcelViewer
  :file="file"
  :data="data"
  :theme="theme"
  :locale="locale"
  :editable="editable"
  :features="features"
  :performance="performance"
  :style-config="styleConfig"
  @load="handleLoad"
  @error="handleError"
  @cell-click="handleCellClick"
  @cell-change="handleCellChange"
  @selection-change="handleSelectionChange"
/>
```

### Props

```typescript
interface ExcelViewerProps {
  // 数据源（二选一）
  file?: File
  data?: WorkbookData
  
  // 主题
  theme?: 'light' | 'dark' | Theme
  
  // 语言
  locale?: 'zh-CN' | 'en-US' | string
  
  // 是否可编辑
  editable?: boolean
  
  // 功能配置
  features?: FeaturesConfig
  
  // 性能配置
  performance?: PerformanceConfig
  
  // 样式配置
  styleConfig?: StyleConfig
  
  // 初始活动工作表
  activeSheet?: number
  
  // 初始缩放级别
  zoom?: number
}
```

### Events

```typescript
interface ExcelViewerEmits {
  // 加载完成
  (e: 'load', workbook: WorkbookData): void
  
  // 错误
  (e: 'error', error: Error): void
  
  // 单元格点击
  (e: 'cell-click', event: CellClickEvent): void
  
  // 单元格双击
  (e: 'cell-double-click', event: CellClickEvent): void
  
  // 单元格值变化
  (e: 'cell-change', event: CellChangeEvent): void
  
  // 选择变化
  (e: 'selection-change', event: SelectionChangeEvent): void
  
  // 工作表切换
  (e: 'sheet-change', sheetIndex: number): void
  
  // 滚动
  (e: 'scroll', scrollInfo: ScrollInfo): void
  
  // 缩放
  (e: 'zoom', level: number): void
}
```

### Composables

#### useExcelRenderer

```typescript
function useExcelRenderer(options: ExcelRendererOptions) {
  const renderer = ref<ExcelRenderer>()
  const container = ref<HTMLElement>()
  
  // 加载文件
  const loadFile = async (file: File) => {
    await renderer.value?.loadFile(file)
  }
  
  // 获取单元格值
  const getCellValue = (ref: string) => {
    return renderer.value?.getCellValue(ref)
  }
  
  // 设置单元格值
  const setCellValue = (ref: string, value: any) => {
    renderer.value?.setCellValue(ref, value)
  }
  
  // 切换工作表
  const setActiveSheet = (index: number) => {
    renderer.value?.setActiveSheet(index)
  }
  
  // 导出
  const exportFile = async (format: 'xlsx' | 'csv') => {
    return await renderer.value?.export(format)
  }
  
  return {
    renderer,
    container,
    loadFile,
    getCellValue,
    setCellValue,
    setActiveSheet,
    exportFile
  }
}
```

#### useTheme

```typescript
function useTheme() {
  const currentTheme = ref<string>('light')
  const themes = ref<Map<string, Theme>>(new Map())
  
  // 切换主题
  const setTheme = (name: string) => {
    currentTheme.value = name
  }
  
  // 注册自定义主题
  const registerTheme = (theme: Theme) => {
    themes.value.set(theme.name, theme)
  }
  
  // 获取当前主题
  const getTheme = () => {
    return themes.value.get(currentTheme.value)
  }
  
  return {
    currentTheme,
    themes,
    setTheme,
    registerTheme,
    getTheme
  }
}
```

#### useSelection

```typescript
function useSelection(renderer: Ref<ExcelRenderer>) {
  const selection = ref<Selection>()
  
  // 选择单元格
  const selectCell = (row: number, col: number) => {
    renderer.value?.selectCell(row, col)
    updateSelection()
  }
  
  // 选择区域
  const selectRange = (range: CellRange) => {
    renderer.value?.selectRange(range)
    updateSelection()
  }
  
  // 获取选中数据
  const getSelectedData = () => {
    return selection.value?.data
  }
  
  // 更新选择状态
  const updateSelection = () => {
    selection.value = renderer.value?.getSelection()
  }
  
  return {
    selection,
    selectCell,
    selectRange,
    getSelectedData
  }
}
```

---

## 🔧 类型定义

### 工作簿类型

```typescript
interface WorkbookData {
  sheets: SheetData[]
  metadata: WorkbookMetadata
}

interface WorkbookMetadata {
  creator?: string
  created?: Date
  modified?: Date
  sheetCount: number
}

interface SheetData {
  name: string
  index: number
  cells: Map<string, CellData>
  merges: MergeRange[]
  frozenRows: number
  frozenCols: number
  rowHeights: Map<number, number>
  colWidths: Map<number, number>
  rowCount: number
  colCount: number
}
```

### 单元格类型

```typescript
interface CellData {
  // 位置
  row: number
  col: number
  ref: string  // 如 "A1"
  
  // 值
  value: any
  displayValue: string
  formula?: string
  
  // 类型
  dataType: CellDataType
  
  // 样式
  style: CellStyle
  
  // 合并信息
  merge?: MergeRange
}

type CellDataType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'date' 
  | 'error' 
  | 'formula'

interface CellStyle {
  // 字体
  font?: {
    name?: string
    size?: number
    bold?: boolean
    italic?: boolean
    underline?: boolean
    strike?: boolean
    color?: string
  }
  
  // 填充
  fill?: {
    type?: 'solid' | 'pattern'
    fgColor?: string
    bgColor?: string
    pattern?: string
  }
  
  // 边框
  border?: {
    top?: BorderStyle
    right?: BorderStyle
    bottom?: BorderStyle
    left?: BorderStyle
  }
  
  // 对齐
  alignment?: {
    horizontal?: 'left' | 'center' | 'right'
    vertical?: 'top' | 'middle' | 'bottom'
    wrapText?: boolean
    indent?: number
  }
  
  // 数字格式
  numFmt?: string
}

interface BorderStyle {
  style: 'thin' | 'medium' | 'thick' | 'dashed' | 'dotted'
  color?: string
}
```

### 选择类型

```typescript
interface Selection {
  // 活动单元格
  activeCell: {
    row: number
    col: number
  }
  
  // 选择范围
  ranges: CellRange[]
  
  // 选中的数据
  data: CellData[]
}

interface CellRange {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

interface MergeRange extends CellRange {
  ref: string  // 如 "A1:C3"
}
```

### 主题类型

```typescript
interface Theme {
  name: string
  
  colors: {
    // 背景色
    background: string
    foreground: string
    
    // 网格
    grid: string
    gridStrong: string
    
    // 表头
    headerBg: string
    headerText: string
    headerBorder: string
    
    // 选择
    selection: string
    selectionBorder: string
    activeCell: string
    activeCellBorder: string
    
    // 冻结线
    frozenLine: string
    
    // 滚动条
    scrollbar: string
    scrollbarThumb: string
  }
  
  fonts: {
    default: string
    size: number
    header: string
  }
  
  spacing: {
    cellPadding: number
    rowHeight: number
    colWidth: number
    headerHeight: number
    headerWidth: number
  }
  
  borders: {
    width: number
    style: string
  }
}
```

### 视图类型

```typescript
interface Viewport {
  scrollTop: number
  scrollLeft: number
  width: number
  height: number
  zoom: number
}

interface ScrollInfo {
  scrollTop: number
  scrollLeft: number
  maxScrollTop: number
  maxScrollLeft: number
  visibleRows: number
  visibleCols: number
}
```

---

## 🎯 使用示例

### 基础使用

```typescript
import { ExcelRenderer } from '@excel-renderer/core'

// 创建渲染器
const renderer = new ExcelRenderer({
  container: document.getElementById('app'),
  theme: 'light',
  locale: 'zh-CN'
})

// 加载文件
const fileInput = document.querySelector('input[type="file"]')
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  await renderer.loadFile(file)
})

// 监听事件
renderer.on('cellClick', (event) => {
  console.log('点击单元格:', event.cell.ref, event.cell.value)
})
```

### Vue组件使用

```vue
<template>
  <div class="excel-app">
    <input type="file" @change="handleFileChange" />
    
    <ExcelViewer
      :file="file"
      :theme="theme"
      :locale="locale"
      :editable="true"
      @cell-click="handleCellClick"
      @cell-change="handleCellChange"
    />
    
    <div class="controls">
      <button @click="toggleTheme">切换主题</button>
      <button @click="exportExcel">导出Excel</button>
    </div>
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

function handleCellClick(event: CellClickEvent) {
  console.log('点击:', event.cell.ref)
}

function handleCellChange(event: CellChangeEvent) {
  console.log('修改:', event.newValue)
}

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

async function exportExcel() {
  // 导出逻辑
}
</script>
```

### 使用Composables

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useExcelRenderer, useTheme, useSelection } from '@excel-renderer/vue'

const container = ref<HTMLElement>()

// 使用渲染器
const { renderer, loadFile, getCellValue, exportFile } = useExcelRenderer({
  container: container.value,
  theme: 'light'
})

// 使用主题
const { currentTheme, setTheme } = useTheme()

// 使用选择
const { selection, selectCell, getSelectedData } = useSelection(renderer)

// 加载文件
async function handleLoad(file: File) {
  await loadFile(file)
}

// 获取值
function getValue() {
  const value = getCellValue('A1')
  console.log('A1的值:', value)
}

// 导出
async function handleExport() {
  const blob = await exportFile('xlsx')
  // 下载文件
}
</script>
```

---

## 🔌 插件系统

支持通过插件扩展功能：

```typescript
interface Plugin {
  name: string
  install(renderer: ExcelRenderer): void
}

// 注册插件
renderer.use(plugin)

// 示例：图表插件
const ChartPlugin: Plugin = {
  name: 'chart',
  install(renderer) {
    renderer.registerFeature('chart', {
      render(data) {
        // 渲染图表
      }
    })
  }
}
```

---

## 📝 配置示例

### 完整配置

```typescript
const options: ExcelRendererOptions = {
  container: document.getElementById('excel'),
  theme: 'light',
  locale: 'zh-CN',
  editable: true,
  
  features: {
    formula: true,
    filter: true,
    sort: true,
    search: true,
    contextMenu: true,
    toolbar: true
  },
  
  performance: {
    virtualScroll: true,
    workerEnabled: true,
    cacheEnabled: true,
    bufferRows: 10
  },
  
  style: {
    rowHeight: 25,
    colWidth: 100,
    fontSize: 14,
    fontFamily: 'Arial, sans-serif'
  },
  
  onLoad(workbook) {
    console.log('加载完成:', workbook.sheets.length, '个工作表')
  },
  
  onError(error) {
    console.error('错误:', error.message)
  }
}