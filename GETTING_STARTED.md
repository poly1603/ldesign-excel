# Excel渲染插件 - 快速开始指南

## 🚀 快速开始

本指南将帮助你快速上手开发Excel渲染插件。

---

## 📋 前置要求

### 必需工具
- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0（推荐使用pnpm）

### 安装pnpm
```bash
npm install -g pnpm
```

---

## 🛠️ 项目设置

### 1. 克隆或初始化项目

如果你是从现有仓库克隆：
```bash
git clone <repository-url>
cd excel-renderer
```

### 2. 安装依赖

在项目根目录运行：
```bash
pnpm install
```

这将安装所有packages的依赖。

### 3. 项目结构说明

```
excel-renderer/
├── packages/
│   ├── core/              # 核心包（框架无关）
│   └── vue/               # Vue适配包（待创建）
├── examples/              # 示例项目（待创建）
├── docs/                  # 文档
└── package.json           # Monorepo配置
```

---

## 💻 开发工作流

### 开发Core包

```bash
# 方式1: 在根目录启动所有包的开发模式
pnpm dev

# 方式2: 只开发Core包
cd packages/core
pnpm dev
```

### 构建

```bash
# 构建所有包
pnpm build

# 构建单个包
cd packages/core
pnpm build
```

### 代码检查和格式化

```bash
# ESLint检查
pnpm lint

# 格式化代码
pnpm format

# TypeScript类型检查
pnpm type-check
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行Core包测试
cd packages/core
pnpm test
```

---

## 📝 开发任务清单

### 阶段1: 核心功能（当前阶段）

- [x] 项目架构设计
- [x] TypeScript类型定义
- [ ] **下一步: Excel文件解析器**
  ```typescript
  // packages/core/src/parser/ExcelParser.ts
  export class ExcelParser {
    async parse(file: File): Promise<WorkbookData> {
      // 使用xlsx库解析Excel文件
    }
  }
  ```

- [ ] **Canvas渲染引擎**
  ```typescript
  // packages/core/src/renderer/Renderer.ts
  export class Renderer {
    render(viewport: Viewport): void {
      // 绘制单元格到Canvas
    }
  }
  ```

- [ ] **虚拟滚动**
  ```typescript
  // packages/core/src/renderer/VirtualScroller.ts
  export class VirtualScroller {
    getVisibleRange(viewport: Viewport): CellRange {
      // 计算可见单元格范围
    }
  }
  ```

### 阶段2: 高级功能

- [ ] 主题系统实现
- [ ] 国际化系统实现
- [ ] 公式计算引擎
- [ ] 交互功能（选择、编辑）

### 阶段3: Vue适配

- [ ] 创建Vue包
- [ ] ExcelViewer组件
- [ ] Composables

---

## 🎯 核心开发指南

### 1. 实现Excel解析器

创建 `packages/core/src/parser/ExcelParser.ts`:

