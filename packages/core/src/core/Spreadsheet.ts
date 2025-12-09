/**
 * 电子表格主类
 * 整合所有功能模块，提供统一的 API
 */

import type {
  SpreadsheetConfig,
  WorkbookData,
  SheetData,
  CellData,
  CellRange,
  Selection,
  SpreadsheetEvent
} from './types';
import { CommandManager, CommandContext } from './commands/CommandManager';
import {
  SetCellValueCommand,
  SetCellsValueCommand,
  ClearCellsCommand
} from './commands/CellCommands';
import {
  InsertRowCommand,
  DeleteRowCommand,
  InsertColCommand,
  DeleteColCommand,
  SetRowHeightCommand,
  SetColWidthCommand
} from './commands/RowColCommands';
import { SelectionManager } from './selection/SelectionManager';
import { ContextMenu, createDefaultContextMenuItems, MenuItem } from './ui/ContextMenu';
import { ClipboardManager } from './clipboard/ClipboardManager';

type EventCallback = (event: SpreadsheetEvent) => void;

export class Spreadsheet implements CommandContext {
  private container: HTMLElement;
  private config: Required<SpreadsheetConfig>;
  private workbook: WorkbookData;

  // 核心模块
  private commandManager: CommandManager;
  private selectionManager: SelectionManager;
  private clipboardManager: ClipboardManager;
  private contextMenu: ContextMenu | null = null;

  // 事件监听
  private eventListeners: Map<string, Set<EventCallback>> = new Map();

  // 状态
  private isDestroyed = false;

  constructor(config: SpreadsheetConfig) {
    // 获取容器
    const container = typeof config.container === 'string'
      ? document.querySelector(config.container)
      : config.container;

    if (!container) {
      throw new Error('Spreadsheet: 容器元素不存在');
    }
    this.container = container as HTMLElement;

    // 合并配置
    this.config = {
      container: this.container,
      data: config.data ?? this.createEmptyWorkbook(),
      readonly: config.readonly ?? false,
      showGridLines: config.showGridLines ?? true,
      showRowHeader: config.showRowHeader ?? true,
      showColHeader: config.showColHeader ?? true,
      zoom: config.zoom ?? 1.5,
      toolbar: config.toolbar ?? { show: true },
      contextMenu: config.contextMenu ?? { show: true },
      enableFormula: config.enableFormula ?? true,
      enableCollaboration: config.enableCollaboration ?? false,
      locale: config.locale ?? 'zh-CN'
    };

    // 初始化工作簿数据
    this.workbook = this.config.data;

    // 初始化命令管理器
    this.commandManager = new CommandManager(this);

    // 初始化选区管理器
    this.selectionManager = new SelectionManager({
      onSelectionChange: (selection) => {
        this.emit('selectionChange', { selection });
      }
    });

    // 初始化剪贴板管理器
    this.clipboardManager = new ClipboardManager({
      getSheetData: () => {
        const sheet = this.getActiveSheet();
        return {
          cells: sheet.cells,
          styles: this.workbook.styles,
          sheetId: sheet.id
        };
      },
      setCellData: (row, col, data) => {
        const address = this.formatAddress(row, col);
        const sheet = this.getActiveSheet();
        if (data) {
          sheet.cells.set(address, data);
        } else {
          sheet.cells.delete(address);
        }
      },
      clearCell: (row, col) => {
        const address = this.formatAddress(row, col);
        this.getActiveSheet().cells.delete(address);
      },
      formatAddress: this.formatAddress.bind(this)
    });

    // 初始化右键菜单
    if (this.config.contextMenu) {
      this.initContextMenu();
    }

    // 初始化 UI
    this.initUI();

    // 绑定快捷键
    this.bindKeyboardShortcuts();
  }

  // ========== CommandContext 实现 ==========

  getWorkbook(): WorkbookData {
    return this.workbook;
  }

  getActiveSheet(): SheetData {
    return this.workbook.sheets[this.workbook.activeSheetIndex];
  }

  render(): void {
    // TODO: 调用渲染器重新渲染
    this.emit('render', {});
  }

