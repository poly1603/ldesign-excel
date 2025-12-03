import type { CellData, MergeRange } from './cell'

/**
 * 工作簿元数据
 */
export interface WorkbookMetadata {
  /** 创建者 */
  creator?: string
  /** 创建时间 */
  created?: Date
  /** 修改时间 */
  modified?: Date
  /** 工作表数量 */
  sheetCount: number
  /** 最后修改者 */
  lastModifiedBy?: string
  /** 应用程序 */
  application?: string
}

/**
 * 工作表数据
 */
export interface SheetData {
  /** 工作表名称 */
  name: string
  /** 工作表索引 */
  index: number
  /** 单元格数据（key为单元格引用如"A1"） */
  cells: Map<string, CellData>
  /** 合并单元格范围 */
  merges: MergeRange[]
  /** 冻结行数 */
  frozenRows: number
  /** 冻结列数 */
  frozenCols: number
  /** 行高映射（key为行号） */
  rowHeights: Map<number, number>
  /** 列宽映射（key为列号） */
  colWidths: Map<number, number>
  /** 总行数 */
  rowCount: number
  /** 总列数 */
  colCount: number
  /** 是否隐藏 */
  hidden?: boolean
  /** 是否受保护 */
  protected?: boolean
}

/**
 * 工作簿数据
 */
export interface WorkbookData {
  /** 所有工作表 */
  sheets: SheetData[]
  /** 元数据 */
  metadata: WorkbookMetadata
  /** 活动工作表索引 */
  activeSheetIndex?: number
}

/**
 * 视口信息
 */
export interface Viewport {
  /** 垂直滚动位置 */
  scrollTop: number
  /** 水平滚动位置 */
  scrollLeft: number
  /** 视口宽度 */
  width: number
  /** 视口高度 */
  height: number
  /** 缩放级别（1.0为100%） */
  zoom: number
}

/**
 * 滚动信息
 */
export interface ScrollInfo {
  /** 垂直滚动位置 */
  scrollTop: number
  /** 水平滚动位置 */
  scrollLeft: number
  /** 最大垂直滚动位置 */
  maxScrollTop: number
  /** 最大水平滚动位置 */
  maxScrollLeft: number
  /** 可见行数 */
  visibleRows: number
  /** 可见列数 */
  visibleCols: number
}