```typescript
import * as XLSX from 'xlsx'
import type { WorkbookData, SheetData, CellData } from '../types'

export class ExcelParser {
  async parse(file: File | ArrayBuffer): Promise<WorkbookData> {
    // 读取文件
    const data = file instanceof File 
      ? await file.arrayBuffer() 
      : file
    
    // 使用XLSX解析
    const workbook = XLSX.read(data, { type: 'array' })
    
    // 转换为内部数据结构
    const sheets: SheetData[] = workbook.SheetNames.map((name, index) => {
      return this.parseSheet(workbook.Sheets[name], name, index)
    })
    
    return {
      sheets,
      metadata: {
        sheetCount: sheets.length,
        created: new Date()
      }
    }
  }
  
  private parseSheet(sheet: any, name: string, index: number): SheetData {
    // 解析单个工作表
    const cells = new Map<string, CellData>()
    
    // 遍历所有单元格
    for (const cellRef in sheet) {
      if (cellRef[0] === '!') continue // 跳过特殊属性
      
      const cell = sheet[cellRef]
      const cellData = this.parseCell(cell, cellRef)
      cells.set(cellRef, cellData)
    }
    
    return {
      name,
      index,
      cells,
      merges: [],
      frozenRows: 0,
      frozenCols: 0,
      rowHeights: new Map(),
      colWidths: new Map(),
      rowCount: 100,
      colCount: 26
    }
  }
  
  private parseCell(cell: any, ref: string): CellData {
    // 解析单个单元格
    const [col, row] = this.parseRef(ref)
    
    return {
      row,
      col,
      ref,
      value: cell.v,
      displayValue: String(cell.v || ''),
      formula: cell.f,
      dataType: this.getCellType(cell),
      style: {}
    }
  }
  
  private parseRef(ref: string): [number, number] {
    // 解析单元格引用，如 "A1" -> [0, 0]
    const match = ref.match(/^([A-Z]+)(\d+)$/)
    if (!match) throw new Error(`Invalid cell reference: ${ref}`)
    
    const col = this.colToIndex(match[1])
    const row = parseInt(match[2]) - 1
    
    return [col, row]
  }
  
  private colToIndex(col: string): number {
    // "A" -> 0, "B" -> 1, "Z" -> 25, "AA" -> 26
    let result = 0
    for (let i = 0; i < col.length; i++) {
      result = result * 26 + (col.charCodeAt(i) - 64)
    }
    return result - 1
  }
  
  private getCellType(cell: any): CellData['dataType'] {
    if (!cell.t) return 'string'
    
    switch (cell.t) {
      case 'n': return 'number'
      case 's': return 'string'
      case 'b': return 'boolean'
      case 'd': return 'date'
      case 'e': return 'error'
      default: return 'string'
    }
  }
}
```

### 2. 实现Canvas渲染器

创建 `packages/core/src/renderer/Renderer.ts`:

```typescript
import type { Viewport, CellData, SheetData } from '../types'
import { VirtualScroller } from './VirtualScroller'

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private scroller: VirtualScroller
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.scroller = new VirtualScroller()
  }
  
  render(sheet: SheetData, viewport: Viewport): void {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 获取可见范围
    const range = this.scroller.getVisibleRange(viewport)
    
    // 绘制网格
    this.drawGrid(range, viewport)
    
    // 绘制单元格
    this.drawCells(sheet, range, viewport)
  }
  
  private drawGrid(range: CellRange, viewport: Viewport): void {
    this.ctx.strokeStyle = '#e0e0e0'
    this.ctx.lineWidth = 1
    
    // 绘制垂直线
    for (let col = range.startCol; col <= range.endCol; col++) {
      const x = col * 100 - viewport.scrollLeft
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.canvas.height)
      this.ctx.stroke()
    }
    
    // 绘制水平线
    for (let row = range.startRow; row <= range.endRow; row++) {
      const y = row * 25 - viewport.scrollTop
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.canvas.width, y)
      this.ctx.stroke()
    }
  }
  
  private drawCells(sheet: SheetData, range: CellRange, viewport: Viewport): void {
    this.ctx.font = '14px Arial'
    this.ctx.fillStyle = '#000000'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'middle'
    
    for (let row = range.startRow; row <= range.endRow; row++) {
      for (let col = range.startCol; col <= range.endCol; col++) {
        const ref = this.toRef(row, col)
        const cell = sheet.cells.get(ref)
        
        if (cell && cell.displayValue) {
          const x = col * 100 - viewport.scrollLeft + 5
          const y = row * 25 - viewport.scrollTop + 12
          
          this.ctx.fillText(cell.displayValue, x, y)
        }
      }
    }
  }
  
  private toRef(row: number, col: number): string {
    const colName = this.indexToCol(col)
    return `${colName}${row + 1}`
  }
  
  private indexToCol(index: number): string {
    let col = ''
    let n = index + 1
    
    while (n > 0) {
      const remainder = (n - 1) % 26
      col = String.fromCharCode(65 + remainder) + col
      n = Math.floor((n - 1) / 26)
    }
    
    return col
  }
}
```

### 3. 实现主类 ExcelRenderer

创建 `packages/core/src/ExcelRenderer.ts`:

