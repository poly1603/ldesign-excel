import type { Theme } from './theme'
import type { LocaleCode } from './i18n'
import type { WorkbookData } from './workbook'
import type { CellData } from './cell'
import type { EventHandler, EventMap } from './event'

/**
 * 功能配置
 */
export interface FeaturesConfig {
  /** 是否启用公式计算 */
  formula?: boolean
  /** 是否启用筛选 */
  filter?: boolean
  /** 是否启用排序 */
  sort?: boolean
  /** 是否启用搜索 */
  search?: boolean
  /** 是否启用右键菜单 */
  contextMenu?: boolean
  /** 是否显示工具栏 */
  toolbar?: boolean
  /** 是否启用单元格编辑 */
  editable?: boolean
}

/**
 * 性能配置
 */
export interface PerformanceConfig {
  /** 是否启用虚拟滚动 */
  virtualScroll?: boolean
  /** 是否启用Web Worker */
  workerEnabled?: boolean
  /** 是否启用缓存 */
  cacheEnabled?: boolean
  /** 缓冲行数 */
  bufferRows?: number
  /** 缓冲列数 */
  bufferCols?: number
  /** 最大缓存大小（MB） */
  maxCacheSize?: number
}

/**
 * 样式配置
 */
export interface StyleConfig {
  /** 默认行高 */
  rowHeight?: number
  /** 默认列宽 */
  colWidth?: number
  /** 默认字体大小 */
  fontSize?: number
  /** 默认字体 */
  fontFamily?: string
  /** 显示网格线 */
  showGridLines?: boolean
  /** 显示行号 */
  showRowNumbers?: boolean
  /** 显示列号 */
  showColNumbers?: boolean
}

/**
 * Excel渲染器配置选项
 */
export interface ExcelRendererOptions {
  /** 容器元素 */
  container: HTMLElement
  
  /** 主题配置 */
  theme?: 'light' | 'dark' | Theme
  
  /** 语言配置 */
  locale?: LocaleCode
  
  /** 是否可编辑 */
  editable?: boolean
  
  /** 功能开关 */
  features?: FeaturesConfig
  
  /** 性能配置 */
  performance?: PerformanceConfig
  
  /** 样式配置 */
  style?: StyleConfig
  
  /** 初始数据 */
  data?: WorkbookData
  
  /** 初始活动工作表索引 */
  activeSheet?: number
  
  /** 初始缩放级别 */
  zoom?: number
  
  /** 加载完成回调 */
  onLoad?: (workbook: WorkbookData) => void
  
  /** 错误回调 */
  onError?: (error: Error) => void
  
  /** 单元格点击回调 */
  onCellClick?: EventHandler<EventMap['cellClick']>
  
  /** 单元格双击回调 */
  onCellDoubleClick?: EventHandler<EventMap['cellDoubleClick']>
  
  /** 单元格值变化回调 */
  onCellChange?: EventHandler<EventMap['cellChange']>
  
  /** 选择变化回调 */
  onSelectionChange?: EventHandler<EventMap['selectionChange']>
  
  /** 工作表切换回调 */
  onSheetChange?: EventHandler<EventMap['sheetChange']>
  
  /** 滚动回调 */
  onScroll?: EventHandler<EventMap['scroll']>
  
  /** 缩放回调 */
  onZoom?: EventHandler<EventMap['zoom']>
}

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 导出格式 */
  format: 'xlsx' | 'csv' | 'pdf'
  /** 文件名 */
  filename?: string
  /** 是否包含样式 */
  includeStyle?: boolean
  /** 是否包含公式 */
  includeFormula?: boolean
  /** 导出范围 */
  range?: {
    startRow: number
    startCol: number
    endRow: number
    endCol: number
  }
  /** 导出的工作表索引（默认当前工作表） */
  sheetIndex?: number
}