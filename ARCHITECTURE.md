# Excel渲染插件 - 架构设计文档

## 📋 项目概述

这是一个高性能、功能强大的Excel文件渲染插件，采用框架无关的核心 + Vue适配层的架构设计。

### 核心特性

- ✅ 支持多种格式：`.xlsx` / `.xls` / `.csv`
- ✅ 高性能：虚拟滚动，支持百万级单元格渲染
- ✅ 完整样式：字体、颜色、边框、对齐、合并单元格
- ✅ 冻结窗格：行列冻结支持
- ✅ 公式引擎：支持常用Excel公式计算
- ✅ 交互功能：筛选、排序、查找、单元格选择
- ✅ 主题系统：亮色/暗色/自定义主题
- ✅ 国际化：中文/英文多语言支持
- ✅ 框架适配：核心与框架解耦，易于扩展

---

## 🏗️ 项目结构

```
excel-renderer/
├── packages/
│   ├── core/                      # 框架无关核心包
│   │   ├── src/
│   │   │   ├── parser/           # Excel文件解析
│   │   │   │   ├── ExcelParser.ts
│   │   │   │   ├── XlsxParser.ts
│   │   │   │   ├── CsvParser.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── renderer/         # Canvas渲染引擎
│   │   │   │   ├── Renderer.ts
│   │   │   │   ├── CellRenderer.ts
│   │   │   │   ├── GridRenderer.ts
│   │   │   │   ├── SelectionRenderer.ts
│   │   │   │   └── VirtualScroller.ts
│   │   │   │
│   │   │   ├── engine/           # 公式计算引擎
│   │   │   │   ├── FormulaEngine.ts
│   │   │   │   ├── functions/
│   │   │   │   │   ├── math.ts
│   │   │   │   │   ├── logical.ts
│   │   │   │   │   ├── text.ts
│   │   │   │   │   └── lookup.ts
│   │   │   │   └── DependencyGraph.ts
│   │   │   │
│   │   │   ├── theme/            # 主题系统
│   │   │   │   ├── ThemeManager.ts
│   │   │   │   ├── themes/
│   │   │   │   │   ├── light.ts
│   │   │   │   │   ├── dark.ts
│   │   │   │   │   └── types.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── i18n/             # 国际化
│   │   │   │   ├── I18nManager.ts
│   │   │   │   ├── locales/
│   │   │   │   │   ├── zh-CN.ts
│   │   │   │   │   ├── en-US.ts
│   │   │   │   │   └── types.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── selection/        # 选择管理
│   │   │   │   ├── SelectionManager.ts
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── interaction/      # 交互处理
│   │   │   │   ├── EventManager.ts
│   │   │   │   ├── MouseHandler.ts
│   │   │   │   ├── KeyboardHandler.ts
│   │   │   │   └── ScrollHandler.ts
│   │   │   │
│   │   │   ├── filter/           # 筛选和排序
│   │   │   │   ├── FilterManager.ts
│   │   │   │   ├── SortManager.ts
│   │   │   │   └── SearchManager.ts
│   │   │   │
│   │   │   ├── utils/            # 工具函数
│   │   │   │   ├── color.ts
│   │   │   │   ├── format.ts
│   │   │   │   ├── math.ts
│   │   │   │   └── cache.ts
│   │   │   │
│   │   │   ├── types/            # TypeScript类型
│   │   │   │   ├── cell.ts
│   │   │   │   ├── style.ts
│   │   │   │   ├── workbook.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── ExcelRenderer.ts  # 主入口类
│   │   │   └── index.ts
│   │   │
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── README.md
│   │
│   └── vue/                       # Vue框架适配包
│       ├── src/
│       │   ├── components/
│       │   │   ├── ExcelViewer.vue
│       │   │   ├── Toolbar.vue
│       │   │   ├── SheetTabs.vue
│       │   │   └── ContextMenu.vue
│       │   │
│       │   ├── composables/
│       │   │   ├── useExcelRenderer.ts
│       │   │   ├── useTheme.ts
│       │   │   └── useSelection.ts
│       │   │
│       │   ├── types/
│       │   │   └── index.ts
│       │   │
│       │   └── index.ts
│       │
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── README.md
│
├── examples/                      # 示例项目
│   └── vue-demo/
│       ├── src/
│       │   ├── App.vue
│       │   └── main.ts
│       ├── package.json
│       └── vite.config.ts
│
├── docs/                          # 文档
│   ├── guide/
│   │   ├── getting-started.md
│   │   ├── core-api.md
│   │   └── vue-usage.md
│   └── api/
│       ├── core.md
│       └── vue.md
│
├── package.json                   # Monorepo根配置
├── pnpm-workspace.yaml
├── tsconfig.json
└── README.md
```