```typescript
import type { ExcelRendererOptions, WorkbookData, EventHandler, EventType } from './types'
import { ExcelParser } from './parser/ExcelParser'
import { Renderer } from './renderer/Renderer'

export class ExcelRenderer {
  private options: ExcelRendererOptions
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private parser: ExcelParser
  private renderer: Renderer
  private workbook: WorkbookData | null = null
  private eventHandlers: Map<EventType, Set<EventHandler>> = new Map()
  
  constructor(options: ExcelRendererOptions) {
    this.options = options
    this.container = options.container
    this.parser = new ExcelParser()
    
    // 创建Canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.container.clientWidth
    this.canvas.height = this.container.clientHeight
    this.container.appendChild(this.canvas)
    
    // 创建渲染器
    this.renderer = new Renderer(this.canvas)
  }
  
  async loadFile(file: File): Promise<void> {
    try {
      this.workbook = await this.parser.parse(file)
      
      // 渲染第一个工作表
      if (this.workbook.sheets.length > 0) {
        this.render()
      }
      
      // 触发加载完成事件
      this.emit('load', {
        type: 'load',
        timestamp: Date.now(),
        sheetCount: this.workbook.sheets.length
      })
    } catch (error) {
      this.emit('error', {
        type: 'error',
        timestamp: Date.now(),
        error: error as Error,
        message: (error as Error).message
      })
    }
  }
  
  private render(): void {
    if (!this.workbook) return
    
    const sheet = this.workbook.sheets[0]
    const viewport = {
      scrollTop: 0,
      scrollLeft: 0,
      width: this.canvas.width,
      height: this.canvas.height,
      zoom: 1
    }
    
    this.renderer.render(sheet, viewport)
  }
  
  on(event: EventType, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }
  
  off(event: EventType, handler: EventHandler): void {
    this.eventHandlers.get(event)?.delete(handler)
  }
  
  private emit(event: EventType, data: any): void {
    this.eventHandlers.get(event)?.forEach(handler => handler(data))
  }
  
  destroy(): void {
    this.container.removeChild(this.canvas)
    this.eventHandlers.clear()
  }
}
```

---

## 🧪 测试你的代码

创建一个简单的HTML文件测试：

```html
<!DOCTYPE html>
<html>
<head>
  <title>Excel Renderer Test</title>
  <style>
    #container {
      width: 100%;
      height: 600px;
      border: 1px solid #ccc;
    }
  </style>
</head>
<body>
  <input type="file" id="fileInput" accept=".xlsx,.xls,.csv" />
  <div id="container"></div>
  
  <script type="module">
    import { ExcelRenderer } from './packages/core/dist/index.js'
    
    const container = document.getElementById('container')
    const renderer = new ExcelRenderer({ container })
    
    document.getElementById('fileInput').addEventListener('change', async (e) => {
      const file = e.target.files[0]
      await renderer.loadFile(file)
    })
    
    renderer.on('load', (event) => {
      console.log('加载完成:', event.sheetCount, '个工作表')
    })
  </script>
</body>
</html>
```

---

## 📚 更多资源

- [架构设计](./ARCHITECTURE.md) - 详细的架构设计文档
- [API设计](./API_DESIGN.md) - 完整的API参考
- [项目进度](./PROJECT_STATUS.md) - 当前项目进度
- [README](./README.md) - 项目说明

---

## 💡 开发技巧

### 1. 使用TypeScript严格模式
项目已配置严格的TypeScript检查，确保类型安全。

### 2. 遵循代码规范
使用ESLint和Prettier保持代码风格一致：
```bash
pnpm lint
pnpm format
```

### 3. 编写单元测试
每个功能模块都应该有对应的测试文件：
```typescript
// packages/core/src/parser/ExcelParser.spec.ts
import { describe, it, expect } from 'vitest'
import { ExcelParser } from './ExcelParser'

describe('ExcelParser', () => {
  it('should parse xlsx file', async () => {
    const parser = new ExcelParser()
    // 测试代码
  })
})
```

### 4. 性能监控
使用浏览器开发工具的Performance标签监控渲染性能。

---

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启Pull Request

---

## ❓ 常见问题

### Q: 为什么选择Canvas而不是DOM？
A: Canvas提供更好的性能，特别是在渲染大量单元格时。

### Q: 如何添加新的Excel函数支持？
A: 在`packages/core/src/engine/functions/`目录下添加相应的函数实现。

### Q: 如何自定义主题？
A: 参考`packages/core/src/theme/themes/`中的示例创建自定义主题。

---

**祝你开发愉快！** 🎉