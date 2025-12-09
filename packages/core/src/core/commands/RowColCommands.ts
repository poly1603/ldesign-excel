/**
 * 行列操作命令
 */

import { BaseCommand, CommandContext } from './Command';
import type { CellData, RowData, ColData } from '../types';

/**
 * 插入行命令
 */
export class InsertRowCommand extends BaseCommand {
  readonly name = 'insertRow';

  private rowIndex: number;
  private count: number;

  constructor(rowIndex: number, count: number = 1) {
    super();
    this.rowIndex = rowIndex;
    this.count = count;
    this.description = `在第 ${rowIndex + 1} 行插入 ${count} 行`;
  }

  execute(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    // 移动所有受影响的单元格
    const newCells = new Map<string, CellData>();
    const newRows = new Map<number, RowData>();

    sheet.cells.forEach((cell, address) => {
      const match = address.match(/([A-Z]+)(\d+)/);
      if (match) {
        const col = match[1];
        const row = parseInt(match[2], 10);

        if (row > this.rowIndex) {
          // 向下移动
          const newAddress = `${col}${row + this.count}`;
          newCells.set(newAddress, { ...cell });
        } else {
          newCells.set(address, cell);
        }
      }
    });

    sheet.rows.forEach((rowData, row) => {
      if (row >= this.rowIndex) {
        newRows.set(row + this.count, rowData);
      } else {
        newRows.set(row, rowData);
      }
    });

    sheet.cells = newCells;
    sheet.rows = newRows;

    // 更新合并单元格
    sheet.merges = sheet.merges.map(merge => {
      if (merge.start.row >= this.rowIndex) {
        return {
          start: { row: merge.start.row + this.count, col: merge.start.col },
          end: { row: merge.end.row + this.count, col: merge.end.col }
        };
      } else if (merge.end.row >= this.rowIndex) {
        return {
          start: merge.start,
          end: { row: merge.end.row + this.count, col: merge.end.col }
        };
      }
      return merge;
    });

    context.emit('rowInsert', { index: this.rowIndex, count: this.count });
    context.render();
  }

  undo(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    // 反向操作：移动单元格回去
    const newCells = new Map<string, CellData>();
    const newRows = new Map<number, RowData>();

    sheet.cells.forEach((cell, address) => {
      const match = address.match(/([A-Z]+)(\d+)/);
      if (match) {
        const col = match[1];
        const row = parseInt(match[2], 10);

        if (row > this.rowIndex + this.count) {
          const newAddress = `${col}${row - this.count}`;
          newCells.set(newAddress, { ...cell });
        } else if (row <= this.rowIndex) {
          newCells.set(address, cell);
        }
        // 跳过插入的行
      }
    });

    sheet.rows.forEach((rowData, row) => {
      if (row >= this.rowIndex + this.count) {
        newRows.set(row - this.count, rowData);
      } else if (row < this.rowIndex) {
        newRows.set(row, rowData);
      }
    });

    sheet.cells = newCells;
    sheet.rows = newRows;

    context.render();
  }
}

/**
 * 删除行命令
 */
export class DeleteRowCommand extends BaseCommand {
  readonly name = 'deleteRow';

  private rowIndex: number;
  private count: number;
  private deletedCells: Map<string, CellData> = new Map();
  private deletedRows: Map<number, RowData> = new Map();

  constructor(rowIndex: number, count: number = 1) {
    super();
    this.rowIndex = rowIndex;
    this.count = count;
    this.description = `删除第 ${rowIndex + 1} 行起的 ${count} 行`;
  }

  execute(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    this.deletedCells.clear();
    this.deletedRows.clear();

    const newCells = new Map<string, CellData>();
    const newRows = new Map<number, RowData>();

    sheet.cells.forEach((cell, address) => {
      const match = address.match(/([A-Z]+)(\d+)/);
      if (match) {
        const col = match[1];
        const row = parseInt(match[2], 10);

        if (row > this.rowIndex && row <= this.rowIndex + this.count) {
          // 保存被删除的单元格
          this.deletedCells.set(address, { ...cell });
        } else if (row > this.rowIndex + this.count) {
          // 向上移动
          const newAddress = `${col}${row - this.count}`;
          newCells.set(newAddress, { ...cell });
        } else {
          newCells.set(address, cell);
        }
      }
    });

    sheet.rows.forEach((rowData, row) => {
      if (row >= this.rowIndex && row < this.rowIndex + this.count) {
        this.deletedRows.set(row, rowData);
      } else if (row >= this.rowIndex + this.count) {
        newRows.set(row - this.count, rowData);
      } else {
        newRows.set(row, rowData);
      }
    });

    sheet.cells = newCells;
    sheet.rows = newRows;

    context.emit('rowDelete', { index: this.rowIndex, count: this.count });
    context.render();
  }