---

## 🎯 技术栈

### Core包技术选型

| 技术 | 用途 | 原因 |
|------|------|------|
| **TypeScript** | 开发语言 | 类型安全、代码提示、易维护 |
| **Canvas API** | 渲染引擎 | 高性能、完全控制渲染 |
| **SheetJS (xlsx)** | Excel解析 | 成熟稳定、支持多种格式 |
| **Formula.js** | 公式计算 | 完整的Excel函数支持 |
| **Vite** | 开发工具 | 快速热更新 |
| **Rollup** | 打包工具 | 生成优化的库文件 |

### Vue包技术选型

| 技术 | 用途 |
|------|------|
| **Vue 3** | UI框架 |
| **Composition API** | 逻辑复用 |
| **TypeScript** | 类型安全 |
| **@vueuse/core** | 工具函数 |

---

## 🔧 核心模块设计

### 1. Excel文件解析器 (Parser)

**职责**：将Excel文件解析为内部数据结构

```typescript
interface IExcelParser {
  parse(source: File | ArrayBuffer): Promise<WorkbookData>
  parseSheet(data: any, sheetIndex: number): SheetData
}

interface WorkbookData {
  sheets: SheetData[]
  metadata: WorkbookMetadata
}

interface SheetData {
  name: string
  cells: Map<string, CellData>
  merges: MergeRange[]
  frozenRows: number
  frozenCols: number
  rowHeights: Map<number, number>
  colWidths: Map<number, number>
}

interface CellData {
  value: any
  formula?: string
  style: CellStyle
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'error'
}
```

### 2. Canvas渲染引擎 (Renderer)

**职责**：高性能渲染单元格到Canvas

**架构特点**：
- 分层渲染：背景层、网格层、内容层、选择层
- 虚拟滚动：只渲染可见区域
- 增量更新：只重绘变化区域

```typescript
class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private virtualScroller: VirtualScroller
  
  render(viewport: Viewport): void {
    const visibleRange = this.virtualScroller.getVisibleRange(viewport)
    this.renderCells(visibleRange)
  }
  
  private renderCells(range: CellRange): void {
    // 1. 清空画布
    // 2. 绘制背景
    // 3. 绘制网格线
    // 4. 绘制单元格内容
    // 5. 绘制边框
    // 6. 绘制选中状态
  }
}
```

### 3. 虚拟滚动 (Virtual Scroller)

**职责**：计算可见区域，实现大数据量高性能滚动

```typescript
class VirtualScroller {
  getVisibleRange(viewport: Viewport): CellRange {
    const startRow = this.getRowByY(viewport.scrollTop)
    const endRow = this.getRowByY(viewport.scrollTop + viewport.height)
    const startCol = this.getColByX(viewport.scrollLeft)
    const endCol = this.getColByX(viewport.scrollLeft + viewport.width)
    
    return { startRow, endRow, startCol, endCol }
  }
}
```

### 4. 公式计算引擎 (Formula Engine)

**职责**：解析和计算Excel公式

```typescript
class FormulaEngine {
  private functions: Map<string, FormulaFunction>
  private dependencyGraph: DependencyGraph
  
  calculate(formula: string, context: CellContext): any {
    const ast = this.parse(formula)
    return this.evaluate(ast, context)
  }
  
  registerFunction(name: string, fn: FormulaFunction): void {
    this.functions.set(name.toUpperCase(), fn)
  }
}
```

**支持的函数分类**：
- 数学函数：SUM, AVERAGE, MAX, MIN, ROUND, ABS
- 逻辑函数：IF, AND, OR, NOT
- 文本函数：CONCATENATE, LEFT, RIGHT, MID, UPPER, LOWER
- 查找函数：VLOOKUP, HLOOKUP, INDEX, MATCH
- 日期函数：DATE, TODAY, NOW, YEAR, MONTH, DAY

### 5. 主题系统 (Theme Manager)

