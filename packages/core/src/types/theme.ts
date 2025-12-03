/**
 * 主题颜色配置
 */
export interface ThemeColors {
  /** 背景色 */
  background: string
  /** 前景色（文本） */
  foreground: string
  /** 网格线颜色 */
  grid: string
  /** 加粗网格线颜色 */
  gridStrong: string
  /** 表头背景色 */
  headerBg: string
  /** 表头文本颜色 */
  headerText: string
  /** 表头边框颜色 */
  headerBorder: string
  /** 选择背景色 */
  selection: string
  /** 选择边框颜色 */
  selectionBorder: string
  /** 活动单元格背景色 */
  activeCell: string
  /** 活动单元格边框颜色 */
  activeCellBorder: string
  /** 冻结线颜色 */
  frozenLine: string
  /** 滚动条背景 */
  scrollbar: string
  /** 滚动条滑块 */
  scrollbarThumb: string
  /** 悬停颜色 */
  hover: string
}

/**
 * 主题字体配置
 */
export interface ThemeFonts {
  /** 默认字体 */
  default: string
  /** 默认字体大小 */
  size: number
  /** 表头字体 */
  header: string
  /** 表头字体大小 */
  headerSize: number
}

/**
 * 主题间距配置
 */
export interface ThemeSpacing {
  /** 单元格内边距 */
  cellPadding: number
  /** 默认行高 */
  rowHeight: number
  /** 默认列宽 */
  colWidth: number
  /** 表头高度 */
  headerHeight: number
  /** 表头宽度 */
  headerWidth: number
}

/**
 * 主题边框配置
 */
export interface ThemeBorders {
  /** 边框宽度 */
  width: number
  /** 边框样式 */
  style: string
  /** 选择边框宽度 */
  selectionWidth: number
}

/**
 * 主题配置
 */
export interface Theme {
  /** 主题名称 */
  name: string
  /** 颜色配置 */
  colors: ThemeColors
  /** 字体配置 */
  fonts: ThemeFonts
  /** 间距配置 */
  spacing: ThemeSpacing
  /** 边框配置 */
  borders: ThemeBorders
}