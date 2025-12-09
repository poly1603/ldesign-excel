/**
 * 剪贴板管理器
 * 处理复制、剪切、粘贴操作
 */

import type { CellData, CellRange, CellStyle } from '../types';

export interface ClipboardData {
  /** 复制的范围 */
  range: CellRange;
  /** 单元格数据（二维数组） */
  cells: (CellData | null)[][];
  /** 样式数据 */
  styles?: CellStyle[];
  /** 是否是剪切操作 */
  isCut: boolean;
  /** 复制时间 */
  timestamp: number;
  /** 源工作表 ID */
  sourceSheetId?: string;
}

export interface ClipboardManagerOptions {
  /** 获取工作表数据的回调 */
  getSheetData: () => {
    cells: Map<string, CellData>;
    styles?: CellStyle[];
    sheetId: string;
  };
  /** 设置单元格数据的回调 */
  setCellData: (row: number, col: number, data: CellData | null) => void;
  /** 清除单元格的回调 */
  clearCell: (row: number, col: number) => void;
  /** 获取地址的回调 */
  formatAddress: (row: number, col: number) => string;
}

export class ClipboardManager {
  private clipboardData: ClipboardData | null = null;
  private options: ClipboardManagerOptions;

  constructor(options: ClipboardManagerOptions) {
    this.options = options;
  }

  /**
   * 复制选中区域
   */
  copy(range: CellRange): ClipboardData {
    const data = this.extractRangeData(range);
    this.clipboardData = {
      ...data,
      isCut: false,
      timestamp: Date.now()
    };

    // 同时复制到系统剪贴板
    this.copyToSystemClipboard(data.cells);

    return this.clipboardData;
  }

  /**
   * 剪切选中区域
   */
  cut(range: CellRange): ClipboardData {
    const data = this.extractRangeData(range);
    this.clipboardData = {
      ...data,
      isCut: true,
      timestamp: Date.now()
    };

    // 同时复制到系统剪贴板
    this.copyToSystemClipboard(data.cells);

    return this.clipboardData;
  }

