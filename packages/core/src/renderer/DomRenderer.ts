/**
 * DOM 表格渲染器
 * 使用 HTML 表格渲染 Excel，提供更好的文字清晰度和合并单元格支持
 */
import type { Sheet, Cell, CellStyle } from '../types';

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
  zoom: 1.2,
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
  private selection: { startRow: number; startCol: number; endRow: number; endCol: number } | null = null;
  private activeCell: { row: number; col: number } | null = null;

  // 记录已渲染的合并单元格
  private renderedMerges: Set<string> = new Set();

  constructor(container: HTMLElement, options: Partial<DomRendererOptions> = {}) {
    this.container = container;
    this.options = { ...DEFAULT_OPTIONS, ...options };
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
  }

  setSheet(sheet: Sheet): void {
    this.sheet = sheet;
    this.renderedMerges.clear();
    this.render();
  }

  setZoom(zoom: number): void {
    this.options.zoom = zoom;
    // 使用 CSS transform 整体缩放
    if (this.table) {
      this.table.style.transform = `scale(${zoom})`;
      this.table.style.transformOrigin = 'top left';
    }
  }

  render(): void {
    if (!this.sheet || !this.tableContainer) return;

    // 清空容器
    this.tableContainer.innerHTML = '';
    this.renderedMerges.clear();

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
      transform: scale(${this.options.zoom});
      transform-origin: top left;
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
        th.style.cssText = `
          height: 24px;
          background: #f3f3f3;
          border: 1px solid #d0d0d0;
          font-weight: normal;
          color: #666;
          text-align: center;
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
        rowHeader.style.cssText = `
          min-width: 50px;
          background: #f3f3f3;
          border: 1px solid #d0d0d0;
          text-align: center;
          color: #666;
          position: sticky;
          left: 0;
          z-index: 5;
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

        // 添加点击事件
        td.addEventListener('click', () => {
          this.handleCellClick(row, col, cell);
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
    if (style?.fill && style.fill.pattern !== 'none') {
      const bgColor = this.resolveFillColor(style.fill);
      if (bgColor) {
        cssText += `background-color: ${bgColor};`;
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

    // 对于 solid 填充，使用 fgColor
    if (fill.pattern === 'solid' && fill.fgColor) {
      const color = this.resolveColor(fill.fgColor);
      // 避免黑色背景（通常是解析错误）
      if (color === '#000000' || color === '#000') {
        return null;
      }
      return color;
    }

    // 其他模式使用 bgColor
    if (fill.bgColor) {
      const color = this.resolveColor(fill.bgColor);
      if (color === '#000000' || color === '#000') {
        return null;
      }
      return color;
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
      // Excel 主题色 - 更准确的默认值
      const themeColors = [
        '#FFFFFF', '#000000', '#E7E6E6', '#44546A',
        '#4472C4', '#ED7D31', '#A5A5A5', '#FFC000',
        '#5B9BD5', '#70AD47'
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

  private handleCellClick(row: number, col: number, cell: Cell | undefined): void {
    this.activeCell = { row, col };
    this.selection = { startRow: row, startCol: col, endRow: row, endCol: col };

    // 触发事件（如果需要）
    const event = new CustomEvent('cellClick', {
      detail: { row, col, cell }
    });
    this.container.dispatchEvent(event);
  }

  setSelection(startRow: number, startCol: number, endRow: number, endCol: number): void {
    this.selection = {
      startRow: Math.min(startRow, endRow),
      startCol: Math.min(startCol, endCol),
      endRow: Math.max(startRow, endRow),
      endCol: Math.max(startCol, endCol)
    };
    // TODO: 高亮选中区域
  }

  destroy(): void {
    if (this.tableContainer) {
      this.tableContainer.remove();
      this.tableContainer = null;
    }
    this.table = null;
    this.sheet = null;
  }

  // 获取总尺寸
  getTotalWidth(): number {
    return this.table?.offsetWidth ?? 0;
  }

  getTotalHeight(): number {
    return this.table?.offsetHeight ?? 0;
  }
}