  undo(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    // 先移动现有单元格
    const newCells = new Map<string, CellData>();
    const newRows = new Map<number, RowData>();

    sheet.cells.forEach((cell, address) => {
      const match = address.match(/([A-Z]+)(\d+)/);
      if (match) {
        const col = match[1];
        const row = parseInt(match[2], 10);

        if (row > this.rowIndex) {
          const newAddress = `${col}${row + this.count}`;
          newCells.set(newAddress, { ...cell });
        } else {
          newCells.set(address, cell);
        }
      }
    });

    // 恢复被删除的单元格
    this.deletedCells.forEach((cell, address) => {
      newCells.set(address, cell);
    });

    sheet.rows.forEach((rowData, row) => {
      if (row >= this.rowIndex) {
        newRows.set(row + this.count, rowData);
      } else {
        newRows.set(row, rowData);
      }
    });

    this.deletedRows.forEach((rowData, row) => {
      newRows.set(row, rowData);
    });

    sheet.cells = newCells;
    sheet.rows = newRows;

    context.render();
  }
}

/**
 * 插入列命令
 */
export class InsertColCommand extends BaseCommand {
  readonly name = 'insertCol';

  private colIndex: number;
  private count: number;

  constructor(colIndex: number, count: number = 1) {
    super();
    this.colIndex = colIndex;
    this.count = count;
    this.description = `在第 ${this.getColLabel(colIndex)} 列插入 ${count} 列`;
  }

  private getColLabel(col: number): string {
    let label = '';
    let c = col + 1;
    while (c > 0) {
      const remainder = (c - 1) % 26;
      label = String.fromCharCode(65 + remainder) + label;
      c = Math.floor((c - 1) / 26);
    }
    return label;
  }

  private parseColIndex(colStr: string): number {
    let index = 0;
    for (let i = 0; i < colStr.length; i++) {
      index = index * 26 + (colStr.charCodeAt(i) - 64);
    }
    return index - 1;
  }

  execute(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    const newCells = new Map<string, CellData>();
    const newCols = new Map<number, ColData>();

    sheet.cells.forEach((cell, address) => {
      const match = address.match(/([A-Z]+)(\d+)/);
      if (match) {
        const colStr = match[1];
        const row = match[2];
        const col = this.parseColIndex(colStr);

        if (col >= this.colIndex) {
          const newColStr = this.getColLabel(col + this.count);
          const newAddress = `${newColStr}${row}`;
          newCells.set(newAddress, { ...cell });
        } else {
          newCells.set(address, cell);
        }
      }
    });

    sheet.cols.forEach((colData, col) => {
      if (col >= this.colIndex) {
        newCols.set(col + this.count, colData);
      } else {
        newCols.set(col, colData);
      }
    });

    sheet.cells = newCells;
    sheet.cols = newCols;

    context.emit('colInsert', { index: this.colIndex, count: this.count });
    context.render();
  }

  undo(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    const newCells = new Map<string, CellData>();
    const newCols = new Map<number, ColData>();

    sheet.cells.forEach((cell, address) => {
      const match = address.match(/([A-Z]+)(\d+)/);
      if (match) {
        const colStr = match[1];
        const row = match[2];
        const col = this.parseColIndex(colStr);

        if (col >= this.colIndex + this.count) {
          const newColStr = this.getColLabel(col - this.count);
          const newAddress = `${newColStr}${row}`;
          newCells.set(newAddress, { ...cell });
        } else if (col < this.colIndex) {
          newCells.set(address, cell);
        }
      }
    });

    sheet.cols.forEach((colData, col) => {
      if (col >= this.colIndex + this.count) {
        newCols.set(col - this.count, colData);
      } else if (col < this.colIndex) {
        newCols.set(col, colData);
      }
    });

    sheet.cells = newCells;
    sheet.cols = newCols;

    context.render();
  }
}

/**
 * 删除列命令
 */
export class DeleteColCommand extends BaseCommand {
  readonly name = 'deleteCol';

  private colIndex: number;
  private count: number;
  private deletedCells: Map<string, CellData> = new Map();
  private deletedCols: Map<number, ColData> = new Map();

  constructor(colIndex: number, count: number = 1) {
    super();
    this.colIndex = colIndex;
    this.count = count;
  }