  /**
   * 粘贴到指定位置
   */
  paste(targetRow: number, targetCol: number): { affectedRange: CellRange } | null {
    if (!this.clipboardData) return null;

    const { cells, range, isCut } = this.clipboardData;
    const rowCount = cells.length;
    const colCount = cells[0]?.length ?? 0;

    // 粘贴单元格数据
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        const cellData = cells[r][c];
        if (cellData) {
          // 复制单元格数据，但更新地址
          const newCellData: CellData = {
            ...cellData,
            // 如果有公式，需要调整引用
            formula: cellData.formula ? this.adjustFormula(
              cellData.formula,
              targetRow - range.start.row,
              targetCol - range.start.col
            ) : undefined
          };
          this.options.setCellData(targetRow + r, targetCol + c, newCellData);
        }
      }
    }

    // 如果是剪切，清除原位置
    if (isCut) {
      for (let r = range.start.row; r <= range.end.row; r++) {
        for (let c = range.start.col; c <= range.end.col; c++) {
          this.options.clearCell(r, c);
        }
      }
      // 剪切后清除剪贴板
      this.clipboardData = null;
    }

    return {
      affectedRange: {
        start: { row: targetRow, col: targetCol },
        end: { row: targetRow + rowCount - 1, col: targetCol + colCount - 1 }
      }
    };
  }

  /**
   * 仅粘贴值
   */
  pasteValues(targetRow: number, targetCol: number): void {
    if (!this.clipboardData) return;

    const { cells } = this.clipboardData;

    for (let r = 0; r < cells.length; r++) {
      for (let c = 0; c < (cells[0]?.length ?? 0); c++) {
        const cellData = cells[r][c];
        if (cellData) {
          // 只粘贴值，不包含公式和样式
          this.options.setCellData(targetRow + r, targetCol + c, {
            value: cellData.value,
            text: cellData.text,
            type: cellData.type === 'formula' ? 'string' : cellData.type
          });
        }
      }
    }
  }

  /**
   * 仅粘贴格式
   */
  pasteFormats(targetRow: number, targetCol: number): void {
    if (!this.clipboardData) return;

    const { cells } = this.clipboardData;
    const sheetData = this.options.getSheetData();

    for (let r = 0; r < cells.length; r++) {
      for (let c = 0; c < (cells[0]?.length ?? 0); c++) {
        const sourceCell = cells[r][c];
        if (sourceCell?.styleIndex !== undefined) {
          const address = this.options.formatAddress(targetRow + r, targetCol + c);
          const existingCell = sheetData.cells.get(address);

          if (existingCell) {
            this.options.setCellData(targetRow + r, targetCol + c, {
              ...existingCell,
              styleIndex: sourceCell.styleIndex
            });
          }
        }
      }
    }
  }

  /**
   * 检查是否有剪贴板数据
   */
  hasData(): boolean {
    return this.clipboardData !== null;
  }

  /**
   * 获取剪贴板数据
   */
  getData(): ClipboardData | null {
    return this.clipboardData;
  }

  /**
   * 清除剪贴板
   */
  clear(): void {
    this.clipboardData = null;
  }

  /**
   * 提取范围内的数据
   */
  private extractRangeData(range: CellRange): Omit<ClipboardData, 'isCut' | 'timestamp'> {
    const sheetData = this.options.getSheetData();
    const rowCount = range.end.row - range.start.row + 1;
    const colCount = range.end.col - range.start.col + 1;

    const cells: (CellData | null)[][] = [];

    for (let r = 0; r < rowCount; r++) {
      const row: (CellData | null)[] = [];
      for (let c = 0; c < colCount; c++) {
        const address = this.options.formatAddress(range.start.row + r, range.start.col + c);
        const cell = sheetData.cells.get(address);
        row.push(cell ? { ...cell } : null);
      }
      cells.push(row);
    }

    return {
      range,
      cells,
      styles: sheetData.styles,
      sourceSheetId: sheetData.sheetId
    };
  }

  /**
   * 复制到系统剪贴板
   */
  private async copyToSystemClipboard(cells: (CellData | null)[][]): Promise<void> {
    try {
      // 转换为 TSV 格式（制表符分隔）
      const text = cells
        .map(row => row.map(cell => cell?.text ?? '').join('\t'))
        .join('\n');

      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.warn('无法访问系统剪贴板:', e);
    }
  }

  /**
   * 从系统剪贴板粘贴
   */
  async pasteFromSystemClipboard(targetRow: number, targetCol: number): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      // 解析 TSV 格式
      const rows = text.split('\n').map(row => row.split('\t'));

      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < rows[r].length; c++) {
          const value = rows[r][c];
          if (value !== undefined) {
            this.options.setCellData(targetRow + r, targetCol + c, {
              value,
              text: value,
              type: 'string'
            });
          }
        }
      }
    } catch (e) {
      console.warn('无法从系统剪贴板粘贴:', e);
    }
  }

  /**
   * 调整公式引用（相对引用）
   */
  private adjustFormula(formula: string, rowOffset: number, colOffset: number): string {
    // 简单的公式引用调整
    // 匹配单元格引用 如 A1, $A$1, A$1, $A1
    return formula.replace(/(\$?)([A-Z]+)(\$?)(\d+)/g, (match, colAbsolute, col, rowAbsolute, row) => {
      let newCol = col;
      let newRow = parseInt(row, 10);

      // 如果不是绝对引用，调整位置
      if (!colAbsolute) {
        const colIndex = this.colLabelToIndex(col);
        newCol = this.indexToColLabel(colIndex + colOffset);
      }
      if (!rowAbsolute) {
        newRow += rowOffset;
      }

      return `${colAbsolute}${newCol}${rowAbsolute}${newRow}`;
    });
  }

  private colLabelToIndex(label: string): number {
    let index = 0;
    for (let i = 0; i < label.length; i++) {
      index = index * 26 + (label.charCodeAt(i) - 64);
    }
    return index - 1;
  }

  private indexToColLabel(index: number): string {
    let label = '';
    let i = index + 1;
    while (i > 0) {
      const remainder = (i - 1) % 26;
      label = String.fromCharCode(65 + remainder) + label;
      i = Math.floor((i - 1) / 26);
    }
    return label;
  }
}
