# @excel-viewer/core

高性能 Excel 文档查看器核心库，与框架无关。

## 特性

- 🚀 **高性能渲染** - 基于 Canvas 虚拟滚动，支持百万级单元格
- 📊 **完整格式支持** - 支持 xlsx 格式，包括样式、公式、图表等
- 🎨 **丰富样式** - 完整支持单元格样式、条件格式、主题
- 📱 **响应式设计** - 自适应容器大小，支持移动端
- 🔍 **功能全面** - 搜索、缩放、冻结窗格、合并单元格等
- 🎯 **类型安全** - 完整的 TypeScript 类型定义
- 📦 **轻量级** - 核心库小于 100KB (gzipped)

## 安装

```bash
npm install @excel-viewer/core
# 或
pnpm add @excel-viewer/core
# 或
yarn add @excel-viewer/core
```

## 快速开始

```typescript
import { ExcelViewer } from '@excel-viewer/core';
import '@excel-viewer/core/styles';

// 创建查看器实例
const viewer = new ExcelViewer({
  container: '#excel-container',
  renderOptions: {
    theme: 'excel',
    showGridLines: true,
    showRowColHeaders: true
  },
  toolbar: {
    visible: true,
    showSheetTabs: true,
    showZoom: true
  }
});

// 加载文件
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    await viewer.loadFile(file);
  }
});

// 或者加载 URL
await viewer.loadUrl('/path/to/file.xlsx');
```

## API

### ExcelViewer

主查看器类。

#### 构造函数

```typescript
new ExcelViewer(options: ExcelViewerOptions)
```

#### 选项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `container` | `HTMLElement \| string` | - | 容器元素或选择器 (必填) |
| `renderOptions` | `RenderOptions` | - | 渲染选项 |
| `toolbar` | `ToolbarConfig` | - | 工具栏配置 |
| `readonly` | `boolean` | `true` | 是否只读 |
| `enableSelection` | `boolean` | `true` | 是否启用选择 |
| `locale` | `string` | `'zh-CN'` | 语言 |

#### 方法

```typescript
// 加载文件
await viewer.loadFile(file: File): Promise<void>

// 加载 URL
await viewer.loadUrl(url: string): Promise<void>

// 加载数据
await viewer.loadData(data: ArrayBuffer | Uint8Array | Blob): Promise<void>

// 切换工作表
viewer.switchSheet(index: number): void

// 获取当前工作表
viewer.getCurrentSheet(): Sheet | null

// 获取单元格
viewer.getCell(address: string): Cell | null

// 设置缩放
viewer.setZoom(zoom: number): void

// 放大
viewer.zoomIn(): void

// 缩小
viewer.zoomOut(): void

// 切换全屏
viewer.toggleFullscreen(): void

// 打印
viewer.print(): void

// 获取工作簿
viewer.getWorkbook(): Workbook | null

// 订阅事件
viewer.on(type: EventType, listener: Function): () => void

// 取消订阅
viewer.off(type: EventType, listener: Function): void

// 销毁
viewer.destroy(): void
```

### 事件

```typescript
viewer.on('load', (data: LoadEvent) => {
  console.log('加载完成', data.workbook);
});

viewer.on('loadError', (data: LoadErrorEvent) => {
  console.error('加载失败', data.error);
});

viewer.on('sheetChange', (data: SheetChangeEvent) => {
  console.log('切换工作表', data.sheetName);
});

viewer.on('cellClick', (data: CellClickEvent) => {
  console.log('点击单元格', data.address, data.cell);
});

viewer.on('selectionChange', (data: SelectionChangeEvent) => {
  console.log('选区变化', data.selection);
});

viewer.on('zoom', (data: ZoomEvent) => {
  console.log('缩放变化', data.zoom);
});
```

### 渲染选项

```typescript
interface RenderOptions {
  theme?: 'light' | 'dark' | 'excel' | RenderTheme;
  showGridLines?: boolean;
  showRowColHeaders?: boolean;
  showZeros?: boolean;
  showFormulas?: boolean;
  zoom?: number;
  defaultFont?: string;
  defaultFontSize?: number;
  defaultRowHeight?: number;
  defaultColWidth?: number;
  virtualScroll?: boolean;
  overscanRowCount?: number;
  overscanColCount?: number;
}
```

### 工具栏配置

```typescript
interface ToolbarConfig {
  visible?: boolean;
  showSheetTabs?: boolean;
  showZoom?: boolean;
  showFullscreen?: boolean;
  showExport?: boolean;
  showPrint?: boolean;
  showSearch?: boolean;
  customButtons?: Array<{
    id: string;
    icon?: string;
    text?: string;
    title?: string;
    onClick: () => void;
  }>;
}
```

## 独立使用解析器

```typescript
import { ExcelParser } from '@excel-viewer/core';

const parser = new ExcelParser({
  parseStyles: true,
  parseImages: true,
  parseFormulas: true
});

const file = await fetch('/file.xlsx').then(r => r.arrayBuffer());
const workbook = await parser.parse(file);

console.log('工作表数量:', workbook.sheets.length);
console.log('第一个工作表:', workbook.sheets[0].name);
```

## 独立使用渲染器

```typescript
import { SheetRenderer } from '@excel-viewer/core';

const canvas = document.getElementById('canvas');
const renderer = new SheetRenderer(canvas, {
  theme: 'excel',
  zoom: 1
});

renderer.setSheet(workbook.sheets[0]);
renderer.setViewport(0, 0);
renderer.render();
```

## 浏览器支持

- Chrome >= 80
- Firefox >= 75
- Safari >= 13
- Edge >= 80

## 许可证

MIT
