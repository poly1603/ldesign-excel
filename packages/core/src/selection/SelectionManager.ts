import type { Selection, CellRange, CellData, SheetData } from '../types'
import { ExcelParser } from '../parser/ExcelParser'

/**
 * 选择管理器
 * 负责管理单元格选择状态
 */
export class SelectionManager {
  private selection: Selection
  private listeners: Set<(selection: Selection) => void>

  constructor() {
    this.selection = {
      activeCell: { row: 0, col: 0 },
      ranges: [],
      data: [],
    }
    this.listeners = new Set()
  }

  /**
   * 选择单个单元格
   */
  selectCell(row: number, col: number, sheet: SheetData): void {
    this.selection = {
      activeCell: { row, col },
      ranges: [{ startRow: row, startCol: col, endRow: row, endCol: col }],
      data: this.getCellsInRange({ startRow: row, startCol: col, endRow: row, endCol: col }, sheet),
    }
    this.notifyListeners()
  }

  /**
   * 选择区域
   */
  selectRange(range: CellRange, sheet: SheetData): void {
    this.selection = {
      activeCell: { row: range.startRow, col: range.startCol },
      ranges: [range],
      data: this.getCellsInRange(range, sheet),
    }
    this.notifyListeners()
  }

  /**
   * 扩展选择（Shift + Click）
   */
  extendSelection(row: number, col: number, sheet: SheetData): void {
    const activeCell = this.selection.activeCell
    const range: CellRange = {
      startRow: Math.min(activeCell.row, row),
      startCol: Math.min(activeCell.col, col),
      endRow: Math.max(activeCell.row, row),
      endCol: Math.max(activeCell.col, col),
    }

    this.selection = {
      activeCell,
      ranges: [range],
      data: this.getCellsInRange(range, sheet),
    }
    this.notifyListeners()
  }

  /**
   * 添加选择（Ctrl + Click）
   */
  addSelection(range: CellRange, sheet: SheetData): void {
    this.selection.ranges.push(range)
    this.selection.data = this.getAllSelectedData(sheet)
    this.notifyListeners()
  }

  /**
   * 清除选择
   */
  clearSelection(): void {
    this.selection = {
      activeCell: { row: 0, col: 0 },
      ranges: [],
      data: [],
    }
    this.notifyListeners()
  }

  /**
   * 获取当前选择
   */
  getSelection(): Selection {
    return { ...this.selection }
  }

  /**
   * 选择整行
   */
  selectRow(row: number, sheet: SheetData): void {
    const range: CellRange = {
      startRow: row,
      startCol: 0,
      endRow: row,
      endCol: sheet.colCount - 1,
    }
    this.selectRange(range, sheet)
  }

  /**
   * 选择整列
   */
  selectColumn(col: number, sheet: SheetData): void {
    const range: CellRange = {
      startRow: 0,
      startCol: col,
      endRow: sheet.rowCount - 1,
      endCol: col,
    }
    this.selectRange(range, sheet)
  }

  /**
   * 选择全部
   */
  selectAll(sheet: SheetData): void {
    const range: CellRange = {
      startRow: 0,
      startCol: 0,
      endRow: sheet.rowCount - 1,
      endCol: sheet.colCount - 1,
    }
    this.selectRange(range, sheet)
  }

  /**
   * 获取范围内的所有单元格
   */
  private getCellsInRange(range: CellRange, sheet: SheetData): CellData[] {
    const cells: CellData[] = []

    for (let row = range.startRow; row <= range.endRow; row++) {
      for (let col = range.startCol; col <= range.endCol; col++) {
        const ref = ExcelParser.toRef(row, col)
        const cell = sheet.cells.get(ref)
        if (cell) {
          cells.push(cell)
        }
      }
    }

    return cells
  }

  /**
   * 获取所有选中范围的单元格
   */
  private getAllSelectedData(sheet: SheetData): CellData[] {
    const allCells: CellData[] = []

    for (const range of this.selection.ranges) {
      const cells = this.getCellsInRange(range, sheet)
      allCells.push(...cells)
    }

    return allCells
  }

  /**
   * 检查单元格是否被选中
   */
  isCellSelected(row: number, col: number): boolean {
    return this.selection.ranges.some(
      (range) =>
        row >= range.startRow &&
        row <= range.endRow &&
        col >= range.startCol &&
        col <= range.endCol
    )
  }

  /**
   * 检查是否是活动单元格
   */
  isActiveCell(row: number, col: number): boolean {
    return this.selection.activeCell.row === row && this.selection.activeCell.col === col
  }

  /**
   * 监听选择变化
   */
  onSelectionChange(listener: (selection: Selection) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(this.selection)
    })
  }

  /**
   * 移动活动单元格（键盘导航）
   */
  moveActiveCell(direction: 'up' | 'down' | 'left' | 'right', sheet: SheetData): void {
    const { row, col } = this.selection.activeCell
    let newRow = row
    let newCol = col

    switch (direction) {
      case 'up':
        newRow = Math.max(0, row - 1)
        break
      case 'down':
        newRow = Math.min(sheet.rowCount - 1, row + 1)
        break
      case 'left':
        newCol = Math.max(0, col - 1)
        break
      case 'right':
        newCol = Math.min(sheet.colCount - 1, col + 1)
        break
    }

    if (newRow !== row || newCol !== col) {
      this.selectCell(newRow, newCol, sheet)
    }
  }

  /**
   * 获取选中区域的统计信息
   */
  getSelectionStats(): {
    cellCount: number
    rowCount: number
    colCount: number
    hasData: boolean
  } {
    if (this.selection.ranges.length === 0) {
      return { cellCount: 0, rowCount: 0, colCount: 0, hasData: false }
    }

    const range = this.selection.ranges[0]
    const rowCount = range.endRow - range.startRow + 1
    const colCount = range.endCol - range.startCol + 1

    return {
      cellCount: this.selection.data.length,
      rowCount,
      colCount,
      hasData: this.selection.data.length > 0,
    }
  }
}