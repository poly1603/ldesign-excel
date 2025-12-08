# Excel Viewer

高性能 Excel 文档预览插件，支持在浏览器中预览 xlsx 文件，渲染效果接近 Excel 软件。

## 特性

- 🚀 **高性能渲染** - 基于 Canvas 虚拟滚动，支持百万级单元格
- 📊 **完整格式支持** - 支持 xlsx 格式，包括样式、公式、合并单元格等
- 🎨 **丰富样式** - 完整支持单元格样式、条件格式、主题
- 📱 **响应式设计** - 自适应容器大小，支持移动端
- 🔍 **功能全面** - 搜索、缩放、冻结窗格、多工作表等
- 🎯 **Vue 3 支持** - 提供开箱即用的 Vue 3 组件和 Composables
- 🔧 **配置丰富** - 工具栏、主题、渲染选项等灵活配置
- 📦 **轻量级** - 核心库小于 100KB (gzipped)

## 包结构

| 包名 | 说明 |
|------|------|
| `@excel-viewer/core` | 核心解析和渲染引擎，与框架无关 |
| `@excel-viewer/vue` | Vue 3 组件和 Composables |

## 安装

```bash
# 使用 npm
npm install @excel-viewer/vue

# 使用 pnpm
pnpm add @excel-viewer/vue

# 使用 yarn
yarn add @excel-viewer/vue
```

## 快速开始

### Vue 3 组件方式

```vue
<template>
  <ExcelViewer
    :src="fileUrl"
    :width="800"
    :height="600"
    @load="handleLoad"
    @cell-click="handleCellClick"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ExcelViewer } from '@excel-viewer/vue';

const fileUrl = ref('/path/to/file.xlsx');

const handleLoad = (data) => {
  console.log('加载完成', data.workbook);
};

const handleCellClick = (data) => {
  console.log('点击单元格', data.address);
};
</script>
```

### 原生 JavaScript 方式

```typescript
import { ExcelViewer } from '@excel-viewer/core';

const viewer = new ExcelViewer({
  container: '#excel-container',
  toolbar: { visible: true }
});

// 加载文件
await viewer.loadUrl('/path/to/file.xlsx');

// 或者加载 File 对象
await viewer.loadFile(file);
```

## 功能支持

### 已支持
- ✅ xlsx 文件解析
- ✅ 单元格样式 (字体、颜色、对齐、边框、填充)
- ✅ 合并单元格
- ✅ 冻结窗格
- ✅ 多工作表
- ✅ 数字格式化
- ✅ 公式显示
- ✅ 超链接
- ✅ 自动筛选标记
- ✅ 条件格式 (基础)
- ✅ 数据验证标记
- ✅ 虚拟滚动
- ✅ 缩放
- ✅ 键盘导航
- ✅ 复制选区

### 计划支持
- 📋 图表渲染
- 📋 图片渲染
- 📋 批注显示
- 📋 数据透视表
- 📋 导出 PDF/图片
- 📋 打印优化
- 📋 xls 格式支持

## 开发

```bash
# 安装依赖
pnpm install

# 启动 playground
pnpm dev

# 构建所有包
pnpm build

# 类型检查
pnpm type-check

# 代码格式化
pnpm format
```

## 项目结构

```
excel-viewer/
├── packages/
│   ├── core/           # 核心库
│   │   ├── src/
│   │   │   ├── parser/     # Excel 解析器
│   │   │   ├── renderer/   # Canvas 渲染器
│   │   │   ├── events/     # 事件系统
│   │   │   ├── utils/      # 工具函数
│   │   │   ├── types/      # 类型定义
│   │   │   └── ExcelViewer.ts
│   │   └── package.json
│   └── vue/            # Vue 组件库
│       ├── src/
│       │   ├── components/   # Vue 组件
│       │   ├── composables/  # Composables
│       │   └── index.ts
│       └── package.json
├── playground/         # 演示项目
├── package.json
└── pnpm-workspace.yaml
```

## API 文档

详细 API 文档请参考各包的 README：

- [@excel-viewer/core](./packages/core/README.md)
- [@excel-viewer/vue](./packages/vue/README.md)

## 浏览器支持

- Chrome >= 80
- Firefox >= 75
- Safari >= 13
- Edge >= 80

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
