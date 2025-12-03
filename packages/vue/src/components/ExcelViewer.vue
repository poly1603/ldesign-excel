<template>
  <div ref="containerRef" class="excel-viewer" :class="themeClass">
    <!-- Excel渲染容器 -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { ExcelRenderer } from '@excel-renderer/core'
import type {
  WorkbookData,
  Theme,
  LocaleCode,
  FeaturesConfig,
  PerformanceConfig,
  StyleConfig,
} from '@excel-renderer/core'

/**
 * ExcelViewer组件Props
 */
export interface ExcelViewerProps {
  /** Excel文件 */
  file?: File
  /** 工作簿数据 */
  data?: WorkbookData
  /** 主题 */
  theme?: 'light' | 'dark' | Theme
  /** 语言 */
  locale?: LocaleCode
  /** 是否可编辑 */
  editable?: boolean
  /** 功能配置 */
  features?: FeaturesConfig
  /** 性能配置 */
  performance?: PerformanceConfig
  /** 样式配置 */
  styleConfig?: StyleConfig
  /** 活动工作表索引 */
  activeSheet?: number
  /** 缩放级别 */
  zoom?: number
}

const props = withDefaults(defineProps<ExcelViewerProps>(), {
  theme: 'light',
  locale: 'zh-CN',
  editable: false,
  activeSheet: 0,
  zoom: 1,
})

/**
 * ExcelViewer组件Emits
 */
export interface ExcelViewerEmits {
  (e: 'load', workbook: WorkbookData): void
  (e: 'error', error: Error): void
  (e: 'cell-click', event: any): void
  (e: 'cell-double-click', event: any): void
  (e: 'cell-change', event: any): void
  (e: 'selection-change', event: any): void
  (e: 'sheet-change', event: any): void
  (e: 'scroll', event: any): void
  (e: 'zoom', level: number): void
}

const emit = defineEmits<ExcelViewerEmits>()

// Refs
const containerRef = ref<HTMLElement>()
let renderer: ExcelRenderer | null = null

// Computed
const themeClass = computed(() => {
  const theme = typeof props.theme === 'string' ? props.theme : props.theme?.name
  return `excel-viewer--${theme}`
})

/**
 * 初始化渲染器
 */
function initRenderer() {
  if (!containerRef.value) return

  try {
    renderer = new ExcelRenderer({
      container: containerRef.value,
      theme: props.theme,
      locale: props.locale,
      editable: props.editable,
      features: props.features,
      performance: props.performance,
      style: props.styleConfig,
      activeSheet: props.activeSheet,
      zoom: props.zoom,
      onLoad: (workbook) => emit('load', workbook),
      onError: (error) => emit('error', error),
      onCellClick: (event) => emit('cell-click', event),
      onCellDoubleClick: (event) => emit('cell-double-click', event),
      onCellChange: (event) => emit('cell-change', event),
      onSelectionChange: (event) => emit('selection-change', event),
      onSheetChange: (event) => emit('sheet-change', event),
      onScroll: (event) => emit('scroll', event),
      onZoom: (level) => emit('zoom', level),
    })

    // 如果提供了数据，加载它
    if (props.data) {
      renderer.loadData(props.data)
    }
  } catch (error) {
    console.error('初始化Excel渲染器失败:', error)
    emit('error', error as Error)
  }
}

/**
 * 销毁渲染器
 */
function destroyRenderer() {
  if (renderer) {
    renderer.destroy()
    renderer = null
  }
}

// Watch file changes
watch(
  () => props.file,
  async (newFile) => {
    if (newFile && renderer) {
      try {
        await renderer.loadFile(newFile)
      } catch (error) {
        console.error('加载Excel文件失败:', error)
      }
    }
  }
)

// Watch data changes
watch(
  () => props.data,
  (newData) => {
    if (newData && renderer) {
      renderer.loadData(newData)
    }
  }
)

// Watch theme changes
watch(
  () => props.theme,
  (newTheme) => {
    if (renderer) {
      renderer.setTheme(newTheme)
    }
  }
)

// Watch locale changes
watch(
  () => props.locale,
  (newLocale) => {
    if (renderer && newLocale) {
      renderer.setLocale(newLocale)
    }
  }
)

// Watch activeSheet changes
watch(
  () => props.activeSheet,
  (newIndex) => {
    if (renderer && newIndex !== undefined) {
      try {
        renderer.setActiveSheet(newIndex)
      } catch (error) {
        console.error('切换工作表失败:', error)
      }
    }
  }
)

// Lifecycle
onMounted(() => {
  initRenderer()

  // 如果提供了文件，加载它
  if (props.file && renderer) {
    renderer.loadFile(props.file).catch((error) => {
      console.error('加载Excel文件失败:', error)
    })
  }
})

onUnmounted(() => {
  destroyRenderer()
})

// Expose methods
defineExpose({
  /** 获取渲染器实例 */
  getRenderer: () => renderer,
  /** 加载文件 */
  loadFile: (file: File) => renderer?.loadFile(file),
  /** 加载数据 */
  loadData: (data: WorkbookData) => renderer?.loadData(data),
  /** 设置活动工作表 */
  setActiveSheet: (index: number) => renderer?.setActiveSheet(index),
  /** 获取活动工作表 */
  getActiveSheet: () => renderer?.getActiveSheet(),
  /** 获取工作表数量 */
  getSheetCount: () => renderer?.getSheetCount(),
  /** 获取所有工作表名称 */
  getSheetNames: () => renderer?.getSheetNames(),
  /** 获取单元格值 */
  getCellValue: (ref: string) => renderer?.getCellValue(ref),
  /** 设置主题 */
  setTheme: (theme: string | Theme) => renderer?.setTheme(theme),
  /** 设置语言 */
  setLocale: (locale: LocaleCode) => renderer?.setLocale(locale),
})
</script>

<style scoped>
.excel-viewer {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: var(--excel-bg-color, #ffffff);
}

.excel-viewer--light {
  --excel-bg-color: #ffffff;
  --excel-text-color: #000000;
}

.excel-viewer--dark {
  --excel-bg-color: #1e1e1e;
  --excel-text-color: #d4d4d4;
}
</style>