```typescript
interface Theme {
  name: string
  colors: {
    background: string
    foreground: string
    grid: string
    headerBg: string
    headerText: string
    selection: string
    selectionBorder: string
    frozenLine: string
    activeCellBorder: string
  }
  fonts: {
    default: string
    size: number
  }
  spacing: {
    cellPadding: number
    rowHeight: number
    colWidth: number
  }
}

class ThemeManager {
  private themes: Map<string, Theme>
  private currentTheme: Theme
  
  setTheme(name: string): void
  registerTheme(theme: Theme): void
}
```

### 6. 国际化系统 (I18n Manager)

```typescript
interface LocaleMessages {
  toolbar: {
    zoomIn: string
    zoomOut: string
    export: string
    search: string
  }
  contextMenu: {
    copy: string
    paste: string
    cut: string
    delete: string
  }
  errors: {
    fileNotSupported: string
    parseError: string
    formulaError: string
  }
}

class I18nManager {
  t(key: string): string
  setLocale(locale: string): void
}
```

---

## 📊 性能优化策略

### 1. 虚拟滚动
只渲染可见区域的单元格，支持百万行数据流畅滚动。

### 2. Canvas分层渲染
- **背景层**：单元格背景色
- **网格层**：网格线
- **内容层**：单元格文本和值
- **选择层**：选择框和高亮

### 3. Web Worker后台处理
- Excel文件解析
- 大量公式计算
- 数据排序和筛选

### 4. 缓存机制
- 样式计算结果缓存
- 渲染结果缓存
- 公式计算结果缓存

### 5. 增量渲染
只重绘变化的区域，避免全量渲染。

---

## 🎨 API设计

### Core包使用示例

```typescript
import { ExcelRenderer } from '@excel-renderer/core'

const renderer = new ExcelRenderer({
  container: document.getElementById('excel-container'),
  theme: 'light',
  locale: 'zh-CN',
  editable: false,
  features: {
    formula: true,
    filter: true,
    sort: true
  }
})

// 加载文件
await renderer.loadFile(file)

// 切换主题
renderer.setTheme('dark')

// 切换语言
renderer.setLocale('en-US')

// 监听事件
renderer.on('cellClick', (cell) => {
  console.log('Clicked:', cell)
})

// 获取单元格数据
const value = renderer.getCellValue('A1')

// 设置单元格数据
renderer.setCellValue('A1', 100)

// 导出
const blob = await renderer.export('xlsx')
```

### Vue包使用示例

```vue
<template>
  <ExcelViewer
    :file="excelFile"
    :theme="theme"
    :locale="locale"
    :editable="true"
    @cell-click="handleCellClick"
    @value-change="handleValueChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ExcelViewer } from '@excel-renderer/vue'

const excelFile = ref<File>()
const theme = ref('light')
const locale = ref('zh-CN')

function handleCellClick(cell: CellData) {
  console.log('Clicked:', cell)
}

function handleValueChange(cell: CellData, newValue: any) {
  console.log('Changed:', cell, newValue)
}
</script>
```

---

## 🚀 开发路线图

### 阶段1：基础架构 (第1-2周)
- Monorepo搭建
- Core包基础结构
- Excel文件解析
- 基础Canvas渲染
- 简单样式支持

### 阶段2：核心功能 (第3-4周)
- 虚拟滚动
- 完整样式系统
- 合并单元格
- 冻结窗格
- 选择和交互

### 阶段3：高级功能 (第5-6周)
- 公式引擎
- 筛选排序
- 主题系统
- 国际化

### 阶段4：框架适配 (第7-8周)
- Vue组件封装
- 示例项目
- 文档和测试

---

## ⚡ 性能指标目标

- 文件解析：< 2秒（10MB文件）
- 首次渲染：< 500ms（1000行）
- 滚动帧率：60 FPS
- 内存占用：< 100MB（10万行数据）

---

## 📚 依赖包列表

### Core包依赖
```json
{
  "dependencies": {

将不同元素分层渲染，减少重绘范围：
- **背景层**：单元格背景色（很少变化）
- **网格层**：网格线（固定不变）
- **内容层**：单元格文本和值（数据变化时更新）
- **选择层**：选择框和高亮（频繁变化，独立绘制）

### 3. Web Worker后台处理

将耗时操作放到Web Worker：
- Excel文件解析
- 大量公式计算
- 数据排序和筛选

### 4. 缓存机制

```typescript
class CacheManager {
  // 样式计算结果缓存