  private getColLabel(col: number): string {
    let label = '';
    let c = col + 1;
    while (c > 0) {
      const remainder = (c - 1) % 26;
      label = String.fromCharCode(65 + remainder) + label;
      c = Math.floor((c - 1) / 26);
    }
    return label;
  }

  private parseColIndex(colStr: string): number {
    let index = 0;
    for (let i = 0; i < colStr.length; i++) {
      index = index * 26 + (colStr.charCodeAt(i) - 64);
    }
    return index - 1;
  }

  execute(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    this.deletedCells.clear();
    this.deletedCols.clear();

    const newCells = new Map<string, CellData>();
    const newCols = new Map<number, ColData>();

    sheet.cells.forEach((cell, address) => {
      const match = address.match(/([A-Z]+)(\d+)/);
      if (match) {
        const colStr = match[1];
        const row = match[2];
        const col = this.parseColIndex(colStr);

        if (col >= this.colIndex && col < this.colIndex + this.count) {
          this.deletedCells.set(address, { ...cell });
        } else if (col >= this.colIndex + this.count) {
          const newColStr = this.getColLabel(col - this.count);
          const newAddress = `${newColStr}${row}`;
          newCells.set(newAddress, { ...cell });
        } else {
          newCells.set(address, cell);
        }
      }
    });

    sheet.cols.forEach((colData, col) => {
      if (col >= this.colIndex && col < this.colIndex + this.count) {
        this.deletedCols.set(col, colData);
      } else if (col >= this.colIndex + this.count) {
        newCols.set(col - this.count, colData);
      } else {
        newCols.set(col, colData);
      }
    });

    sheet.cells = newCells;
    sheet.cols = newCols;

    context.emit('colDelete', { index: this.colIndex, count: this.count });
    context.render();
  }

  undo(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    const newCells = new Map<string, CellData>();
    const newCols = new Map<number, ColData>();

    sheet.cells.forEach((cell, address) => {
      const match = address.match(/([A-Z]+)(\d+)/);
      if (match) {
        const colStr = match[1];
        const row = match[2];
        const col = this.parseColIndex(colStr);

        if (col >= this.colIndex) {
          const newColStr = this.getColLabel(col + this.count);
          const newAddress = `${newColStr}${row}`;
          newCells.set(newAddress, { ...cell });
        } else {
          newCells.set(address, cell);
        }
      }
    });

    this.deletedCells.forEach((cell, address) => {
      newCells.set(address, cell);
    });

    sheet.cols.forEach((colData, col) => {
      if (col >= this.colIndex) {
        newCols.set(col + this.count, colData);
      } else {
        newCols.set(col, colData);
      }
    });

    this.deletedCols.forEach((colData, col) => {
      newCols.set(col, colData);
    });

    sheet.cells = newCells;
    sheet.cols = newCols;

    context.render();
  }
}

/**
 * 设置行高命令
 */
export class SetRowHeightCommand extends BaseCommand {
  readonly name = 'setRowHeight';

  private rowIndex: number;
  private newHeight: number;
  private oldHeight: number = 0;

  constructor(rowIndex: number, height: number) {
    super();
    this.rowIndex = rowIndex;
    this.newHeight = height;
  }

  execute(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    const rowData = sheet.rows.get(this.rowIndex);
    this.oldHeight = rowData?.height ?? sheet.defaultRowHeight;

    sheet.rows.set(this.rowIndex, {
      ...rowData,
      height: this.newHeight
    });

    context.emit('rowResize', { index: this.rowIndex, height: this.newHeight });
    context.render();
  }

  undo(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    const rowData = sheet.rows.get(this.rowIndex);
    sheet.rows.set(this.rowIndex, {
      ...rowData,
      height: this.oldHeight
    });

    context.render();
  }
}

/**
 * 设置列宽命令
 */
export class SetColWidthCommand extends BaseCommand {
  readonly name = 'setColWidth';

  private colIndex: number;
  private newWidth: number;
  private oldWidth: number = 0;

  constructor(colIndex: number, width: number) {
    super();
    this.colIndex = colIndex;
    this.newWidth = width;
  }

  execute(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    const colData = sheet.cols.get(this.colIndex);
    this.oldWidth = colData?.width ?? sheet.defaultColWidth;

    sheet.cols.set(this.colIndex, {
      ...colData,
      width: this.newWidth
    });

    context.emit('colResize', { index: this.colIndex, width: this.newWidth });
    context.render();
  }

  undo(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    const colData = sheet.cols.get(this.colIndex);
    sheet.cols.set(this.colIndex, {
      ...colData,
      width: this.oldWidth
    });

    context.render();
  }
}
