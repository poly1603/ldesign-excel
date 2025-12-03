import type { CellData, CellRange, SheetData } from '../types'
import { ExcelParser } from '../parser/ExcelParser'

/**
 * 筛选条件类型
 */
export type FilterCondition = {
  column: number
  type: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan'
  value: any
}

/**
 * 排序方向
 */
export type SortDirection = 'asc' | 'desc'

/**
 * 排序配置
 */
export type SortConfig = {
  column: number
  direction: SortDirection
}

/**
 * 筛选和排序管理器
 */
export class FilterManager {
  private filters: FilterCondition[] = []
  private sortConfig: SortConfig | null = null
  private originalData: SheetData | null = null
  private filteredRows: Set<number> = new Set()

  /**
   * 设置原始数据
   */
  setData(sheet: SheetData): void {
    this.originalData = sheet
    this.filteredRows.clear()
  }

  /**
   * 添加筛选条件
   */
  addFilter(condition: FilterCondition): void {
    this.filters.push(condition)
    this.applyFilters()
  }

  /**
   * 移除筛选条件
   */
  removeFilter(column: number): void {
    this.filters = this.filters.filter((f) => f.column !== column)
    this.applyFilters()
  }

  /**
   * 清除所有筛选
   */
  clearFilters(): void {
    this.filters = []
    this.filteredRows.clear()
  }

  /**
   * 应用筛选
   */
  private applyFilters(): void {
    if (!this.originalData) return

    this.filteredRows.clear()

    if (this.filters.length === 0) {
      return
    }

    // 遍历所有行，检查是否满足筛选条件
    for (let row = 0; row < this.originalData.rowCount; row++) {
      let shouldHide = false

      for (const filter of this.filters) {
        const cellRef = ExcelParser.toRef(row, filter.column)
        const cell = this.originalData.cells.get(cellRef)
        const value = cell?.value || ''

        if (!this.matchesFilter(value, filter)) {
          shouldHide = true
          break
        }
      }

      if (shouldHide) {
        this.filteredRows.add(row)
      }
    }
  }

  /**
   * 检查值是否匹配筛选条件
   */
  private matchesFilter(value: any, filter: FilterCondition): boolean {
    const strValue = String(value).toLowerCase()
    const filterValue = String(filter.value).toLowerCase()

    switch (filter.type) {
      case 'equals':
        return strValue === filterValue

      case 'contains':
        return strValue.includes(filterValue)

      case 'startsWith':
        return strValue.startsWith(filterValue)

      case 'endsWith':
        return strValue.endsWith(filterValue)

      case 'greaterThan':
        return Number(value) > Number(filter.value)

      case 'lessThan':
        return Number(value) < Number(filter.value)

      default:
        return true
    }
  }

  /**
   * 设置排序
   */
  setSort(config: SortConfig): void {
    this.sortConfig = config
  }

  /**
   * 清除排序
   */
  clearSort(): void {
    this.sortConfig = null
  }

  /**
   * 获取排序后的行索引数组
   */
  getSortedRows(sheet: SheetData): number[] {
    if (!this.sortConfig) {
      return Array.from({ length: sheet.rowCount }, (_, i) => i)
    }

    const rows: Array<{ index: number; value: any }> = []

    // 收集所有行的排序列值
    for (let row = 0; row < sheet.rowCount; row++) {
      // 跳过被筛选的行
      if (this.filteredRows.has(row)) {
        continue
      }

      const cellRef = ExcelParser.toRef(row, this.sortConfig.column)
      const cell = sheet.cells.get(cellRef)
      rows.push({
        index: row,
        value: cell?.value || '',
      })
    }

    // 排序
    rows.sort((a, b) => {
      const aVal = a.value
      const bVal = b.value

      // 数字比较
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return this.sortConfig!.direction === 'asc' ? aVal - bVal : bVal - aVal
      }

      // 字符串比较
      const aStr = String(aVal)
      const bStr = String(bVal)

      if (this.sortConfig!.direction === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })

    return rows.map((r) => r.index)
  }

  /**
   * 检查行是否被筛选隐藏
   */
  isRowFiltered(row: number): boolean {
    return this.filteredRows.has(row)
  }

  /**
   * 获取当前筛选条件
   */
  getFilters(): FilterCondition[] {
    return [...this.filters]
  }

  /**
   * 获取当前排序配置
   */
  getSortConfig(): SortConfig | null {
    return this.sortConfig
  }

  /**
   * 获取筛选后的行数
   */
  getVisibleRowCount(sheet: SheetData): number {
    return sheet.rowCount - this.filteredRows.size
  }

  /**
   * 按列值获取唯一值列表（用于筛选菜单）
   */
  getUniqueValues(sheet: SheetData, column: number): any[] {
    const values = new Set<any>()

    for (let row = 0; row < sheet.rowCount; row++) {
      const cellRef = ExcelParser.toRef(row, column)
      const cell = sheet.cells.get(cellRef)
      if (cell && cell.value !== null && cell.value !== undefined) {
        values.add(cell.value)
      }
    }

    return Array.from(values).sort()
  }

  /**
   * 快速筛选：只显示选中的值
   */
  filterByValues(column: number, values: any[]): void {
    // 移除该列的现有筛选
    this.removeFilter(column)

    // 如果没有选中任何值，显示所有
    if (values.length === 0) {
      return
    }

    // 添加新的筛选条件
    if (!this.originalData) return

    this.filteredRows.clear()

    for (let row = 0; row < this.originalData.rowCount; row++) {
      const cellRef = ExcelParser.toRef(row, column)
      const cell = this.originalData.cells.get(cellRef)
      const cellValue = cell?.value

      if (!values.includes(cellValue)) {
        this.filteredRows.add(row)
      }
    }
  }

  /**
   * 获取筛选统计信息
   */
  getFilterStats(): {
    totalRows: number
    visibleRows: number
    hiddenRows: number
    filterCount: number
  } {
    const totalRows = this.originalData?.rowCount || 0

    return {
      totalRows,
      visibleRows: totalRows - this.filteredRows.size,
      hiddenRows: this.filteredRows.size,
      filterCount: this.filters.length,
    }
  }
}