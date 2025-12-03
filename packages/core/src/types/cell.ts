import type { CellStyle } from './style'

/**
 * 单元格数据类型
 */
export type CellDataType = 'string' | 'number' | 'boolean' | 'date' | 'error' | 'formula'

/**
 * 单元格数据
 */
export interface CellData {
  /** 行号（从0开始） */
  row: number
  /** 列号（从0开始） */
  col: number
  /** 单元格引用（如 "A1"） */
  ref: string
  /** 原始值 */
  value: any
  /** 显示值 */
  displayValue: string
  /** 公式（如果有） */
  formula?: string
  /** 数据类型 */
  dataType: CellDataType
  /** 样式 */
  style: CellStyle
  /** 合并信息 */
  merge?: MergeRange
}

/**
 * 单元格范围
 */
export interface CellRange {
  /** 起始行 */
  startRow: number
  /** 起始列 */
  startCol: number
  /** 结束行 */
  endRow: number
  /** 结束列 */
  endCol: number
}

/**
 * 合并单元格范围
 */
export interface MergeRange extends CellRange {
  /** 引用字符串（如 "A1:C3"） */
  ref: string
}

/**
 * 单元格选择
 */
export interface Selection {
  /** 活动单元格 */
  activeCell: {
    row: number
    col: number
  }
  /** 选择范围 */
  ranges: CellRange[]
  /** 选中的数据 */
  data: CellData[]
}

/**
 * 单元格上下文（用于公式计算）
 */
export interface CellContext {
  /** 当前单元格 */
  cell: CellData
  /** 工作表数据 */
  sheet: Map<string, CellData>
  /** 获取单元格值 */
  getCellValue: (ref: string) => any
}