  emit(type: string, data: any): void {
    const event: SpreadsheetEvent = {
      type: type as any,
      timestamp: Date.now(),
      ...data
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  // ========== 公共 API ==========

  /**
   * 订阅事件
   */
  on(type: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(callback);

    return () => this.off(type, callback);
  }

  /**
   * 取消订阅
   */
  off(type: string, callback: EventCallback): void {
    this.eventListeners.get(type)?.delete(callback);
  }

  /**
   * 设置单元格值
   */
  setCellValue(row: number, col: number, value: string): void {
    if (this.config.readonly) return;
    const command = new SetCellValueCommand(row, col, value);
    this.commandManager.execute(command);
  }

  /**
   * 批量设置单元格值
   */
  setCellsValue(changes: Array<{ row: number; col: number; value: string }>): void {
    if (this.config.readonly) return;
    const command = new SetCellsValueCommand(changes);
    this.commandManager.execute(command);
  }

  /**
   * 获取单元格值
   */
  getCellValue(row: number, col: number): string {
    const address = this.formatAddress(row, col);
    const cell = this.getActiveSheet().cells.get(address);
    return cell?.text ?? '';
  }

  /**
   * 获取单元格数据
   */
  getCellData(row: number, col: number): CellData | undefined {
    const address = this.formatAddress(row, col);
    return this.getActiveSheet().cells.get(address);
  }

  /**
   * 清除选中区域
   */
  clearSelection(): void {
    if (this.config.readonly) return;
    const bounds = this.selectionManager.getSelectionBounds();
    if (!bounds) return;

    const command = new ClearCellsCommand(bounds);
    this.commandManager.execute(command);
  }

  /**
   * 插入行
   */
  insertRow(index?: number, count = 1): void {
    if (this.config.readonly) return;
    const rowIndex = index ?? this.selectionManager.getActiveCell().row;
    const command = new InsertRowCommand(rowIndex, count);
    this.commandManager.execute(command);
  }

  /**
   * 删除行
   */
  deleteRow(index?: number, count = 1): void {
    if (this.config.readonly) return;
    const rowIndex = index ?? this.selectionManager.getActiveCell().row;
    const command = new DeleteRowCommand(rowIndex, count);
    this.commandManager.execute(command);
  }

  /**
   * 插入列
   */
  insertCol(index?: number, count = 1): void {
    if (this.config.readonly) return;
    const colIndex = index ?? this.selectionManager.getActiveCell().col;
    const command = new InsertColCommand(colIndex, count);
    this.commandManager.execute(command);
  }

  /**
   * 删除列
   */
  deleteCol(index?: number, count = 1): void {
    if (this.config.readonly) return;
    const colIndex = index ?? this.selectionManager.getActiveCell().col;
    const command = new DeleteColCommand(colIndex, count);
    this.commandManager.execute(command);
  }

  /**
   * 设置行高
   */
  setRowHeight(index: number, height: number): void {
    if (this.config.readonly) return;
    const command = new SetRowHeightCommand(index, height);
    this.commandManager.execute(command);
  }

  /**
   * 设置列宽
   */
  setColWidth(index: number, width: number): void {
    if (this.config.readonly) return;
    const command = new SetColWidthCommand(index, width);
    this.commandManager.execute(command);
  }

  /**
   * 复制
   */
  copy(): void {
    const bounds = this.selectionManager.getSelectionBounds();
    if (!bounds) return;
    this.clipboardManager.copy(bounds);
    this.emit('copy', { range: bounds });
  }

  /**
   * 剪切
   */
  cut(): void {
    if (this.config.readonly) return;
    const bounds = this.selectionManager.getSelectionBounds();
    if (!bounds) return;
    this.clipboardManager.cut(bounds);
    this.emit('cut', { range: bounds });
  }

  /**
   * 粘贴
   */
  paste(): void {
    if (this.config.readonly) return;
    const activeCell = this.selectionManager.getActiveCell();
    this.clipboardManager.paste(activeCell.row, activeCell.col);
    this.emit('paste', { target: activeCell });
    this.render();
  }

  /**
   * 撤销
   */
  undo(): boolean {
    if (this.config.readonly) return false;
    return this.commandManager.undo();
  }

  /**
   * 重做
   */
  redo(): boolean {
    if (this.config.readonly) return false;
    return this.commandManager.redo();
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.commandManager.canUndo();
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.commandManager.canRedo();
  }

  /**
   * 获取选区
   */
  getSelection(): Selection {
    return this.selectionManager.getSelection();
  }

  /**
   * 设置选区
   */
  setSelection(selection: Selection): void {
    this.selectionManager.setSelection(selection);
  }

  /**
   * 选择单元格
   */
  selectCell(row: number, col: number): void {
    this.selectionManager.selectCell(row, col);
  }

  /**
   * 选择范围
   */
  selectRange(range: CellRange): void {
    this.selectionManager.selectRange(range);
  }

  /**
   * 全选
   */
  selectAll(): void {
    this.selectionManager.selectAll();
  }

  /**
   * 切换工作表
   */
  switchSheet(index: number): void {
    if (index >= 0 && index < this.workbook.sheets.length) {
      this.workbook.activeSheetIndex = index;
      this.emit('sheetChange', { index, sheet: this.getActiveSheet() });
      this.render();
    }
  }

  /**
   * 添加工作表
   */
  addSheet(name?: string): SheetData {
    const newSheet = this.createEmptySheet(name ?? `Sheet${this.workbook.sheets.length + 1}`);
    this.workbook.sheets.push(newSheet);
    this.emit('sheetAdd', { sheet: newSheet });
    return newSheet;
  }

  /**
   * 删除工作表
   */
  deleteSheet(index: number): boolean {
    if (this.workbook.sheets.length <= 1) return false;
    if (index < 0 || index >= this.workbook.sheets.length) return false;

    const deleted = this.workbook.sheets.splice(index, 1)[0];
    if (this.workbook.activeSheetIndex >= this.workbook.sheets.length) {
      this.workbook.activeSheetIndex = this.workbook.sheets.length - 1;
    }
    this.emit('sheetDelete', { sheet: deleted, index });
    this.render();
    return true;
  }

  /**
   * 加载数据
   */
  loadData(data: WorkbookData): void {
    this.workbook = data;
    this.commandManager.clear();
    this.render();
    this.emit('load', { workbook: data });
  }

  /**
   * 获取数据
   */
  getData(): WorkbookData {
    return this.workbook;
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.contextMenu?.destroy();
    this.eventListeners.clear();
    this.container.innerHTML = '';
    this.isDestroyed = true;
  }

  // ========== 私有方法 ==========

  private initUI(): void {
    this.container.style.cssText = `
      position: relative;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    // TODO: 创建实际的 UI 元素
  }

  private initContextMenu(): void {
    const items = createDefaultContextMenuItems();
    this.contextMenu = new ContextMenu(this.container, { items });

    // 绑定右键菜单事件
    this.container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e.clientX, e.clientY);
    });
  }

  private showContextMenu(x: number, y: number): void {
    if (!this.contextMenu) return;

    this.contextMenu.show(x, y, (item: MenuItem) => {
      this.handleContextMenuAction(item.id);
    });
  }

  private handleContextMenuAction(actionId: string): void {
    switch (actionId) {
      case 'cut':
        this.cut();
        break;
      case 'copy':
        this.copy();
        break;
      case 'paste':
        this.paste();
        break;
      case 'insertRowAbove':
        this.insertRow(this.selectionManager.getActiveCell().row);
        break;
      case 'insertRowBelow':
        this.insertRow(this.selectionManager.getActiveCell().row + 1);
        break;
      case 'insertColLeft':
        this.insertCol(this.selectionManager.getActiveCell().col);
        break;
      case 'insertColRight':
        this.insertCol(this.selectionManager.getActiveCell().col + 1);
        break;
      case 'deleteRow':
        this.deleteRow();
        break;
      case 'deleteCol':
        this.deleteCol();
        break;
      case 'clearContents':
        this.clearSelection();
        break;
      default:
        console.log('未处理的菜单项:', actionId);
    }
  }

  private bindKeyboardShortcuts(): void {
    this.container.addEventListener('keydown', (e) => {
      if (this.isDestroyed) return;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Ctrl+Z: 撤销
      if (ctrl && !shift && e.key === 'z') {
        e.preventDefault();
        this.undo();
      }
      // Ctrl+Shift+Z 或 Ctrl+Y: 重做
      else if ((ctrl && shift && e.key === 'z') || (ctrl && e.key === 'y')) {
        e.preventDefault();
        this.redo();
      }
      // Ctrl+C: 复制
      else if (ctrl && e.key === 'c') {
        e.preventDefault();
        this.copy();
      }
      // Ctrl+X: 剪切
      else if (ctrl && e.key === 'x') {
        e.preventDefault();
        this.cut();
      }
      // Ctrl+V: 粘贴
      else if (ctrl && e.key === 'v') {
        e.preventDefault();
        this.paste();
      }
      // Ctrl+A: 全选
      else if (ctrl && e.key === 'a') {
        e.preventDefault();
        this.selectAll();
      }
      // Delete: 清除内容
      else if (e.key === 'Delete') {
        e.preventDefault();
        this.clearSelection();
      }
      // 方向键: 移动选区
      else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
        this.selectionManager.moveActiveCell(direction, shift);
        this.render();
      }
    });
  }

  private formatAddress(row: number, col: number): string {
    let colStr = '';
    let c = col + 1;
    while (c > 0) {
      const remainder = (c - 1) % 26;
      colStr = String.fromCharCode(65 + remainder) + colStr;
      c = Math.floor((c - 1) / 26);
    }
    return `${colStr}${row + 1}`;
  }

  private createEmptyWorkbook(): WorkbookData {
    return {
      sheets: [this.createEmptySheet('Sheet1')],
      activeSheetIndex: 0,
      styles: []
    };
  }

  private createEmptySheet(name: string): SheetData {
    return {
      id: `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      cells: new Map(),
      rows: new Map(),
      cols: new Map(),
      merges: [],
      defaultRowHeight: 24,
      defaultColWidth: 100,
      selection: {
        ranges: [{ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } }],
        activeCell: { row: 0, col: 0 }
      }
    };
  }
}
