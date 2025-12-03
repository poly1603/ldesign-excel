# Excel Renderer - 高性能Excel渲染插件

<div align="center">

一个功能强大、性能优越的Excel文件渲染插件，采用框架无关的核心设计。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[特性](#-特性) • [架构](#-架构) • [快速开始](#-快速开始) • [文档](#-文档)

</div>

---

## ✨ 特性

### 🚀 高性能
- **虚拟滚动** - 支持百万级单元格流畅渲染
- **Canvas渲染** - 比DOM渲染快10-100倍
- **Web Worker** - 后台处理文件解析和公式计算
- **智能缓存** - 样式和计算结果缓存优化

### 📊 功能完善
- **多格式支持** - `.xlsx` / `.xls` / `.csv`
- **完整样式** - 字体、颜色、边框、对齐、合并单元格
- **公式引擎** - 支持常用Excel公式（SUM、IF、VLOOKUP等）
- **交互功能** - 筛选、排序、查找、单元格选择
- **冻结窗格** - 行列冻结支持

### 🎨 可定制
- **主题系统** - 内置亮色/暗色主题，支持自定义
- **国际化** - 中文/英文，可扩展其他语言
- **插件系统** - 灵活的扩展机制

### 🔧 易集成
- **框架无关** - Core包可用于任何项目
- **Vue适配** - 开箱即用的Vue组件
- **TypeScript** - 完整的类型定义

---

## 🏗️ 架构

```
┌─────────────────────────────────────────────┐
│           应用层 (Application)               │
│  ┌──────────────┐      ┌──────────────┐    │
│  │  Vue App     │      │  React App   │    │
│  └──────────────┘      └──────────────┘    │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│          适配层 (Adapters)                   │
│  ┌──────────────┐      ┌──────────────┐    │
│  │ @excel/vue   │      │ @excel/react │    │
│  └──────────────┘      └──────────────┘    │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│          核心层 (@excel/core)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Parser  │ │ Renderer │ │  Engine  │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Theme   │ │   I18n   │ │ Interact │   │
│  └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────┘
```

### Monorepo结构

```
excel-renderer/
├── packages/
│   ├── core/          # 框架无关核心
│   └── vue/           # Vue框架适配
├── examples/          # 示例项目
└── docs/              # 文档
```

---

## 🚀 快速开始

### 安装

#### Core包（框架无关）

```bash
npm install @excel-renderer/core
# 或
pnpm add @excel-renderer/core
```

#### Vue包

```bash
npm install @excel-renderer/vue
# 或
pnpm add @excel-renderer/vue
```

### 使用

#### 在原生JavaScript中使用

```typescript
import { ExcelRenderer } from '@excel-renderer/core'

// 创建渲染器
const renderer = new ExcelRenderer({
  container: document.getElementById('excel-container'),
  theme: 'light',
  locale: 'zh-CN'
})

// 加载Excel文件
const fileInput = document.querySelector('input[type="file"]')
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  await renderer.loadFile(file)
})

// 监听单元格点击
renderer.on('cellClick', (event) => {
  console.log('点击单元格:', event.cell.ref, event.cell.value)
})
```

#### 在Vue中使用

```vue
<template>
  <div class="app">
    <input type="file" @change="handleFileChange" />
    
    <ExcelViewer
      :file="file"
      :theme="theme"
      :locale="locale"
      :editable="true"
      @cell-click="handleCellClick"
      @cell-change="handleCellChange"
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

function handleCellClick(event) {
  console.log('点击:', event.cell.ref, event.cell.value)
}

function handleCellChange(event) {
  console.log('值变化:', event.oldValue, '->', event.newValue)
}
</script>
```

---

## 📦 包说明

### @excel-renderer/core

框架无关的核心包，提供：
- Excel文件解析（xlsx, xls, csv）
- Canvas高性能渲染
- 虚拟滚动
- 公式计算引擎
- 主题系统
- 国际化

**适用场景**：
- 原生JavaScript项目
- 需要自定义UI的项目
- 作为其他框架适配的基础

### @excel-renderer/vue

Vue 3框架适配包，提供：
- `<ExcelViewer>` 组件
- Composition API集成
- 响应式状态管理
- Vue生态集成

**适用场景**：
- Vue 3项目
- 需要快速集成的项目

---

## 🎨 主题

### 内置主题

- **light** - 亮色主题（默认）
- **dark** - 暗色主题

### 自定义主题

```typescript
import { ThemeManager } from '@excel-renderer/core'

const customTheme = {
  name: 'custom',
  colors: {
    background: '#ffffff',
    foreground: '#000000',
    grid: '#e0e0e0',
    selection: '#4285f4',
    // ... 更多颜色配置
  },
  fonts: {
    default: 'Arial',
    size: 14
  }
}

// 注册主题
renderer.registerTheme(customTheme)

// 使用主题
renderer.setTheme('custom')
```

---

## 🌍 国际化

### 支持的语言

- 简体中文 (zh-CN)
- 英文 (en-US)

### 切换语言

```typescript
renderer.setLocale('zh-CN')  // 中文
renderer.setLocale('en-US')  // 英文
```

### 添加自定义语言

```typescript
import { I18nManager } from '@excel-renderer/core'

const customLocale = {
  toolbar: {
    zoomIn: '放大',
    zoomOut: '缩小',
    // ...
  }
}

renderer.registerLocale('zh-TW', customLocale)
```

---

## ⚡ 性能

### 性能指标

| 指标 | 目标 | 说明 |
|------|------|------|
| 文件解析 | < 2秒 | 10MB Excel文件 |
| 首次渲染 | < 500ms | 1000行数据 |
| 滚动帧率 | 60 FPS | 流畅滚动体验 |
| 内存占用 | < 100MB | 10万行数据 |

### 性能优化建议

1. **启用虚拟滚动** - 处理大数据时必须开启
2. **使用Web Worker** - 文件解析和公式计算异步处理
3. **启用缓存** - 减少重复计算
4. **合理设置缓冲区** - 平衡性能和内存

```typescript
const renderer = new ExcelRenderer({
  container: element,
  performance: {
    virtualScroll: true,    // 虚拟滚动
    workerEnabled: true,     // Web Worker
    cacheEnabled: true,      // 缓存
    bufferRows: 10          // 缓冲行数
  }
})
```

---

## 🔧 API文档

### Core包主要API

```typescript
// 创建实例
const renderer = new ExcelRenderer(options)

// 文件操作
await renderer.loadFile(file)
await renderer.export('xlsx')

// 单元格操作
renderer.getCellValue('A1')
renderer.setCellValue('A1', 100)

// 工作表操作
renderer.setActiveSheet(0)
renderer.getSheetNames()

// 主题和语言
renderer.setTheme('dark')
renderer.setLocale('zh-CN')

// 事件监听
renderer.on('cellClick', handler)
```

详细API文档请查看 [API_DESIGN.md](./API_DESIGN.md)

---

## 📖 文档

- [架构设计](./ARCHITECTURE.md) - 详细的架构设计文档
- [API设计](./API_DESIGN.md) - 完整的API参考
- [开发指南](./docs/guide/getting-started.md) - 开发入门指南
- [性能优化](./docs/guide/performance.md) - 性能优化建议

---

## 🗺️ 开发路线图

### ✅ 第一阶段：基础架构（第1-2周）
- [x] Monorepo搭建
- [x] Core包基础结构
- [ ] Excel文件解析
- [ ] 基础Canvas渲染
- [ ] 简单样式支持

### 🚧 第二阶段：核心功能（第3-4周）
- [ ] 虚拟滚动
- [ ] 完整样式系统
- [ ] 合并单元格
- [ ] 冻结窗格
- [ ] 选择和交互

### 📅 第三阶段：高级功能（第5-6周）
- [ ] 公式引擎
- [ ] 筛选排序
- [ ] 主题系统
- [ ] 国际化

### 📅 第四阶段：框架适配（第7-8周）
- [ ] Vue组件封装
- [ ] 示例项目
- [ ] 文档和测试

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

### 开发环境设置

```bash
# 克隆项目
git clone https://github.com/your-username/excel-renderer.git

# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test
```

---

## 📄 许可证

[MIT License](LICENSE)

---

## 🙏 致谢

- [SheetJS](https://sheetjs.com/) - Excel文件解析
- [Formula.js](https://formulajs.info/) - 公式计算
- 所有贡献者

---

<div align="center">

**如果这个项目对你有帮助，请给我们一个 ⭐️**

Made with ❤️ by Excel Renderer Team

</div>