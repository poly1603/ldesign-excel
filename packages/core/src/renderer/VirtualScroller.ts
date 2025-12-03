import type { Viewport, CellRange } from '../types'

/**
 * 虚拟滚动器配置
 */
export interface VirtualScrollerOptions {
  /** 默认行高 */
  rowHeight?: number
  /** 默认列宽 */
  colWidth?: number
  /** 缓冲行数 */
  bufferRows?: number
  /** 缓冲列数 */
  bufferCols?: number
}

/**
 * 虚拟滚动器
 * 负责计算可见区域，实现大数据量高性能滚动
 */
export class VirtualScroller {
  private rowHeight: number
  private colWidth: number
  private bufferRows: number
  private bufferCols: number
  private rowHeights: Map<number, number>
  private colWidths: Map<number, number>

  constructor(options: VirtualScrollerOptions = {}) {
    this.rowHeight = options.rowHeight || 25
    this.colWidth = options.colWidth || 100
    this.bufferRows = options.bufferRows || 5
    this.bufferCols = options.bufferCols || 3
    this.rowHeights = new Map()
    this.colWidths = new Map()
  }

  /**
   * 设置行高映射
   */
  setRowHeights(heights: Map<number, number>): void {
    this.rowHeights = heights
  }

  /**
   * 设置列宽映射
   */
  setColWidths(widths: Map<number, number>): void {
    this.colWidths = widths
  }

  /**
   * 获取可见单元格范围
   */
  getVisibleRange(viewport: Viewport): CellRange {
    const startRow = this.getRowByY(viewport.scrollTop)
    const endRow = this.getRowByY(viewport.scrollTop + viewport.height)
    const startCol = this.getColByX(viewport.scrollLeft)
    const endCol = this.getColByX(viewport.scrollLeft + viewport.width)

    // 添加缓冲区，减少滚动时的闪烁
    return {
      startRow: Math.max(0, startRow - this.bufferRows),
      endRow: endRow + this.bufferRows,
      startCol: Math.max(0, startCol - this.bufferCols),
      endCol: endCol + this.bufferCols,
    }
  }

  /**
   * 根据Y坐标获取行号（使用二分查找优化）
   */
  private getRowByY(y: number): number {
    if (this.rowHeights.size === 0) {
      // 所有行高度相同
      return Math.floor(y / this.rowHeight)
    }

    // 使用累积高度查找
    let currentY = 0
    let row = 0

    while (currentY < y) {
      const height = this.rowHeights.get(row) || this.rowHeight
      currentY += height
      row++
    }

    return Math.max(0, row - 1)
  }

  /**
   * 根据X坐标获取列号
   */
  private getColByX(x: number): number {
    if (this.colWidths.size === 0) {
      // 所有列宽度相同
      return Math.floor(x / this.colWidth)
    }

    // 使用累积宽度查找
    let currentX = 0
    let col = 0

    while (currentX < x) {
      const width = this.colWidths.get(col) || this.colWidth
      currentX += width
      col++
    }

    return Math.max(0, col - 1)
  }

  /**
   * 获取行的Y坐标
   */
  getRowY(row: number): number {
    if (this.rowHeights.size === 0) {
      return row * this.rowHeight
    }

    let y = 0
    for (let r = 0; r < row; r++) {
      y += this.rowHeights.get(r) || this.rowHeight
    }
    return y
  }

  /**
   * 获取列的X坐标
   */
  getColX(col: number): number {
    if (this.colWidths.size === 0) {
      return col * this.colWidth
    }

    let x = 0
    for (let c = 0; c < col; c++) {
      x += this.colWidths.get(c) || this.colWidth
    }
    return x
  }

  /**
   * 获取行高
   */
  getRowHeight(row: number): number {
    return this.rowHeights.get(row) || this.rowHeight
  }

  /**
   * 获取列宽
   */
  getColWidth(col: number): number {
    return this.colWidths.get(col) || this.colWidth
  }

  /**
   * 计算总内容高度
   */
  getTotalHeight(rowCount: number): number {
    if (this.rowHeights.size === 0) {
      return rowCount * this.rowHeight
    }

    let height = 0
    for (let row = 0; row < rowCount; row++) {
      height += this.rowHeights.get(row) || this.rowHeight
    }
    return height
  }

  /**
   * 计算总内容宽度
   */
  getTotalWidth(colCount: number): number {
    if (this.colWidths.size === 0) {
      return colCount * this.colWidth
    }

    let width = 0
    for (let col = 0; col < colCount; col++) {
      width += this.colWidths.get(col) || this.colWidth
    }
    return width
  }

  /**
   * 根据坐标获取单元格位置
   */
  getCellByPosition(x: number, y: number): { row: number; col: number } {
    return {
      row: this.getRowByY(y),
      col: this.getColByX(x),
    }
  }

  /**
   * 获取单元格的矩形区域
   */
  getCellRect(row: number, col: number): {
    x: number
    y: number
    width: number
    height: number
  } {
    return {
      x: this.getColX(col),
      y: this.getRowY(row),
      width: this.getColWidth(col),
      height: this.getRowHeight(row),
    }
  }
}