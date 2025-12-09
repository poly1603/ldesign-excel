/**
 * 单元格相关命令
 */

import { BaseCommand, CommandContext } from './Command';
import type { CellData, CellRange } from '../types';

/**
 * 设置单元格值命令
 */
export class SetCellValueCommand extends BaseCommand {
  readonly name = 'setCellValue';

  private row: number;
  private col: number;
  private newValue: string;
  private oldValue: string = '';
  private oldCellData: CellData | null = null;

  constructor(row: number, col: number, value: string) {
    super();
    this.row = row;
    this.col = col;
    this.newValue = value;
    this.description = `设置单元格 ${this.getAddress()} 的值`;
  }

  private getAddress(): string {
    let colStr = '';
    let c = this.col + 1;
    while (c > 0) {
      const remainder = (c - 1) % 26;
      colStr = String.fromCharCode(65 + remainder) + colStr;
      c = Math.floor((c - 1) / 26);
    }
    return `${colStr}${this.row + 1}`;
  }

  execute(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    const address = this.getAddress();
    const existingCell = sheet.cells.get(address);

    // 保存旧值用于撤销
    if (existingCell) {
      this.oldCellData = { ...existingCell };
      this.oldValue = existingCell.text ?? '';
    }

    // 设置新值
    const newCell: CellData = existingCell ? { ...existingCell } : {
      value: this.newValue,
      text: this.newValue,
      type: 'string'
    };

    // 检测值类型
    if (this.newValue.startsWith('=')) {
      newCell.type = 'formula';
      newCell.formula = this.newValue;
      // TODO: 计算公式结果
      newCell.text = this.newValue;
    } else if (!isNaN(Number(this.newValue)) && this.newValue !== '') {
      newCell.type = 'number';
      newCell.value = Number(this.newValue);
      newCell.text = this.newValue;
    } else if (this.newValue.toLowerCase() === 'true' || this.newValue.toLowerCase() === 'false') {
      newCell.type = 'boolean';
      newCell.value = this.newValue.toLowerCase() === 'true';
      newCell.text = this.newValue.toUpperCase();
    } else {
      newCell.type = 'string';
      newCell.value = this.newValue;
      newCell.text = this.newValue;
    }

    sheet.cells.set(address, newCell);
    context.emit('cellChange', { row: this.row, col: this.col, value: this.newValue, oldValue: this.oldValue });
    context.render();
  }

  undo(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    const address = this.getAddress();

    if (this.oldCellData) {
      sheet.cells.set(address, this.oldCellData);
    } else {
      sheet.cells.delete(address);
    }

    context.emit('cellChange', { row: this.row, col: this.col, value: this.oldValue, oldValue: this.newValue });
    context.render();
  }

  canMerge(other: SetCellValueCommand): boolean {
    // 同一单元格的连续输入可以合并
    return other instanceof SetCellValueCommand &&
      other.row === this.row &&
      other.col === this.col;
  }
}

/**
 * 批量设置单元格值命令
 */
export class SetCellsValueCommand extends BaseCommand {
  readonly name = 'setCellsValue';

  private changes: Array<{ row: number; col: number; value: string; oldValue?: string; oldCellData?: CellData }>;

  constructor(changes: Array<{ row: number; col: number; value: string }>) {
    super();
    this.changes = changes.map(c => ({ ...c }));
    this.description = `设置 ${changes.length} 个单元格的值`;
  }

  private getAddress(row: number, col: number): string {
    let colStr = '';
    let c = col + 1;
    while (c > 0) {
      const remainder = (c - 1) % 26;
      colStr = String.fromCharCode(65 + remainder) + colStr;
      c = Math.floor((c - 1) / 26);
    }
    return `${colStr}${row + 1}`;
  }

  execute(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    for (const change of this.changes) {
      const address = this.getAddress(change.row, change.col);
      const existingCell = sheet.cells.get(address);

      // 保存旧值
      if (existingCell) {
        change.oldCellData = { ...existingCell };
        change.oldValue = existingCell.text ?? '';
      }

      // 设置新值
      const newCell: CellData = {
        value: change.value,
        text: change.value,
        type: 'string'
      };
      sheet.cells.set(address, newCell);
    }

    context.render();
  }

  undo(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    for (const change of this.changes) {
      const address = this.getAddress(change.row, change.col);

      if (change.oldCellData) {
        sheet.cells.set(address, change.oldCellData);
      } else {
        sheet.cells.delete(address);
      }
    }

    context.render();
  }
}

/**
 * 清除单元格命令
 */
export class ClearCellsCommand extends BaseCommand {
  readonly name = 'clearCells';

  private range: CellRange;
  private clearedCells: Map<string, CellData> = new Map();

  constructor(range: CellRange) {
    super();
    this.range = range;
    this.description = '清除单元格';
  }

  private getAddress(row: number, col: number): string {
    let colStr = '';
    let c = col + 1;
    while (c > 0) {
      const remainder = (c - 1) % 26;
      colStr = String.fromCharCode(65 + remainder) + colStr;
      c = Math.floor((c - 1) / 26);
    }
    return `${colStr}${row + 1}`;
  }

  execute(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    this.clearedCells.clear();

    for (let row = this.range.start.row; row <= this.range.end.row; row++) {
      for (let col = this.range.start.col; col <= this.range.end.col; col++) {
        const address = this.getAddress(row, col);
        const cell = sheet.cells.get(address);
        if (cell) {
          this.clearedCells.set(address, { ...cell });
          sheet.cells.delete(address);
        }
      }
    }

    context.render();
  }

  undo(context: CommandContext): void {
    const sheet = context.getActiveSheet();
    if (!sheet) return;

    for (const [address, cellData] of this.clearedCells) {
      sheet.cells.set(address, cellData);
    }

    context.render();
  }
}
