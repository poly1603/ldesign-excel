/**
 * 选区管理器
 * 处理单元格选择、多选、范围选择等
 */

import type { CellAddress, CellRange, Selection } from '../types';

export interface SelectionManagerOptions {
  /** 是否支持多选 */
  multiSelect?: boolean;
  /** 选区变化回调 */
  onSelectionChange?: (selection: Selection) => void;
}

export class SelectionManager {
  private selection: Selection;
  private options: SelectionManagerOptions;
  private isSelecting = false;
  private selectionStartCell: CellAddress | null = null;

  constructor(options: SelectionManagerOptions = {}) {
    this.options = {
      multiSelect: true,
      ...options
    };

    this.selection = {
      ranges: [],
      activeCell: { row: 0, col: 0 }
    };
  }

  /**
   * 获取当前选区
   */
  getSelection(): Selection {
    return { ...this.selection };
  }

  /**
   * 获取活动单元格
   */
  getActiveCell(): CellAddress {
    return { ...this.selection.activeCell };
  }

  /**
   * 设置选区
   */
  setSelection(selection: Selection): void {
    this.selection = { ...selection };
    this.notifyChange();
  }

  /**
   * 选择单个单元格
   */
  selectCell(row: number, col: number, addToSelection = false): void {
    const cell: CellAddress = { row, col };

    if (addToSelection && this.options.multiSelect) {
      // 添加到现有选区
      this.selection.ranges.push({
        start: cell,
        end: cell
      });
    } else {
      // 替换选区
      this.selection.ranges = [{
        start: cell,
        end: cell
      }];
    }

    this.selection.activeCell = cell;
    this.selection.anchorCell = cell;
    this.notifyChange();
  }

  /**
   * 选择范围
   */
  selectRange(range: CellRange, addToSelection = false): void {
    // 规范化范围（确保 start <= end）
    const normalizedRange = this.normalizeRange(range);

    if (addToSelection && this.options.multiSelect) {
      this.selection.ranges.push(normalizedRange);
    } else {
      this.selection.ranges = [normalizedRange];
    }

    this.selection.activeCell = normalizedRange.start;
    this.notifyChange();
  }

  /**
   * 扩展选区到指定单元格（Shift + Click）
   */
  extendSelection(row: number, col: number): void {
    const anchor = this.selection.anchorCell ?? this.selection.activeCell;

    const range: CellRange = {
      start: anchor,
      end: { row, col }
    };

    // 替换最后一个选区
    if (this.selection.ranges.length > 0) {
      this.selection.ranges[this.selection.ranges.length - 1] = this.normalizeRange(range);
    } else {
      this.selection.ranges = [this.normalizeRange(range)];
    }

    this.selection.activeCell = { row, col };
    this.notifyChange();
  }

  /**
   * 开始拖拽选择
   */
  startDragSelection(row: number, col: number, addToSelection = false): void {
    this.isSelecting = true;
    this.selectionStartCell = { row, col };
    this.selectCell(row, col, addToSelection);
  }

  /**
   * 更新拖拽选择
   */
  updateDragSelection(row: number, col: number): void {
    if (!this.isSelecting || !this.selectionStartCell) return;

    const range: CellRange = {
      start: this.selectionStartCell,
      end: { row, col }
    };

    // 更新最后一个选区
    if (this.selection.ranges.length > 0) {
      this.selection.ranges[this.selection.ranges.length - 1] = this.normalizeRange(range);
    } else {
      this.selection.ranges = [this.normalizeRange(range)];
    }

    this.selection.activeCell = { row, col };
    this.notifyChange();
  }

  /**
   * 结束拖拽选择
   */
  endDragSelection(): void {
    this.isSelecting = false;
    this.selectionStartCell = null;
  }

  /**
   * 选择整行
   */
  selectRow(row: number, addToSelection = false): void {
    const range: CellRange = {
      start: { row, col: 0 },
      end: { row, col: Number.MAX_SAFE_INTEGER }
    };
    this.selectRange(range, addToSelection);
  }

