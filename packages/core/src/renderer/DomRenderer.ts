/**
 * DOM 表格渲染器
 * 使用 HTML 表格渲染 Excel，提供更好的文字清晰度和合并单元格支持
 */
import type { Sheet, Cell, CellStyle } from '../types';
import { SelectionManager } from '../core/selection/SelectionManager';
import { ContextMenu, createDefaultContextMenuItems, MenuItem } from '../core/ui/ContextMenu';

export interface DomRendererOptions {
  /** 默认列宽 */
  defaultColWidth: number;
  /** 默认行高 */
  defaultRowHeight: number;
  /** 默认字体 */
  defaultFont: string;
  /** 默认字体大小 */
  defaultFontSize: number;
  /** 缩放比例 */
  zoom: number;
  /** 显示网格线 */
  showGridLines: boolean;
  /** 显示行号 */
  showRowHeaders: boolean;
  /** 显示列号 */
  showColHeaders: boolean;
  /** 冻结窗格背景色 */
  frozenPaneBackground: string;
}

const DEFAULT_OPTIONS: DomRendererOptions = {
  defaultColWidth: 100,
  defaultRowHeight: 28,
  defaultFont: '微软雅黑',
  defaultFontSize: 14,
  zoom: 1.5,
  showGridLines: true,
  showRowHeaders: true,
  showColHeaders: true,
  frozenPaneBackground: '#f8f9fa'
};

export class DomRenderer {
  private container: HTMLElement;
  private options: DomRendererOptions;
  private sheet: Sheet | null = null;
  private tableContainer: HTMLElement | null = null;
  private table: HTMLTableElement | null = null;
  private editingCell: { row: number; col: number; td: HTMLTableCellElement; input: HTMLInputElement } | null = null;
  private cellElements: Map<string, HTMLTableCellElement> = new Map();

  // 选区管理
  private selectionManager: SelectionManager;
  private selectionOverlay: HTMLElement | null = null;
  private isDragging = false;

  // 填充柄
  private fillHandle: HTMLElement | null = null;
  private isFillDragging = false;
  private fillStartCell: { row: number; col: number } | null = null;

  // 右键菜单
  private contextMenu: ContextMenu | null = null;

  // 记录已渲染的合并单元格
  private renderedMerges: Set<string> = new Set();

  // 回调
  public onCellChange?: (row: number, col: number, value: string, oldValue: string) => void;
  public onContextMenuAction?: (action: string, selection: any) => void;

  constructor(container: HTMLElement, options: Partial<DomRendererOptions> = {}) {
    this.container = container;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // 初始化选区管理器
    this.selectionManager = new SelectionManager({
      onSelectionChange: () => this.updateSelectionHighlight()
    });

    this.init();
  }

