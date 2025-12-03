# Excel渲染插件 - Vue示例项目

这是一个展示如何使用 `@excel-renderer/vue` 的完整示例项目。

## 功能展示

- ✅ Excel文件上传和加载
- ✅ 实时主题切换（亮色/暗色）
- ✅ 多语言切换（中文/英文）
- ✅ 单元格点击交互
- ✅ 工作簿信息显示
- ✅ 响应式UI设计

## 运行示例

### 安装依赖

在项目根目录运行：

```bash
pnpm install
```

### 启动开发服务器

```bash
cd examples/vue-demo
pnpm dev
```

浏览器会自动打开 `http://localhost:3000`

### 构建生产版本

```bash
pnpm build
```

构建产物会生成在 `dist` 目录。

### 预览生产构建

```bash
pnpm preview
```

## 项目结构

```
vue-demo/
├── src/
│   ├── App.vue          # 主应用组件
│   ├── main.ts          # 应用入口
│   └── style.css        # 全局样式
├── index.html           # HTML模板
├── vite.config.ts       # Vite配置
├── package.json         # 项目配置
└── README.md           # 本文件
```

## 代码示例

### 基础使用

```vue
<template>
  <ExcelViewer
    :file="file"
    :theme="theme"
    :locale="locale"
    @cell-click="handleCellClick"
  />
</template>

<script setup>
import { ref } from 'vue'
import { ExcelViewer } from '@excel-renderer/vue'

const file = ref()
const theme = ref('light')
const locale = ref('zh-CN')

function handleCellClick(event) {
  console.log('Clicked:', event.cell.ref)
}
</script>
```

### 使用Composables

```vue
<script setup>
import { useExcelRenderer, useTheme } from '@excel-renderer/vue'

const { loadFile, getCellValue } = useExcelRenderer({
  theme: 'light'
})

const { toggleTheme } = useTheme()
</script>
```

## 测试文件

你可以使用任何 `.xlsx`, `.xls` 或 `.csv` 文件进行测试。

示例文件可以：
1. 使用Microsoft Excel或WPS创建
2. 从网上下载示例Excel文件
3. 导出现有的电子表格

## 功能说明

### 主题切换

点击右上角的主题按钮可以在亮色和暗色主题之间切换。

### 语言切换

点击语言按钮可以切换界面语言。

### 单元格交互

点击任何单元格，底部状态栏会显示该单元格的引用和值。

### 工作表信息

底部状态栏显示：
- 工作表总数
- 当前工作表名称
- 选中单元格信息

## 技术栈

- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全
- **Vite** - 下一代前端工具
- **@excel-renderer/vue** - Excel渲染插件
- **@excel-renderer/core** - 核心渲染引擎

## 浏览器支持

- Chrome/Edge (最新版本)
- Firefox (最新版本)
- Safari (最新版本)

## 许可证

MIT