  /**
   * 选择多行
   */
  selectRows(startRow: number, endRow: number, addToSelection = false): void {
    const range: CellRange = {
      start: { row: Math.min(startRow, endRow), col: 0 },
      end: { row: Math.max(startRow, endRow), col: Number.MAX_SAFE_INTEGER }
    };
    this.selectRange(range, addToSelection);
  }

  /**
   * 选择整列
   */
  selectCol(col: number, addToSelection = false): void {
    const range: CellRange = {
      start: { row: 0, col },
      end: { row: Number.MAX_SAFE_INTEGER, col }
    };
    this.selectRange(range, addToSelection);
  }

  /**
   * 选择多列
   */
  selectCols(startCol: number, endCol: number, addToSelection = false): void {
    const range: CellRange = {
      start: { row: 0, col: Math.min(startCol, endCol) },
      end: { row: Number.MAX_SAFE_INTEGER, col: Math.max(startCol, endCol) }
    };
    this.selectRange(range, addToSelection);
  }

  /**
   * 全选
   */
  selectAll(): void {
    this.selection.ranges = [{
      start: { row: 0, col: 0 },
      end: { row: Number.MAX_SAFE_INTEGER, col: Number.MAX_SAFE_INTEGER }
    }];
    this.notifyChange();
  }

  /**
   * 清除选区
   */
  clearSelection(): void {
    this.selection.ranges = [];
    this.notifyChange();
  }

  /**
   * 移动活动单元格
   */
  moveActiveCell(direction: 'up' | 'down' | 'left' | 'right', extend = false): void {
    const { row, col } = this.selection.activeCell;
    let newRow = row;
    let newCol = col;

    switch (direction) {
      case 'up':
        newRow = Math.max(0, row - 1);
        break;
      case 'down':
        newRow = row + 1;
        break;
      case 'left':
        newCol = Math.max(0, col - 1);
        break;
      case 'right':
        newCol = col + 1;
        break;
    }

    if (extend) {
      this.extendSelection(newRow, newCol);
    } else {
      this.selectCell(newRow, newCol);
    }
  }

  /**
   * 检查单元格是否在选区内
   */
  isCellSelected(row: number, col: number): boolean {
    return this.selection.ranges.some(range =>
      row >= range.start.row && row <= range.end.row &&
      col >= range.start.col && col <= range.end.col
    );
  }

  /**
   * 检查单元格是否是活动单元格
   */
  isActiveCell(row: number, col: number): boolean {
    return this.selection.activeCell.row === row &&
      this.selection.activeCell.col === col;
  }

  /**
   * 获取选区的边界
   */
  getSelectionBounds(): CellRange | null {
    if (this.selection.ranges.length === 0) return null;

    let minRow = Number.MAX_SAFE_INTEGER;
    let minCol = Number.MAX_SAFE_INTEGER;
    let maxRow = 0;
    let maxCol = 0;

    for (const range of this.selection.ranges) {
      minRow = Math.min(minRow, range.start.row);
      minCol = Math.min(minCol, range.start.col);
      maxRow = Math.max(maxRow, range.end.row);
      maxCol = Math.max(maxCol, range.end.col);
    }

    return {
      start: { row: minRow, col: minCol },
      end: { row: maxRow, col: maxCol }
    };
  }

  /**
   * 规范化范围
   */
  private normalizeRange(range: CellRange): CellRange {
    return {
      start: {
        row: Math.min(range.start.row, range.end.row),
        col: Math.min(range.start.col, range.end.col)
      },
      end: {
        row: Math.max(range.start.row, range.end.row),
        col: Math.max(range.start.col, range.end.col)
      }
    };
  }

  /**
   * 通知选区变化
   */
  private notifyChange(): void {
    this.options.onSelectionChange?.(this.getSelection());
  }
}