  private init(): void {
    // 创建表格容器
    this.tableContainer = document.createElement('div');
    this.tableContainer.className = 'excel-dom-renderer';
    this.tableContainer.style.cssText = `
      width: 100%;
      height: 100%;
      overflow: auto;
      position: relative;
      background: #fff;
    `;
    this.container.appendChild(this.tableContainer);

    // 创建选区覆盖层
    this.selectionOverlay = document.createElement('div');
    this.selectionOverlay.className = 'selection-overlay';
    this.selectionOverlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 10;
    `;

    // 创建填充柄
    this.fillHandle = document.createElement('div');
    this.fillHandle.className = 'fill-handle';
    this.fillHandle.style.cssText = `
      position: fixed;
      width: 8px;
      height: 8px;
      background: #1a73e8;
      border: 1px solid #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      cursor: crosshair;
      z-index: 9999;
      display: none;
    `;
    document.body.appendChild(this.fillHandle);

    // 初始化右键菜单
    this.contextMenu = new ContextMenu(this.container, {
      items: createDefaultContextMenuItems()
    });

    // 绑定事件
    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.tableContainer) return;

    // 鼠标按下开始拖拽选择
    this.tableContainer.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;

      // 检查是否点击了列头
      const th = target.closest('th');
      if (th && th.dataset.col !== undefined) {
        const col = parseInt(th.dataset.col, 10);
        this.selectionManager.selectCol(col, e.ctrlKey || e.metaKey);
        return;
      }

      // 检查是否点击了行头
      const td = target.closest('td');
      if (td && td.dataset.rowHeader !== undefined) {
        const row = parseInt(td.dataset.row ?? '0', 10);
        this.selectionManager.selectRow(row, e.ctrlKey || e.metaKey);
        return;
      }

      if (!td || td.dataset.row === undefined) return;

      const row = parseInt(td.dataset.row, 10);
      const col = parseInt(td.dataset.col ?? '0', 10);

      const addToSelection = e.ctrlKey || e.metaKey;
      const extendSelection = e.shiftKey;

      if (extendSelection) {
        this.selectionManager.extendSelection(row, col);
      } else {
        this.selectionManager.startDragSelection(row, col, addToSelection);
        this.isDragging = true;
      }
    });

    // 鼠标移动更新拖拽选择
    this.tableContainer.addEventListener('mousemove', (e) => {
      if (this.isFillDragging) {
        // 填充柄拖拽
        const target = e.target as HTMLElement;
        const td = target.closest('td');
        if (td && td.dataset.row !== undefined) {
          const row = parseInt(td.dataset.row, 10);
          const col = parseInt(td.dataset.col ?? '0', 10);
          this.updateFillPreview(row, col);
        }
        return;
      }

      if (!this.isDragging) return;

      const target = e.target as HTMLElement;
      const td = target.closest('td');
      if (!td || td.dataset.row === undefined) return;

      const row = parseInt(td.dataset.row, 10);
      const col = parseInt(td.dataset.col ?? '0', 10);
      this.selectionManager.updateDragSelection(row, col);
    });

    // 鼠标松开结束拖拽
    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.selectionManager.endDragSelection();
        this.isDragging = false;
      }
      if (this.isFillDragging) {
        this.completeFill();
        this.isFillDragging = false;
        this.fillStartCell = null;
      }
    });

    // 填充柄事件
    if (this.fillHandle) {
      this.fillHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const activeCell = this.selectionManager.getActiveCell();
        this.fillStartCell = { row: activeCell.row, col: activeCell.col };
        this.isFillDragging = true;
      });
    }

    // 右键菜单
    this.tableContainer.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e.clientX, e.clientY);
    });

    // 键盘事件
    this.tableContainer.tabIndex = 0;
    this.tableContainer.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        e.preventDefault();
        const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
        this.selectionManager.moveActiveCell(direction, shift);
        break;
      case 'Delete':
        e.preventDefault();
        this.clearSelectedCells();
        break;
      case 'a':
        if (ctrl) {
          e.preventDefault();
          this.selectionManager.selectAll();
        }
        break;
      case 'Enter':
        e.preventDefault();
        const active = this.selectionManager.getActiveCell();
        const td = this.cellElements.get(this.formatAddress(active.row, active.col));
        if (td) {
          const cell = this.sheet?.cells.get(this.formatAddress(active.row, active.col));
          this.startEditing(active.row, active.col, td, cell);
        }
        break;
    }
  }

  private showContextMenu(x: number, y: number): void {
    if (!this.contextMenu) return;

    this.contextMenu.show(x, y, (item: MenuItem) => {
      this.handleContextMenuAction(item.id);
    });
  }

  private handleContextMenuAction(action: string): void {
    const selection = this.selectionManager.getSelection();

    if (this.onContextMenuAction) {
      this.onContextMenuAction(action, selection);
    }

    const bounds = this.selectionManager.getSelectionBounds();

    switch (action) {
      // 剪贴板操作
      case 'cut':
        this.copySelectedCells(true);
        break;
      case 'copy':
        this.copySelectedCells(false);
        break;
      case 'paste':
        this.pasteCells();
        break;

      // 清除操作
      case 'clearContents':
        this.clearSelectedCells();
        break;
      case 'clearFormats':
        this.clearSelectedFormats();
        break;
      case 'clearAll':
        this.clearSelectedCells();
        this.clearSelectedFormats();
        break;

      // 插入行/列
      case 'insertRowAbove':
        if (bounds) this.insertRows(bounds.start.row, 1, 'above');
        break;
      case 'insertRowBelow':
        if (bounds) this.insertRows(bounds.end.row, 1, 'below');
        break;
      case 'insertColLeft':
        if (bounds) this.insertCols(bounds.start.col, 1, 'left');
        break;
      case 'insertColRight':
        if (bounds) this.insertCols(bounds.end.col, 1, 'right');
        break;

      // 删除行/列
      case 'deleteRow':
        if (bounds) this.deleteRows(bounds.start.row, bounds.end.row - bounds.start.row + 1);
        break;
      case 'deleteCol':
        if (bounds) this.deleteCols(bounds.start.col, bounds.end.col - bounds.start.col + 1);
        break;

      // 隐藏/显示行列
      case 'hideRow':
        if (bounds) this.hideRows(bounds.start.row, bounds.end.row);
        break;
      case 'hideCol':
        if (bounds) this.hideCols(bounds.start.col, bounds.end.col);
        break;
      case 'showHiddenRows':
        this.showAllRows();
        break;
      case 'showHiddenCols':
        this.showAllCols();
        break;

      // 排序
      case 'sortAsc':
        if (bounds) this.sortRange(bounds, 'asc');
        break;
      case 'sortDesc':
        if (bounds) this.sortRange(bounds, 'desc');
        break;

      // 合并单元格
      case 'mergeAll':
        if (bounds) this.mergeCells(bounds);
        break;
      case 'unmergeCells':
        if (bounds) this.unmergeCells(bounds);
        break;

      default:
        console.log('Context menu action:', action);
    }
  }

  private clearSelectedCells(): void {
    const bounds = this.selectionManager.getSelectionBounds();
    if (!bounds || !this.sheet) return;

    for (let row = bounds.start.row; row <= Math.min(bounds.end.row, 1000); row++) {
      for (let col = bounds.start.col; col <= Math.min(bounds.end.col, 100); col++) {
        const address = this.formatAddress(row, col);
        this.sheet.cells.delete(address);
        const td = this.cellElements.get(address);
        if (td) {
          td.textContent = '';
        }
      }
    }
  }

  private updateSelectionHighlight(): void {
    // 清除之前的高亮（只清除选区相关样式，保留原始背景）
    this.cellElements.forEach((td) => {
      td.classList.remove('selected', 'active');
      td.style.outline = '';
      td.style.outlineOffset = '';
      td.style.boxShadow = '';
      // 恢复原始背景色
      if (td.dataset.originalBg !== undefined) {
        td.style.backgroundColor = td.dataset.originalBg;
      }
    });

    const selection = this.selectionManager.getSelection();
    const activeCell = selection.activeCell;

    // 高亮选中的单元格（使用半透明覆盖层而不是替换背景）
    for (const range of selection.ranges) {
      for (let row = range.start.row; row <= Math.min(range.end.row, 1000); row++) {
        for (let col = range.start.col; col <= Math.min(range.end.col, 100); col++) {
          const address = this.formatAddress(row, col);
          const td = this.cellElements.get(address);
          if (td) {
            td.classList.add('selected');
            // 只在第一次保存原始背景色
            if (td.dataset.originalBg === undefined) {
              td.dataset.originalBg = td.style.backgroundColor || '';
            }
            // 使用 box-shadow 而不是修改背景色
            td.style.boxShadow = 'inset 0 0 0 1000px rgba(26, 115, 232, 0.15)';
          }
        }
      }
    }

    // 高亮活动单元格
    const activeAddress = this.formatAddress(activeCell.row, activeCell.col);
    const activeTd = this.cellElements.get(activeAddress);
    if (activeTd) {
      activeTd.classList.add('active');
      activeTd.style.outline = '2px solid #1a73e8';
      activeTd.style.outlineOffset = '-1px';
      // 活动单元格不需要选区高亮
      activeTd.style.boxShadow = '';
    }

    // 更新填充柄位置
    this.updateFillHandlePosition();
  }

  setSheet(sheet: Sheet): void {
    this.sheet = sheet;
    this.renderedMerges.clear();
    this.render();
  }

  setZoom(zoom: number): void {
    this.options.zoom = zoom;
    // 使用 CSS zoom 属性（不破坏 sticky 定位）
    if (this.tableContainer) {
      (this.tableContainer.style as any).zoom = zoom;
    }
  }

  render(): void {
    if (!this.sheet || !this.tableContainer) return;

    // 清空容器
    this.tableContainer.innerHTML = '';
    this.renderedMerges.clear();
    this.cellElements.clear();
    this.editingCell = null;

    // 应用 zoom
    (this.tableContainer.style as any).zoom = this.options.zoom;

    // 创建表格
    this.table = document.createElement('table');
    this.table.className = 'excel-table';
    this.table.style.cssText = `
      border-collapse: collapse;
      table-layout: fixed;
      font-family: ${this.options.defaultFont}, Arial, sans-serif;
      font-size: ${this.options.defaultFontSize}px;
      background: #fff;
      min-width: max-content;
    `;

    // 计算维度
    let maxRow = this.sheet.dimension?.end.row ?? 0;
    let maxCol = this.sheet.dimension?.end.col ?? 0;

    // 从实际单元格计算
    this.sheet.cells.forEach((cell) => {
      if (cell.row > maxRow) maxRow = cell.row;
      if (cell.col > maxCol) maxCol = cell.col;
    });

    maxRow = Math.max(maxRow, 50);
    maxCol = Math.max(maxCol, 20);

    // 创建 colgroup 定义列宽
    const colgroup = document.createElement('colgroup');

    // 行号列
    if (this.options.showRowHeaders) {
      const rowHeaderCol = document.createElement('col');
      rowHeaderCol.style.width = '50px';
      colgroup.appendChild(rowHeaderCol);
    }

    // 数据列
    for (let col = 0; col <= maxCol; col++) {
      const colEl = document.createElement('col');
      const colDef = this.sheet.columns.get(col);
      const width = colDef?.pixelWidth ?? this.options.defaultColWidth;
      colEl.style.width = `${width}px`;
      colgroup.appendChild(colEl);
    }
    this.table.appendChild(colgroup);

    // 创建表头行（列号）
    if (this.options.showColHeaders) {
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.style.cssText = `
        background: #f3f3f3;
        position: sticky;
        top: 0;
        z-index: 10;
      `;

      // 左上角空单元格
      if (this.options.showRowHeaders) {
        const cornerCell = document.createElement('th');
        cornerCell.style.cssText = `
          min-width: 50px;
          height: 24px;
          background: #e9ecef;
          border: 1px solid #d0d0d0;
          position: sticky;
          left: 0;
          z-index: 11;
        `;
        headerRow.appendChild(cornerCell);
      }

      // 列号
      for (let col = 0; col <= maxCol; col++) {
        const th = document.createElement('th');
        th.textContent = this.getColumnLabel(col);
        th.dataset.col = String(col);
        th.style.cssText = `
          height: 24px;
          background: #f3f3f3;
          border: 1px solid #d0d0d0;
          font-weight: normal;
          color: #666;
          text-align: center;
          cursor: pointer;
          user-select: none;
        `;
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);
      this.table.appendChild(thead);
    }

    // 创建表体
    const tbody = document.createElement('tbody');

    for (let row = 0; row <= maxRow; row++) {
      const tr = document.createElement('tr');
      const rowDef = this.sheet.rows.get(row);
      const rowHeight = rowDef?.height ?? this.options.defaultRowHeight;
      tr.style.height = `${rowHeight}px`;

      if (rowDef?.hidden) {
        tr.style.display = 'none';
      }

      // 行号单元格
      if (this.options.showRowHeaders) {
        const rowHeader = document.createElement('td');
        rowHeader.textContent = String(row + 1);
        rowHeader.dataset.row = String(row);
        rowHeader.dataset.rowHeader = 'true';
        rowHeader.style.cssText = `
          min-width: 50px;
          background: #f3f3f3;
          border: 1px solid #d0d0d0;
          text-align: center;
          color: #666;
          position: sticky;
          left: 0;
          z-index: 5;
          cursor: pointer;
          user-select: none;
        `;
        tr.appendChild(rowHeader);
      }

      // 数据单元格
      for (let col = 0; col <= maxCol; col++) {
        const address = this.formatAddress(row, col);
        const cell = this.sheet.cells.get(address);

        // 检查是否在合并区域内（非起始单元格）
        if (cell?.isMerged && !cell.isMergeOrigin) {
          continue; // 跳过被合并的单元格
        }

        const td = document.createElement('td');

        // 处理合并单元格
        if (cell?.isMergeOrigin && cell.merge) {
          const rowSpan = cell.merge.end.row - cell.merge.start.row + 1;
          const colSpan = cell.merge.end.col - cell.merge.start.col + 1;
          td.rowSpan = rowSpan;
          td.colSpan = colSpan;
        }

        // 应用样式
        this.applyCellStyle(td, cell, rowHeight);

        // 设置内容
        if (cell) {
          const displayText = cell.formattedValue ?? cell.text ?? '';
          td.textContent = displayText;
        }

        // 存储单元格元素引用
        const cellAddress = this.formatAddress(row, col);
        this.cellElements.set(cellAddress, td);
        td.dataset.row = String(row);
        td.dataset.col = String(col);
        td.dataset.address = cellAddress;

        // 添加点击事件 - 选中
        td.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleCellClick(row, col, cell, td);
        });

        // 添加双击事件 - 编辑
        td.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          this.startEditing(row, col, td, cell);
        });

        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }

    this.table.appendChild(tbody);
    this.tableContainer.appendChild(this.table);
  }

  private applyCellStyle(td: HTMLTableCellElement, cell: Cell | undefined, rowHeight: number): void {
    const style = cell?.style;

    let cssText = `
      height: ${rowHeight}px;
      padding: 2px 4px;
      border: 1px solid #e0e0e0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: middle;
    `;

    // 背景色
    if (style?.fill) {
      if (style.fill.pattern !== 'none') {
        const bgColor = this.resolveFillColor(style.fill);
        if (bgColor) {
          cssText += `background-color: ${bgColor};`;
        }
      }
    }

    // 字体
    if (style?.font) {
      const font = style.font;
      if (font.bold) cssText += 'font-weight: bold;';
      if (font.italic) cssText += 'font-style: italic;';
      if (font.underline && font.underline !== 'none') cssText += 'text-decoration: underline;';
      if (font.strikethrough) cssText += 'text-decoration: line-through;';
      if (font.size) cssText += `font-size: ${font.size}px;`;
      if (font.name) cssText += `font-family: "${font.name}", ${this.options.defaultFont}, Arial, sans-serif;`;
      if (font.color) {
        const color = this.resolveColor(font.color);
        cssText += `color: ${color};`;
      }
    }

    // 对齐
    if (style?.alignment) {
      const align = style.alignment;
      if (align.horizontal) {
        cssText += `text-align: ${align.horizontal};`;
      }
      if (align.vertical) {
        const vAlign = align.vertical === 'center' ? 'middle' : align.vertical;
        cssText += `vertical-align: ${vAlign};`;
      }
      if (align.wrapText) {
        cssText += 'white-space: normal; word-wrap: break-word;';
      }
    }

    // 边框
    if (style?.border) {
      const border = style.border;
      if (border.top) cssText += `border-top: ${this.getBorderStyle(border.top)};`;
      if (border.right) cssText += `border-right: ${this.getBorderStyle(border.right)};`;
      if (border.bottom) cssText += `border-bottom: ${this.getBorderStyle(border.bottom)};`;
      if (border.left) cssText += `border-left: ${this.getBorderStyle(border.left)};`;
    }

    td.style.cssText = cssText;
  }

  private getBorderStyle(border: { style?: string; color?: any }): string {
    const style = border.style ?? 'thin';
    const width = style === 'thin' ? '1px' : style === 'medium' ? '2px' : '1px';
    const color = border.color ? this.resolveColor(border.color) : '#000';
    return `${width} solid ${color}`;
  }

  private resolveFillColor(fill: CellStyle['fill']): string | null {
    if (!fill) return null;

    // solid 或 gray125 等模式都可能有 fgColor
    if (fill.fgColor) {
      const color = this.resolveColor(fill.fgColor);
      // 只过滤纯黑色（通常是默认值或解析问题）
      // 但如果明确是 solid 模式且有颜色，保留它
      if (fill.pattern === 'solid' || fill.pattern === 'gray125') {
        if (color !== '#000000' && color !== '#000' && color !== '#333' && color !== '#333333') {
          return color;
        }
      }
    }

    // 尝试 bgColor
    if (fill.bgColor) {
      const color = this.resolveColor(fill.bgColor);
      if (color !== '#000000' && color !== '#000' && color !== '#333' && color !== '#333333') {
        return color;
      }
    }

    // 如果 pattern 不是 none，且有 fgColor，可能需要返回它
    if (fill.pattern && fill.pattern !== 'none' && fill.fgColor) {
      const color = this.resolveColor(fill.fgColor);
      // 返回非默认颜色
      if (color && !color.startsWith('#0') && !color.startsWith('#3')) {
        return color;
      }
    }

    return null;
  }

  private resolveColor(color: any): string {
    if (!color) return '#333';

    if (color.rgb) {
      const rgb = color.rgb;
      if (rgb.length === 8) {
        // ARGB format - 跳过 alpha
        return `#${rgb.substring(2)}`;
      }
      if (rgb.length === 6) {
        return `#${rgb}`;
      }
      return `#${rgb}`;
    }
    if (color.theme !== undefined) {
      // Excel 主题色 - Office 2013+ 默认主题
      // 0: lt1 (背景1), 1: dk1 (文字1), 2: lt2 (背景2), 3: dk2 (文字2)
      // 4: accent1, 5: accent2, 6: accent3, 7: accent4, 8: accent5, 9: accent6
      const themeColors = [
        '#FFFFFF', // 0: lt1 - 浅色背景
        '#000000', // 1: dk1 - 深色文字
        '#E7E6E6', // 2: lt2 - 浅色背景2
        '#44546A', // 3: dk2 - 深色文字2
        '#4472C4', // 4: accent1 - 蓝色
        '#ED7D31', // 5: accent2 - 橙色
        '#A5A5A5', // 6: accent3 - 灰色
        '#FFC000', // 7: accent4 - 黄色
        '#5B9BD5', // 8: accent5 - 浅蓝色
        '#70AD47'  // 9: accent6 - 绿色
      ];
      let baseColor = themeColors[color.theme] ?? '#333333';

      // 处理 tint（色调调整）
      if (color.tint !== undefined && color.tint !== 0) {
        baseColor = this.applyTint(baseColor, color.tint);
      }
      return baseColor;
    }
    if (color.indexed !== undefined) {
      // Excel 索引色
      const indexedColors = [
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
        '#FF00FF', '#00FFFF', '#000000', '#FFFFFF', '#FF0000', '#00FF00',
        '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#800000', '#008000',
        '#000080', '#808000', '#800080', '#008080', '#C0C0C0', '#808080'
      ];
      return indexedColors[color.indexed] ?? '#333333';
    }

    return '#333333';
  }

  private applyTint(hexColor: string, tint: number): string {
    // 简化的 tint 处理
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    let newR, newG, newB;
    if (tint < 0) {
      // 变暗
      newR = Math.round(r * (1 + tint));
      newG = Math.round(g * (1 + tint));
      newB = Math.round(b * (1 + tint));
    } else {
      // 变亮
      newR = Math.round(r + (255 - r) * tint);
      newG = Math.round(g + (255 - g) * tint);
      newB = Math.round(b + (255 - b) * tint);
    }

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
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

  private getColumnLabel(col: number): string {
    let label = '';
    let c = col + 1;
    while (c > 0) {
      const remainder = (c - 1) % 26;
      label = String.fromCharCode(65 + remainder) + label;
      c = Math.floor((c - 1) / 26);
    }
    return label;
  }

  private handleCellClick(row: number, col: number, cell: Cell | undefined, _td: HTMLTableCellElement): void {
    // 使用选区管理器处理选中
    // 注意：实际选区由 mousedown 事件处理，这里只触发事件
    const event = new CustomEvent('cellClick', {
      detail: { row, col, cell, address: this.formatAddress(row, col) }
    });
    this.container.dispatchEvent(event);
  }

  private startEditing(row: number, col: number, td: HTMLTableCellElement, cell: Cell | undefined): void {
    // 如果已在编辑，先结束
    if (this.editingCell) {
      this.finishEditing();
    }

    const oldValue = cell?.text ?? td.textContent ?? '';

    // 创建输入框
    const input = document.createElement('input');
    input.type = 'text';
    input.value = oldValue;
    input.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      padding: 2px 4px;
      font: inherit;
      background: #fff;
      box-sizing: border-box;
    `;

    // 保存原始内容
    const originalContent = td.textContent;
    td.textContent = '';
    td.appendChild(input);
    input.focus();
    input.select();

    this.editingCell = { row, col, td, input };

    // 处理输入完成
    const finishEdit = () => {
      if (!this.editingCell) return;

      const newValue = input.value;
      td.textContent = newValue;

      // 更新 sheet 数据
      if (this.sheet) {
        const address = this.formatAddress(row, col);
        let cellData = this.sheet.cells.get(address);
        if (!cellData) {
          cellData = {
            address,
            row,
            col,
            value: newValue,
            type: 'string',
            text: newValue
          };
          this.sheet.cells.set(address, cellData);
        } else {
          cellData.value = newValue;
          cellData.text = newValue;
          cellData.formattedValue = newValue;
        }
      }

      // 触发回调
      if (this.onCellChange && newValue !== originalContent) {
        this.onCellChange(row, col, newValue, originalContent ?? '');
      }

      // 触发事件
      const event = new CustomEvent('cellChange', {
        detail: { row, col, value: newValue, oldValue: originalContent }
      });
      this.container.dispatchEvent(event);

      this.editingCell = null;
    };

    // 回车或失焦完成编辑
    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      } else if (e.key === 'Escape') {
        // 取消编辑
        td.textContent = originalContent;
        this.editingCell = null;
      }
    });
  }

  private finishEditing(): void {
    if (this.editingCell) {
      this.editingCell.input.blur();
    }
  }

  setSelection(startRow: number, startCol: number, endRow: number, endCol: number): void {
    this.selectionManager.selectRange({
      start: { row: startRow, col: startCol },
      end: { row: endRow, col: endCol }
    });
  }

  destroy(): void {
    if (this.tableContainer) {
      this.tableContainer.remove();
      this.tableContainer = null;
    }
    if (this.contextMenu) {
      this.contextMenu.destroy();
      this.contextMenu = null;
    }
    this.table = null;
    this.sheet = null;
    this.cellElements.clear();
  }

  // 获取当前选中的单元格
  getActiveCell(): { row: number; col: number } {
    return this.selectionManager.getActiveCell();
  }

  // 获取当前选区
  getSelection() {
    return this.selectionManager.getSelection();
  }

  // 获取选区管理器
  getSelectionManager(): SelectionManager {
    return this.selectionManager;
  }

  // 获取单元格值
  getCellValue(row: number, col: number): string {
    if (!this.sheet) return '';
    const address = this.formatAddress(row, col);
    const cell = this.sheet.cells.get(address);
    return cell?.text ?? '';
  }

  // 设置单元格值
  setCellValue(row: number, col: number, value: string): void {
    if (!this.sheet) return;

    const address = this.formatAddress(row, col);
    let cell = this.sheet.cells.get(address);

    if (!cell) {
      cell = {
        address,
        row,
        col,
        value,
        type: 'string',
        text: value
      };
      this.sheet.cells.set(address, cell);
    } else {
      cell.value = value;
      cell.text = value;
      cell.formattedValue = value;
    }

    // 更新 DOM
    const td = this.cellElements.get(address);
    if (td) {
      td.textContent = value;
    }
  }

  // 获取总尺寸
  getTotalWidth(): number {
    return this.table?.offsetWidth ?? 0;
  }

  getTotalHeight(): number {
    return this.table?.offsetHeight ?? 0;
  }

  // 填充预览
  private updateFillPreview(_row: number, _col: number): void {
    // 暂时只更新选区预览，完整填充功能后续实现
    // 这里可以显示填充范围的虚线框
  }

  // 完成填充
  private completeFill(): void {
    if (!this.fillStartCell || !this.sheet) return;

    const bounds = this.selectionManager.getSelectionBounds();
    if (!bounds) return;

    // 获取源单元格的值
    const sourceAddress = this.formatAddress(this.fillStartCell.row, this.fillStartCell.col);
    const sourceCell = this.sheet.cells.get(sourceAddress);
    const sourceValue = sourceCell?.text ?? '';

    // 填充到选区
    for (let row = bounds.start.row; row <= Math.min(bounds.end.row, 1000); row++) {
      for (let col = bounds.start.col; col <= Math.min(bounds.end.col, 100); col++) {
        if (row === this.fillStartCell.row && col === this.fillStartCell.col) continue;
        this.setCellValue(row, col, sourceValue);
      }
    }
  }

  // 更新填充柄位置
  private updateFillHandlePosition(): void {
    if (!this.fillHandle || !this.tableContainer) return;

    const bounds = this.selectionManager.getSelectionBounds();
    if (!bounds) {
      this.fillHandle.style.display = 'none';
      return;
    }

    // 获取选区右下角单元格
    const endAddress = this.formatAddress(bounds.end.row, bounds.end.col);
    const endTd = this.cellElements.get(endAddress);

    if (!endTd) {
      this.fillHandle.style.display = 'none';
      return;
    }

    const tdRect = endTd.getBoundingClientRect();
    const tableContainerRect = this.tableContainer.getBoundingClientRect();

    // 检查单元格是否在可视区域内
    if (tdRect.right < tableContainerRect.left ||
      tdRect.bottom < tableContainerRect.top ||
      tdRect.left > tableContainerRect.right ||
      tdRect.top > tableContainerRect.bottom) {
      this.fillHandle.style.display = 'none';
      return;
    }

    // 使用 fixed 定位，相对于视口
    this.fillHandle.style.position = 'fixed';
    this.fillHandle.style.display = 'block';
    this.fillHandle.style.left = `${tdRect.right - 4}px`;
    this.fillHandle.style.top = `${tdRect.bottom - 4}px`;
  }

  // 剪贴板数据
  private clipboardData: { cells: Map<string, { text: string; style?: CSSStyleDeclaration }>, bounds: { startRow: number; startCol: number; endRow: number; endCol: number } } | null = null;
  private isCut = false;

  // 复制选中的单元格
  private copySelectedCells(cut: boolean): void {
    const bounds = this.selectionManager.getSelectionBounds();
    if (!bounds || !this.sheet) return;

    this.isCut = cut;
    this.clipboardData = {
      cells: new Map(),
      bounds: {
        startRow: bounds.start.row,
        startCol: bounds.start.col,
        endRow: bounds.end.row,
        endCol: bounds.end.col
      }
    };

    for (let row = bounds.start.row; row <= Math.min(bounds.end.row, 1000); row++) {
      for (let col = bounds.start.col; col <= Math.min(bounds.end.col, 100); col++) {
        const address = this.formatAddress(row, col);
        const cell = this.sheet.cells.get(address);
        const td = this.cellElements.get(address);
        this.clipboardData.cells.set(`${row - bounds.start.row},${col - bounds.start.col}`, {
          text: cell?.text ?? '',
          style: td?.style
        });
      }
    }

    // 尝试复制到系统剪贴板
    const textData = this.getSelectionAsText(bounds);
    navigator.clipboard?.writeText(textData).catch(() => { });

    if (cut) {
      // 标记剪切区域（虚线边框）
      this.highlightCutArea(bounds);
    }
  }

  // 获取选区文本
  private getSelectionAsText(bounds: { start: { row: number; col: number }; end: { row: number; col: number } }): string {
    if (!this.sheet) return '';
    const rows: string[] = [];
    for (let row = bounds.start.row; row <= Math.min(bounds.end.row, 1000); row++) {
      const cols: string[] = [];
      for (let col = bounds.start.col; col <= Math.min(bounds.end.col, 100); col++) {
        const address = this.formatAddress(row, col);
        const cell = this.sheet.cells.get(address);
        cols.push(cell?.text ?? '');
      }
      rows.push(cols.join('\t'));
    }
    return rows.join('\n');
  }

  // 高亮剪切区域
  private highlightCutArea(bounds: { start: { row: number; col: number }; end: { row: number; col: number } }): void {
    for (let row = bounds.start.row; row <= Math.min(bounds.end.row, 1000); row++) {
      for (let col = bounds.start.col; col <= Math.min(bounds.end.col, 100); col++) {
        const td = this.cellElements.get(this.formatAddress(row, col));
        if (td) {
          td.style.border = '2px dashed #1a73e8';
        }
      }
    }
  }

  // 粘贴单元格
  private pasteCells(): void {
    if (!this.clipboardData || !this.sheet) return;

    const activeCell = this.selectionManager.getActiveCell();
    const { bounds, cells } = this.clipboardData;

    for (let row = 0; row <= bounds.endRow - bounds.startRow; row++) {
      for (let col = 0; col <= bounds.endCol - bounds.startCol; col++) {
        const data = cells.get(`${row},${col}`);
        if (data) {
          this.setCellValue(activeCell.row + row, activeCell.col + col, data.text);
        }
      }
    }

    // 如果是剪切，清除原位置
    if (this.isCut) {
      for (let row = bounds.startRow; row <= bounds.endRow; row++) {
        for (let col = bounds.startCol; col <= bounds.endCol; col++) {
          const address = this.formatAddress(row, col);
          this.sheet.cells.delete(address);
          const td = this.cellElements.get(address);
          if (td) {
            td.textContent = '';
            td.style.border = '';
          }
        }
      }
      this.clipboardData = null;
      this.isCut = false;
    }
  }

  // 清除选中单元格的格式
  private clearSelectedFormats(): void {
    const bounds = this.selectionManager.getSelectionBounds();
    if (!bounds) return;

    for (let row = bounds.start.row; row <= Math.min(bounds.end.row, 1000); row++) {
      for (let col = bounds.start.col; col <= Math.min(bounds.end.col, 100); col++) {
        const td = this.cellElements.get(this.formatAddress(row, col));
        if (td) {
          td.style.fontWeight = '';
          td.style.fontStyle = '';
          td.style.textDecoration = '';
          td.style.color = '';
          td.style.backgroundColor = '';
          td.style.textAlign = '';
        }
      }
    }
  }

  // 插入行
  private insertRows(rowIndex: number, count: number, position: 'above' | 'below'): void {
    if (!this.sheet) return;
    const insertAt = position === 'above' ? rowIndex : rowIndex + 1;

    // 移动现有数据
    const newCells = new Map<string, typeof this.sheet.cells extends Map<string, infer V> ? V : never>();
    this.sheet.cells.forEach((cell, address) => {
      const [col, row] = this.parseAddress(address);
      if (row >= insertAt) {
        newCells.set(this.formatAddress(row + count, col), cell);
      } else {
        newCells.set(address, cell);
      }
    });
    this.sheet.cells = newCells;

    // 重新渲染
    this.render();
  }

  // 插入列
  private insertCols(colIndex: number, count: number, position: 'left' | 'right'): void {
    if (!this.sheet) return;
    const insertAt = position === 'left' ? colIndex : colIndex + 1;

    const newCells = new Map<string, typeof this.sheet.cells extends Map<string, infer V> ? V : never>();
    this.sheet.cells.forEach((cell, address) => {
      const [col, row] = this.parseAddress(address);
      if (col >= insertAt) {
        newCells.set(this.formatAddress(row, col + count), cell);
      } else {
        newCells.set(address, cell);
      }
    });
    this.sheet.cells = newCells;

    this.render();
  }

  // 删除行
  private deleteRows(startRow: number, count: number): void {
    if (!this.sheet) return;

    const newCells = new Map<string, typeof this.sheet.cells extends Map<string, infer V> ? V : never>();
    this.sheet.cells.forEach((cell, address) => {
      const [col, row] = this.parseAddress(address);
      if (row < startRow) {
        newCells.set(address, cell);
      } else if (row >= startRow + count) {
        newCells.set(this.formatAddress(row - count, col), cell);
      }
      // 删除范围内的行不复制
    });
    this.sheet.cells = newCells;

    this.render();
  }

  // 删除列
  private deleteCols(startCol: number, count: number): void {
    if (!this.sheet) return;

    const newCells = new Map<string, typeof this.sheet.cells extends Map<string, infer V> ? V : never>();
    this.sheet.cells.forEach((cell, address) => {
      const [col, row] = this.parseAddress(address);
      if (col < startCol) {
        newCells.set(address, cell);
      } else if (col >= startCol + count) {
        newCells.set(this.formatAddress(row, col - count), cell);
      }
    });
    this.sheet.cells = newCells;

    this.render();
  }

  // 解析地址
  private parseAddress(address: string): [number, number] {
    const match = address.match(/^([A-Z]+)(\d+)$/);
    if (!match) return [0, 0];
    const col = match[1].split('').reduce((acc, c) => acc * 26 + c.charCodeAt(0) - 64, 0) - 1;
    const row = parseInt(match[2], 10) - 1;
    return [col, row];
  }

  // 隐藏的行/列记录
  private hiddenRows = new Set<number>();
  private hiddenCols = new Set<number>();

  // 隐藏行
  private hideRows(startRow: number, endRow: number): void {
    for (let row = startRow; row <= endRow; row++) {
      this.hiddenRows.add(row);
    }
    this.render();
  }

  // 隐藏列
  private hideCols(startCol: number, endCol: number): void {
    for (let col = startCol; col <= endCol; col++) {
      this.hiddenCols.add(col);
    }
    this.render();
  }

  // 显示所有行
  private showAllRows(): void {
    this.hiddenRows.clear();
    this.render();
  }

  // 显示所有列
  private showAllCols(): void {
    this.hiddenCols.clear();
    this.render();
  }

  // 排序范围
  private sortRange(bounds: { start: { row: number; col: number }; end: { row: number; col: number } }, order: 'asc' | 'desc'): void {
    if (!this.sheet) return;

    // 收集数据
    const rows: Array<{ row: number; values: string[] }> = [];
    for (let row = bounds.start.row; row <= Math.min(bounds.end.row, 1000); row++) {
      const values: string[] = [];
      for (let col = bounds.start.col; col <= Math.min(bounds.end.col, 100); col++) {
        const address = this.formatAddress(row, col);
        const cell = this.sheet.cells.get(address);
        values.push(cell?.text ?? '');
      }
      rows.push({ row, values });
    }

    // 按第一列排序
    rows.sort((a, b) => {
      const aVal = a.values[0] ?? '';
      const bVal = b.values[0] ?? '';
      const comparison = aVal.localeCompare(bVal, 'zh-CN', { numeric: true });
      return order === 'asc' ? comparison : -comparison;
    });

    // 重新写入数据
    rows.forEach((rowData, newIndex) => {
      const newRow = bounds.start.row + newIndex;
      rowData.values.forEach((value, colIndex) => {
        const col = bounds.start.col + colIndex;
        this.setCellValue(newRow, col, value);
      });
    });
  }

  // 合并单元格记录
  private mergedCells = new Map<string, { startRow: number; startCol: number; endRow: number; endCol: number }>();

  // 合并单元格
  private mergeCells(bounds: { start: { row: number; col: number }; end: { row: number; col: number } }): void {
    if (!this.sheet) return;

    const mergeKey = this.formatAddress(bounds.start.row, bounds.start.col);
    this.mergedCells.set(mergeKey, {
      startRow: bounds.start.row,
      startCol: bounds.start.col,
      endRow: bounds.end.row,
      endCol: bounds.end.col
    });

    // 获取左上角单元格的值
    const firstAddress = this.formatAddress(bounds.start.row, bounds.start.col);
    const firstCell = this.sheet.cells.get(firstAddress);
    const firstTd = this.cellElements.get(firstAddress);

    if (firstTd) {
      firstTd.rowSpan = bounds.end.row - bounds.start.row + 1;
      firstTd.colSpan = bounds.end.col - bounds.start.col + 1;
    }

    // 隐藏其他单元格
    for (let row = bounds.start.row; row <= bounds.end.row; row++) {
      for (let col = bounds.start.col; col <= bounds.end.col; col++) {
        if (row === bounds.start.row && col === bounds.start.col) continue;
        const td = this.cellElements.get(this.formatAddress(row, col));
        if (td) {
          td.style.display = 'none';
        }
      }
    }
  }

  // 取消合并单元格
  private unmergeCells(bounds: { start: { row: number; col: number }; end: { row: number; col: number } }): void {
    const mergeKey = this.formatAddress(bounds.start.row, bounds.start.col);
    const merge = this.mergedCells.get(mergeKey);
    if (!merge) return;

    const firstTd = this.cellElements.get(mergeKey);
    if (firstTd) {
      firstTd.rowSpan = 1;
      firstTd.colSpan = 1;
    }

    // 显示其他单元格
    for (let row = merge.startRow; row <= merge.endRow; row++) {
      for (let col = merge.startCol; col <= merge.endCol; col++) {
        const td = this.cellElements.get(this.formatAddress(row, col));
        if (td) {
          td.style.display = '';
        }
      }
    }

    this.mergedCells.delete(mergeKey);
  }

  // ==================== 工具栏功能 ====================

  /**
   * 应用格式到选中单元格
   */
  applyFormat(property: string, value: string): void {
    const bounds = this.selectionManager.getSelectionBounds();
    if (!bounds) return;

    for (let row = bounds.start.row; row <= Math.min(bounds.end.row, 1000); row++) {
      for (let col = bounds.start.col; col <= Math.min(bounds.end.col, 100); col++) {
        const td = this.cellElements.get(this.formatAddress(row, col));
        if (td) {
          // 切换样式（如果已有则移除）
          const currentValue = td.style.getPropertyValue(property) || (td.style as unknown as Record<string, string>)[property];
          if (currentValue === value) {
            td.style.setProperty(property, '');
          } else {
            td.style.setProperty(property, value);
          }
        }
      }
    }
  }

  /**
   * 应用数字格式
   */
  applyNumberFormat(format: 'percent' | 'currency' | 'date'): void {
    const bounds = this.selectionManager.getSelectionBounds();
    if (!bounds || !this.sheet) return;

    for (let row = bounds.start.row; row <= Math.min(bounds.end.row, 1000); row++) {
      for (let col = bounds.start.col; col <= Math.min(bounds.end.col, 100); col++) {
        const address = this.formatAddress(row, col);
        const cell = this.sheet.cells.get(address);
        const td = this.cellElements.get(address);
        if (td && cell?.text) {
          const num = parseFloat(cell.text);
          if (!isNaN(num)) {
            let formatted = cell.text;
            switch (format) {
              case 'percent':
                formatted = `${(num * 100).toFixed(2)}%`;
                break;
              case 'currency':
                formatted = `¥${num.toFixed(2)}`;
                break;
              case 'date':
                // Excel 日期序列号转换
                if (num > 0) {
                  const date = new Date((num - 25569) * 86400 * 1000);
                  formatted = date.toLocaleDateString('zh-CN');
                }
                break;
            }
            td.textContent = formatted;
          }
        }
      }
    }
  }

  /**
   * 合并选中的单元格
   */
  mergeSelectedCells(): void {
    const bounds = this.selectionManager.getSelectionBounds();
    if (bounds) {
      this.mergeCells(bounds);
    }
  }

  /**
   * 插入链接
   */
  insertLink(url: string): void {
    const activeCell = this.selectionManager.getActiveCell();
    const td = this.cellElements.get(this.formatAddress(activeCell.row, activeCell.col));
    if (td) {
      const link = document.createElement('a');
      link.href = url;
      link.textContent = td.textContent || url;
      link.target = '_blank';
      link.style.color = '#1a73e8';
      td.textContent = '';
      td.appendChild(link);
    }
  }

  /**
   * 插入图片
   */
  insertImage(dataUrl: string): void {
    const activeCell = this.selectionManager.getActiveCell();
    const td = this.cellElements.get(this.formatAddress(activeCell.row, activeCell.col));
    if (td) {
      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100px';
      td.textContent = '';
      td.appendChild(img);
    }
  }

  /**
   * 插入批注
   */
  insertComment(): void {
    const comment = prompt('请输入批注内容:');
    if (!comment) return;

    const activeCell = this.selectionManager.getActiveCell();
    const td = this.cellElements.get(this.formatAddress(activeCell.row, activeCell.col));
    if (td) {
      td.title = comment;
      // 添加批注标记
      const marker = document.createElement('div');
      marker.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-top: 6px solid #ff6b6b;
      `;
      td.style.position = 'relative';
      td.appendChild(marker);
    }
  }

  /**
   * 切换筛选
   */
  toggleFilter(): void {
    const bounds = this.selectionManager.getSelectionBounds();
    if (!bounds) return;

    // 在第一行添加筛选下拉按钮
    for (let col = bounds.start.col; col <= Math.min(bounds.end.col, 100); col++) {
      const td = this.cellElements.get(this.formatAddress(bounds.start.row, col));
      if (td) {
        const existingFilter = td.querySelector('.filter-btn');
        if (existingFilter) {
          existingFilter.remove();
        } else {
          const filterBtn = document.createElement('span');
          filterBtn.className = 'filter-btn';
          filterBtn.innerHTML = '▼';
          filterBtn.style.cssText = `
            position: absolute;
            right: 2px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 10px;
            color: #666;
            cursor: pointer;
          `;
          filterBtn.onclick = (e) => {
            e.stopPropagation();
            this.showFilterMenu(col, filterBtn);
          };
          td.style.position = 'relative';
          td.appendChild(filterBtn);
        }
      }
    }
  }

  private showFilterMenu(col: number, anchor: HTMLElement): void {
    // 简单的筛选菜单
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 8px;
      z-index: 1000;
      min-width: 150px;
    `;
    menu.innerHTML = `
      <div style="padding: 4px 8px; cursor: pointer; border-radius: 4px;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background=''">升序排列</div>
      <div style="padding: 4px 8px; cursor: pointer; border-radius: 4px;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background=''">降序排列</div>
      <div style="height: 1px; background: #e0e0e0; margin: 4px 0;"></div>
      <div style="padding: 4px 8px; cursor: pointer; border-radius: 4px;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background=''">清除筛选</div>
    `;

    anchor.parentElement?.appendChild(menu);

    // 点击外部关闭
    const closeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  }

  /**
   * 显示排序对话框
   */
  showSortDialog(): void {
    const bounds = this.selectionManager.getSelectionBounds();
    if (!bounds) return;

    const order = confirm('点击"确定"升序排列，点击"取消"降序排列') ? 'asc' : 'desc';
    this.sortRange(bounds, order);
  }
}
