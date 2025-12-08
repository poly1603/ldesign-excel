/**
 * 工作表渲染器
 * @description 使用 Canvas 高性能渲染 Excel 工作表
 */
import type {
  Sheet,
  Cell,
  Row,
  Column,
  CellStyle,
  MergeCell,
  FreezePane,
  RenderOptions,
  RenderTheme,
  Color
} from '../types';
import { DEFAULT_RENDER_OPTIONS, RENDER_THEMES } from '../types';
import { ColorUtils } from '../utils/ColorUtils';
import { FormatUtils } from '../utils/FormatUtils';

/**
 * 视口信息
 */
export interface Viewport {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  scrollLeft: number;
  scrollTop: number;
}

/**
 * 渲染上下文
 */
interface RenderContext {
  ctx: CanvasRenderingContext2D;
  dpr: number;
  width: number;
  height: number;
  theme: RenderTheme;
  options: Required<RenderOptions>;
  viewport: Viewport;
  rowPositions: number[];
  colPositions: number[];
  frozenRowsHeight: number;
  frozenColsWidth: number;
}

/**
 * 单元格边界
 */
interface CellBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 工作表渲染器
 */
export class SheetRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number = 1;
  private sheet: Sheet | null = null;
  private options: Required<RenderOptions>;
  private theme: RenderTheme;

  // 缓存
  private rowHeights: Map<number, number> = new Map();
  private colWidths: Map<number, number> = new Map();
  private rowPositions: number[] = [];
  private colPositions: number[] = [];
  private totalWidth: number = 0;
  private totalHeight: number = 0;

  // 视口
  private viewport: Viewport = {
    startRow: 0,
    endRow: 0,
    startCol: 0,
    endCol: 0,
    scrollLeft: 0,
    scrollTop: 0
  };

  // 选区
  private selection: { startRow: number; startCol: number; endRow: number; endCol: number } | null = null;
  private activeCell: { row: number; col: number } | null = null;

  // 悬停
  private hoverCell: { row: number; col: number } | null = null;

  // 主题颜色缓存
  private themeColors: Map<number, string> = new Map();

  constructor(canvas: HTMLCanvasElement, options: Partial<RenderOptions> = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取 Canvas 2D 上下文');
    }
    this.ctx = ctx;

    this.options = { ...DEFAULT_RENDER_OPTIONS, ...options } as Required<RenderOptions>;
    this.theme = this.resolveTheme(this.options.theme);

    this.initCanvas();
  }

  /**
   * 解析主题
   */
  private resolveTheme(theme: RenderTheme | string): RenderTheme {
    if (typeof theme === 'string') {
      return RENDER_THEMES[theme] || RENDER_THEMES.excel;
    }
    return theme;
  }

  /**
   * 初始化画布
   */
  private initCanvas(): void {
    this.dpr = window.devicePixelRatio || 1;
    this.resizeCanvas();
  }

  /**
   * 调整画布大小
   */
  resizeCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // 获取设备像素比
    this.dpr = window.devicePixelRatio || 1;

    // 设置 canvas 的实际像素尺寸
    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);

    // 设置 canvas 的 CSS 显示尺寸
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // 重置变换矩阵并应用设备像素比缩放
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.textBaseline = 'middle';

    // 启用高质量图像平滑（用于缩放等）
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /**
   * 设置工作表
   */
  setSheet(sheet: Sheet): void {
    this.sheet = sheet;
    this.calculateDimensions();
  }

  /**
   * 更新选项
   */
  updateOptions(options: Partial<RenderOptions>): void {
    this.options = { ...this.options, ...options } as Required<RenderOptions>;
    if (options.theme) {
      this.theme = this.resolveTheme(options.theme);
    }
    if (this.sheet) {
      this.calculateDimensions();
    }
  }

  /**
   * 计算尺寸
   */
  private calculateDimensions(): void {
    if (!this.sheet) return;

    const { defaultRowHeight, defaultColWidth, zoom } = this.options;
    const zoomFactor = zoom;

    this.rowHeights.clear();
    this.colWidths.clear();
    this.rowPositions = [];
    this.colPositions = [];

    // 计算行高 - 如果没有 dimension，从实际 cells 计算
    let maxRow = this.sheet.dimension?.end.row ?? 0;
    let maxCol = this.sheet.dimension?.end.col ?? 0;

    // 遍历所有单元格找到实际的最大范围
    this.sheet.cells.forEach((cell) => {
      if (cell.row > maxRow) maxRow = cell.row;
      if (cell.col > maxCol) maxCol = cell.col;
    });

    // 至少显示一定数量的行列
    maxRow = Math.max(maxRow, 50);
    maxCol = Math.max(maxCol, 20);

    console.log('[SheetRenderer] dimension:', this.sheet.dimension, 'calculated maxRow:', maxRow, 'maxCol:', maxCol);

    let y = this.options.colHeaderHeight * zoomFactor;

    for (let i = 0; i <= maxRow; i++) {
      this.rowPositions.push(y);
      const row = this.sheet.rows.get(i);
      let height = (row?.height ?? defaultRowHeight) * zoomFactor;
      if (row?.hidden) height = 0;
      this.rowHeights.set(i, height);
      y += height;
    }
    this.rowPositions.push(y);
    this.totalHeight = y;

    // 计算列宽 - 使用上面已计算的 maxCol
    let x = this.options.rowHeaderWidth * zoomFactor;

    for (let i = 0; i <= maxCol; i++) {
      this.colPositions.push(x);
      const col = this.sheet.columns.get(i);
      let width = (col?.pixelWidth ?? defaultColWidth) * zoomFactor;
      if (col?.hidden) width = 0;
      this.colWidths.set(i, width);
      x += width;
    }
    this.colPositions.push(x);
    this.totalWidth = x;
  }

  /**
   * 设置视口
   */
  setViewport(scrollLeft: number, scrollTop: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const viewWidth = rect.width;
    const viewHeight = rect.height;
    const { rowHeaderWidth, colHeaderHeight, zoom } = this.options;
    const zoomFactor = zoom;

    // 确保尺寸已计算
    if (this.rowPositions.length === 0 || this.colPositions.length === 0) {
      this.calculateDimensions();
    }

    const maxRowIndex = Math.max(0, this.rowPositions.length - 2);
    const maxColIndex = Math.max(0, this.colPositions.length - 2);

    // 计算可见行范围
    const frozenRows = this.sheet?.freezePane?.rows ?? 0;
    const frozenCols = this.sheet?.freezePane?.cols ?? 0;

    let frozenRowsHeight = 0;
    for (let i = 0; i < frozenRows; i++) {
      frozenRowsHeight += this.rowHeights.get(i) ?? this.options.defaultRowHeight * zoomFactor;
    }

    let frozenColsWidth = 0;
    for (let i = 0; i < frozenCols; i++) {
      frozenColsWidth += this.colWidths.get(i) ?? this.options.defaultColWidth * zoomFactor;
    }

    const headerHeight = colHeaderHeight * zoomFactor;
    const headerWidth = rowHeaderWidth * zoomFactor;

    // 找起始行
    let startRow = frozenRows;
    const scrollableTop = headerHeight + frozenRowsHeight;
    for (let i = frozenRows; i <= maxRowIndex; i++) {
      if (this.rowPositions[i] - (this.rowPositions[frozenRows] ?? 0) >= scrollTop) {
        startRow = Math.max(frozenRows, i - 1);
        break;
      }
    }

    // 找结束行
    let endRow = startRow;
    const viewBottom = scrollTop + viewHeight - scrollableTop;
    for (let i = startRow; i <= maxRowIndex; i++) {
      endRow = i;
      if (i + 1 < this.rowPositions.length &&
        this.rowPositions[i + 1] - this.rowPositions[frozenRows] > viewBottom) {
        break;
      }
    }
    endRow = Math.min(endRow + this.options.overscanRowCount, maxRowIndex);

    // 找起始列
    let startCol = frozenCols;
    for (let i = frozenCols; i <= maxColIndex; i++) {
      if (this.colPositions[i] - this.colPositions[frozenCols] >= scrollLeft) {
        startCol = Math.max(frozenCols, i - 1);
        break;
      }
    }

    // 找结束列
    let endCol = startCol;
    const viewRight = scrollLeft + viewWidth - headerWidth - frozenColsWidth;
    for (let i = startCol; i <= maxColIndex; i++) {
      endCol = i;
      if (i + 1 < this.colPositions.length &&
        this.colPositions[i + 1] - this.colPositions[frozenCols] > viewRight) {
        break;
      }
    }
    endCol = Math.min(endCol + this.options.overscanColCount, maxColIndex);

    this.viewport = {
      startRow,
      endRow,
      startCol,
      endCol,
      scrollLeft,
      scrollTop
    };
  }

  /**
   * 设置选区
   */
  setSelection(
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ): void {
    this.selection = {
      startRow: Math.min(startRow, endRow),
      startCol: Math.min(startCol, endCol),
      endRow: Math.max(startRow, endRow),
      endCol: Math.max(startCol, endCol)
    };
    this.activeCell = { row: startRow, col: startCol };
  }

  /**
   * 清除选区
   */
  clearSelection(): void {
    this.selection = null;
    this.activeCell = null;
  }

  /**
   * 设置悬停单元格
   */
  setHoverCell(row: number, col: number): void {
    this.hoverCell = { row, col };
  }

  /**
   * 清除悬停
   */
  clearHoverCell(): void {
    this.hoverCell = null;
  }

  /**
   * 渲染
   */
  render(): void {
    if (!this.sheet) return;

    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // 确保每次渲染时重置变换矩阵
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const frozenRows = this.sheet.freezePane?.rows ?? 0;
    const frozenCols = this.sheet.freezePane?.cols ?? 0;
    const { zoom } = this.options;

    let frozenRowsHeight = 0;
    for (let i = 0; i < frozenRows; i++) {
      frozenRowsHeight += this.rowHeights.get(i) ?? this.options.defaultRowHeight * zoom;
    }

    let frozenColsWidth = 0;
    for (let i = 0; i < frozenCols; i++) {
      frozenColsWidth += this.colWidths.get(i) ?? this.options.defaultColWidth * zoom;
    }

    const renderCtx: RenderContext = {
      ctx: this.ctx,
      dpr: this.dpr,
      width,
      height,
      theme: this.theme,
      options: this.options,
      viewport: this.viewport,
      rowPositions: this.rowPositions,
      colPositions: this.colPositions,
      frozenRowsHeight,
      frozenColsWidth
    };

    // 清空画布（使用CSS尺寸，因为已经应用了dpr缩放）
    this.ctx.fillStyle = this.theme.backgroundColor;
    this.ctx.fillRect(0, 0, width, height);

    // 渲染主区域单元格
    this.renderCells(renderCtx, false, false);

    // 渲染冻结行
    if (frozenRows > 0) {
      this.renderCells(renderCtx, true, false);
    }

    // 渲染冻结列
    if (frozenCols > 0) {
      this.renderCells(renderCtx, false, true);
    }

    // 渲染冻结角落
    if (frozenRows > 0 && frozenCols > 0) {
      this.renderCells(renderCtx, true, true);
    }

    // 渲染网格线
    if (this.options.showGridLines) {
      this.renderGridLines(renderCtx);
    }

    // 渲染选区
    if (this.selection) {
      this.renderSelection(renderCtx);
    }

    // 渲染冻结线
    if (frozenRows > 0 || frozenCols > 0) {
      this.renderFreezeLines(renderCtx, frozenRows, frozenCols);
    }

    // 渲染行列标题
    if (this.options.showRowColHeaders) {
      this.renderHeaders(renderCtx);
    }
  }

  /**
   * 渲染单元格
   */
  private renderCells(
    renderCtx: RenderContext,
    isFrozenRow: boolean,
    isFrozenCol: boolean
  ): void {
    if (!this.sheet) return;

    const { ctx, viewport, options } = renderCtx;
    const { zoom, rowHeaderWidth, colHeaderHeight } = options;
    const headerWidth = rowHeaderWidth * zoom;
    const headerHeight = colHeaderHeight * zoom;

    const frozenRows = this.sheet.freezePane?.rows ?? 0;
    const frozenCols = this.sheet.freezePane?.cols ?? 0;

    // 确定渲染范围
    let startRow: number, endRow: number, startCol: number, endCol: number;

    if (isFrozenRow) {
      startRow = 0;
      endRow = frozenRows - 1;
    } else {
      startRow = viewport.startRow;
      endRow = viewport.endRow;
    }

    if (isFrozenCol) {
      startCol = 0;
      endCol = frozenCols - 1;
    } else {
      startCol = viewport.startCol;
      endCol = viewport.endCol;
    }

    // 设置剪切区域
    ctx.save();

    let clipX = headerWidth;
    let clipY = headerHeight;
    let clipWidth = renderCtx.width - headerWidth;
    let clipHeight = renderCtx.height - headerHeight;

    if (isFrozenCol) {
      clipWidth = renderCtx.frozenColsWidth;
    } else {
      clipX += renderCtx.frozenColsWidth;
      clipWidth -= renderCtx.frozenColsWidth;
    }

    if (isFrozenRow) {
      clipHeight = renderCtx.frozenRowsHeight;
    } else {
      clipY += renderCtx.frozenRowsHeight;
      clipHeight -= renderCtx.frozenRowsHeight;
    }

    ctx.beginPath();
    ctx.rect(clipX, clipY, clipWidth, clipHeight);
    ctx.clip();

    // 渲染合并单元格背景
    this.renderMergeCellBackgrounds(renderCtx, startRow, endRow, startCol, endCol, isFrozenRow, isFrozenCol);

    // 渲染单元格
    // 调试：打印一次单元格信息
    if (!isFrozenRow && !isFrozenCol && startRow === viewport.startRow) {
      console.log('[SheetRenderer] cells count:', this.sheet.cells.size);
      console.log('[SheetRenderer] rendering rows:', startRow, '-', endRow, 'cols:', startCol, '-', endCol);
      // 打印前几个单元格
      let count = 0;
      this.sheet.cells.forEach((cell, addr) => {
        if (count < 5) {
          console.log('[SheetRenderer] cell:', addr, '=', cell.text, 'value:', cell.value);
          count++;
        }
      });
    }

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const bounds = this.getCellBounds(renderCtx, row, col, isFrozenRow, isFrozenCol);
        if (bounds.width <= 0 || bounds.height <= 0) continue;

        const address = this.formatAddress(row, col);
        const cell = this.sheet.cells.get(address);

        // 检查是否被合并
        if (cell?.isMerged && !cell?.isMergeOrigin) {
          continue;
        }

        // 调整合并单元格边界
        let cellBounds = bounds;
        if (cell?.isMergeOrigin && cell.merge) {
          cellBounds = this.getMergeCellBounds(
            renderCtx,
            cell.merge.start.row,
            cell.merge.start.col,
            cell.merge.end.row,
            cell.merge.end.col,
            isFrozenRow,
            isFrozenCol
          );
        }

        this.renderCell(renderCtx, cell, cellBounds);
      }
    }

    ctx.restore();
  }

  /**
   * 渲染单个单元格
   */
  private renderCell(
    renderCtx: RenderContext,
    cell: Cell | undefined,
    bounds: CellBounds
  ): void {
    const { ctx, theme, options } = renderCtx;
    const { cellPadding } = options;

    // 渲染背景
    if (cell?.style?.fill && cell.style.fill.pattern !== 'none') {
      const bgColor = this.resolveFillColor(cell.style.fill);
      if (bgColor) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      }
    }

    // 渲染文本
    if (cell && cell.text) {
      const style = cell.style;
      const font = style?.font;

      // 设置字体 - 使用整数字体大小以保持清晰
      const fontSize = Math.round((font?.size ?? options.defaultFontSize) * options.zoom);
      const fontFamily = font?.name ?? options.defaultFont;
      const fontWeight = font?.bold ? 'bold' : 'normal';
      const fontStyle = font?.italic ? 'italic' : 'normal';

      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", Arial, sans-serif`;
      ctx.textBaseline = 'middle';

      // 设置颜色
      if (font?.color) {
        ctx.fillStyle = this.resolveColor(font.color);
      } else {
        ctx.fillStyle = theme.defaultTextColor;
      }

      // 计算文本位置 - 使用像素对齐（取整）
      const textX = Math.round(bounds.x + cellPadding);
      const textY = Math.round(bounds.y + bounds.height / 2);
      const maxWidth = bounds.width - cellPadding * 2;

      // 对齐
      const alignment = style?.alignment;
      let x = textX;

      if (alignment?.horizontal === 'center') {
        ctx.textAlign = 'center';
        x = Math.round(bounds.x + bounds.width / 2);
      } else if (alignment?.horizontal === 'right') {
        ctx.textAlign = 'right';
        x = Math.round(bounds.x + bounds.width - cellPadding);
      } else {
        ctx.textAlign = 'left';
      }

      // 渲染文本
      const displayText = options.showFormulas && cell.formula
        ? `=${cell.formula.text}`
        : (cell.formattedValue ?? cell.text);

      ctx.fillText(displayText, x, textY, maxWidth);

      // 渲染下划线
      if (font?.underline && font.underline !== 'none') {
        const metrics = ctx.measureText(displayText);
        const textWidth = Math.min(metrics.width, maxWidth);
        let lineX = x;
        if (ctx.textAlign === 'center') {
          lineX = x - textWidth / 2;
        } else if (ctx.textAlign === 'right') {
          lineX = x - textWidth;
        }

        ctx.beginPath();
        ctx.moveTo(lineX, textY + fontSize / 2 + 1);
        ctx.lineTo(lineX + textWidth, textY + fontSize / 2 + 1);
        ctx.stroke();
      }

      // 渲染删除线
      if (font?.strikethrough) {
        const metrics = ctx.measureText(displayText);
        const textWidth = Math.min(metrics.width, maxWidth);
        let lineX = x;
        if (ctx.textAlign === 'center') {
          lineX = x - textWidth / 2;
        } else if (ctx.textAlign === 'right') {
          lineX = x - textWidth;
        }

        ctx.beginPath();
        ctx.moveTo(lineX, textY);
        ctx.lineTo(lineX + textWidth, textY);
        ctx.stroke();
      }

      // 重置对齐
      ctx.textAlign = 'left';
    }

    // 渲染边框
    if (cell?.style?.border) {
      this.renderCellBorder(ctx, bounds, cell.style.border);
    }
  }

  /**
   * 渲染单元格边框
   */
  private renderCellBorder(
    ctx: CanvasRenderingContext2D,
    bounds: CellBounds,
    border: CellStyle['border']
  ): void {
    if (!border) return;

    const drawBorderSide = (
      x1: number, y1: number, x2: number, y2: number,
      side: { style?: string; color?: Color } | undefined
    ) => {
      if (!side || side.style === 'none') return;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      if (side.color) {
        ctx.strokeStyle = this.resolveColor(side.color);
      } else {
        ctx.strokeStyle = '#000000';
      }

      // 设置线型
      switch (side.style) {
        case 'thin':
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
          break;
        case 'medium':
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          break;
        case 'thick':
          ctx.lineWidth = 3;
          ctx.setLineDash([]);
          break;
        case 'dashed':
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 2]);
          break;
        case 'dotted':
          ctx.lineWidth = 1;
          ctx.setLineDash([1, 1]);
          break;
        case 'double':
          ctx.lineWidth = 3;
          ctx.setLineDash([]);
          break;
        default:
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
      }

      ctx.stroke();
      ctx.setLineDash([]);
    };

    const { x, y, width, height } = bounds;

    drawBorderSide(x, y, x, y + height, border.left);
    drawBorderSide(x + width, y, x + width, y + height, border.right);
    drawBorderSide(x, y, x + width, y, border.top);
    drawBorderSide(x, y + height, x + width, y + height, border.bottom);
  }

  /**
   * 渲染合并单元格背景
   */
  private renderMergeCellBackgrounds(
    renderCtx: RenderContext,
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number,
    isFrozenRow: boolean,
    isFrozenCol: boolean
  ): void {
    if (!this.sheet) return;

    for (const merge of this.sheet.mergeCells) {
      // 检查合并区域是否与渲染范围重叠
      if (merge.endRow < startRow || merge.startRow > endRow) continue;
      if (merge.endCol < startCol || merge.startCol > endCol) continue;

      const bounds = this.getMergeCellBounds(
        renderCtx,
        merge.startRow,
        merge.startCol,
        merge.endRow,
        merge.endCol,
        isFrozenRow,
        isFrozenCol
      );

      const address = this.formatAddress(merge.startRow, merge.startCol);
      const cell = this.sheet.cells.get(address);

      if (cell?.style?.fill && cell.style.fill.pattern !== 'none') {
        const bgColor = this.resolveFillColor(cell.style.fill);
        if (bgColor) {
          renderCtx.ctx.fillStyle = bgColor;
          renderCtx.ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }
      }
    }
  }

  /**
   * 渲染网格线
   */
  private renderGridLines(renderCtx: RenderContext): void {
    const { ctx, theme, viewport, options, width, height } = renderCtx;
    const { rowHeaderWidth, colHeaderHeight, zoom } = options;
    const headerWidth = rowHeaderWidth * zoom;
    const headerHeight = colHeaderHeight * zoom;

    ctx.strokeStyle = theme.gridLineColor;
    ctx.lineWidth = 1;

    const frozenRows = this.sheet?.freezePane?.rows ?? 0;
    const frozenCols = this.sheet?.freezePane?.cols ?? 0;

    // 水平线
    ctx.beginPath();
    for (let row = 0; row <= viewport.endRow + 1; row++) {
      if (row < this.rowPositions.length) {
        let y: number;
        if (row < frozenRows) {
          y = this.rowPositions[row];
        } else {
          y = headerHeight + renderCtx.frozenRowsHeight +
            (this.rowPositions[row] - this.rowPositions[frozenRows]) - viewport.scrollTop;
        }

        if (y >= headerHeight && y <= height) {
          ctx.moveTo(headerWidth, y);
          ctx.lineTo(width, y);
        }
      }
    }
    ctx.stroke();

    // 垂直线
    ctx.beginPath();
    for (let col = 0; col <= viewport.endCol + 1; col++) {
      if (col < this.colPositions.length) {
        let x: number;
        if (col < frozenCols) {
          x = this.colPositions[col];
        } else {
          x = headerWidth + renderCtx.frozenColsWidth +
            (this.colPositions[col] - this.colPositions[frozenCols]) - viewport.scrollLeft;
        }

        if (x >= headerWidth && x <= width) {
          ctx.moveTo(x, headerHeight);
          ctx.lineTo(x, height);
        }
      }
    }
    ctx.stroke();
  }

  /**
   * 渲染选区
   */
  private renderSelection(renderCtx: RenderContext): void {
    if (!this.selection) return;

    const { ctx, theme } = renderCtx;
    const { startRow, startCol, endRow, endCol } = this.selection;

    // 获取选区边界
    const startBounds = this.getCellBounds(renderCtx, startRow, startCol, false, false);
    const endBounds = this.getCellBounds(renderCtx, endRow, endCol, false, false);

    const x = startBounds.x;
    const y = startBounds.y;
    const width = endBounds.x + endBounds.width - startBounds.x;
    const height = endBounds.y + endBounds.height - startBounds.y;

    // 绘制选区背景
    ctx.fillStyle = theme.selectionColor;
    ctx.fillRect(x, y, width, height);

    // 绘制选区边框
    ctx.strokeStyle = theme.selectionBorderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // 绘制活动单元格
    if (this.activeCell) {
      const activeBounds = this.getCellBounds(
        renderCtx,
        this.activeCell.row,
        this.activeCell.col,
        false,
        false
      );
      ctx.strokeStyle = theme.selectionBorderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(activeBounds.x, activeBounds.y, activeBounds.width, activeBounds.height);
    }
  }

  /**
   * 渲染冻结线
   */
  private renderFreezeLines(
    renderCtx: RenderContext,
    frozenRows: number,
    frozenCols: number
  ): void {
    const { ctx, theme, options, width, height } = renderCtx;
    const { rowHeaderWidth, colHeaderHeight, zoom } = options;
    const headerWidth = rowHeaderWidth * zoom;
    const headerHeight = colHeaderHeight * zoom;

    ctx.strokeStyle = theme.freezeLineColor;
    ctx.lineWidth = 2;

    // 水平冻结线
    if (frozenRows > 0 && this.rowPositions[frozenRows]) {
      const y = this.rowPositions[frozenRows];
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 垂直冻结线
    if (frozenCols > 0 && this.colPositions[frozenCols]) {
      const x = this.colPositions[frozenCols];
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  /**
   * 渲染行列标题
   */
  private renderHeaders(renderCtx: RenderContext): void {
    const { ctx, theme, viewport, options, width, height } = renderCtx;
    const { rowHeaderWidth, colHeaderHeight, zoom, defaultFontSize, defaultFont } = options;
    const headerWidth = rowHeaderWidth * zoom;
    const headerHeight = colHeaderHeight * zoom;
    const fontSize = Math.round(defaultFontSize * zoom * 0.9);

    const frozenRows = this.sheet?.freezePane?.rows ?? 0;
    const frozenCols = this.sheet?.freezePane?.cols ?? 0;

    // 设置字体 - 使用整数字体大小
    ctx.font = `${fontSize}px "${defaultFont}", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 列标题背景
    ctx.fillStyle = theme.headerBackgroundColor;
    ctx.fillRect(headerWidth, 0, width - headerWidth, headerHeight);

    // 列标题
    ctx.fillStyle = theme.headerTextColor;
    for (let col = 0; col <= viewport.endCol; col++) {
      if (col >= this.colPositions.length - 1) continue;

      let x: number;
      if (col < frozenCols) {
        x = this.colPositions[col];
      } else if (col >= viewport.startCol) {
        x = headerWidth + renderCtx.frozenColsWidth +
          (this.colPositions[col] - this.colPositions[frozenCols]) - viewport.scrollLeft;
      } else {
        continue;
      }

      const w = this.colWidths.get(col) ?? 0;
      if (w > 0 && x + w > headerWidth && x < width) {
        const label = this.getColumnLabel(col);
        ctx.fillText(label, Math.round(x + w / 2), Math.round(headerHeight / 2));
      }
    }

    // 行标题背景
    ctx.fillStyle = theme.headerBackgroundColor;
    ctx.fillRect(0, headerHeight, headerWidth, height - headerHeight);

    // 行标题
    ctx.fillStyle = theme.headerTextColor;
    for (let row = 0; row <= viewport.endRow; row++) {
      if (row >= this.rowPositions.length - 1) continue;

      let y: number;
      if (row < frozenRows) {
        y = this.rowPositions[row];
      } else if (row >= viewport.startRow) {
        y = headerHeight + renderCtx.frozenRowsHeight +
          (this.rowPositions[row] - this.rowPositions[frozenRows]) - viewport.scrollTop;
      } else {
        continue;
      }

      const h = this.rowHeights.get(row) ?? 0;
      if (h > 0 && y + h > headerHeight && y < height) {
        const label = String(row + 1);
        ctx.fillText(label, Math.round(headerWidth / 2), Math.round(y + h / 2));
      }
    }

    // 左上角
    ctx.fillStyle = theme.headerBackgroundColor;
    ctx.fillRect(0, 0, headerWidth, headerHeight);
    ctx.strokeStyle = theme.headerBorderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, headerWidth, headerHeight);

    // 标题边框
    ctx.strokeStyle = theme.headerBorderColor;
    ctx.beginPath();
    ctx.moveTo(headerWidth, 0);
    ctx.lineTo(headerWidth, height);
    ctx.moveTo(0, headerHeight);
    ctx.lineTo(width, headerHeight);
    ctx.stroke();
  }

  /**
   * 获取列标签 (A, B, ..., Z, AA, AB, ...)
   */
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

  /**
   * 获取单元格边界
   */
  private getCellBounds(
    renderCtx: RenderContext,
    row: number,
    col: number,
    isFrozenRow: boolean,
    isFrozenCol: boolean
  ): CellBounds {
    const { viewport, options } = renderCtx;
    const { rowHeaderWidth, colHeaderHeight, zoom } = options;
    const headerWidth = rowHeaderWidth * zoom;
    const headerHeight = colHeaderHeight * zoom;

    const frozenRows = this.sheet?.freezePane?.rows ?? 0;
    const frozenCols = this.sheet?.freezePane?.cols ?? 0;

    let x: number, y: number;

    if (isFrozenCol || col < frozenCols) {
      x = this.colPositions[col] ?? headerWidth;
    } else {
      x = headerWidth + renderCtx.frozenColsWidth +
        (this.colPositions[col] - this.colPositions[frozenCols]) - viewport.scrollLeft;
    }

    if (isFrozenRow || row < frozenRows) {
      y = this.rowPositions[row] ?? headerHeight;
    } else {
      y = headerHeight + renderCtx.frozenRowsHeight +
        (this.rowPositions[row] - this.rowPositions[frozenRows]) - viewport.scrollTop;
    }

    const width = this.colWidths.get(col) ?? 0;
    const height = this.rowHeights.get(row) ?? 0;

    return { x, y, width, height };
  }

  /**
   * 获取合并单元格边界
   */
  private getMergeCellBounds(
    renderCtx: RenderContext,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    isFrozenRow: boolean,
    isFrozenCol: boolean
  ): CellBounds {
    const startBounds = this.getCellBounds(renderCtx, startRow, startCol, isFrozenRow, isFrozenCol);
    const endBounds = this.getCellBounds(renderCtx, endRow, endCol, isFrozenRow, isFrozenCol);

    return {
      x: startBounds.x,
      y: startBounds.y,
      width: endBounds.x + endBounds.width - startBounds.x,
      height: endBounds.y + endBounds.height - startBounds.y
    };
  }

  /**
   * 格式化单元格地址
   */
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

  /**
   * 解析填充颜色
   */
  private resolveFillColor(fill: CellStyle['fill']): string | null {
    if (!fill) return null;

    if (fill.pattern === 'solid' && fill.fgColor) {
      return this.resolveColor(fill.fgColor);
    }

    return null;
  }

  /**
   * 解析颜色
   */
  private resolveColor(color: Color): string {
    if (color.rgb) {
      // ARGB 格式，取后 6 位
      const rgb = color.rgb.length === 8 ? color.rgb.substring(2) : color.rgb;
      return `#${rgb}`;
    }

    if (color.theme !== undefined) {
      return this.resolveThemeColor(color.theme, color.tint);
    }

    if (color.indexed !== undefined) {
      return ColorUtils.getIndexedColor(color.indexed);
    }

    if (color.auto) {
      return '#000000';
    }

    return '#000000';
  }

  /**
   * 解析主题颜色
   */
  private resolveThemeColor(themeIndex: number, tint?: number): string {
    const cacheKey = themeIndex * 1000 + (tint ? Math.round(tint * 100) : 0);

    if (this.themeColors.has(cacheKey)) {
      return this.themeColors.get(cacheKey)!;
    }

    // 默认主题颜色映射
    const themeColorMap: Record<number, string> = {
      0: 'FFFFFF', // lt1
      1: '000000', // dk1
      2: 'E7E6E6', // lt2
      3: '44546A', // dk2
      4: '4472C4', // accent1
      5: 'ED7D31', // accent2
      6: 'A5A5A5', // accent3
      7: 'FFC000', // accent4
      8: '5B9BD5', // accent5
      9: '70AD47', // accent6
      10: '0563C1', // hlink
      11: '954F72'  // folHlink
    };

    let baseColor = themeColorMap[themeIndex] || '000000';

    if (tint !== undefined && tint !== 0) {
      baseColor = ColorUtils.applyTint(baseColor, tint);
    }

    const result = `#${baseColor}`;
    this.themeColors.set(cacheKey, result);
    return result;
  }

  /**
   * 获取总宽度
   */
  getTotalWidth(): number {
    return this.totalWidth;
  }

  /**
   * 获取总高度
   */
  getTotalHeight(): number {
    return this.totalHeight;
  }

  /**
   * 根据坐标获取单元格
   */
  getCellAt(x: number, y: number): { row: number; col: number } | null {
    const { zoom, rowHeaderWidth, colHeaderHeight } = this.options;
    const headerWidth = rowHeaderWidth * zoom;
    const headerHeight = colHeaderHeight * zoom;

    if (x < headerWidth || y < headerHeight) {
      return null;
    }

    const frozenRows = this.sheet?.freezePane?.rows ?? 0;
    const frozenCols = this.sheet?.freezePane?.cols ?? 0;

    let frozenRowsHeight = 0;
    for (let i = 0; i < frozenRows; i++) {
      frozenRowsHeight += this.rowHeights.get(i) ?? this.options.defaultRowHeight * zoom;
    }

    let frozenColsWidth = 0;
    for (let i = 0; i < frozenCols; i++) {
      frozenColsWidth += this.colWidths.get(i) ?? this.options.defaultColWidth * zoom;
    }

    // 确定列
    let col = -1;
    if (x < headerWidth + frozenColsWidth) {
      // 在冻结列区域
      for (let i = 0; i < frozenCols; i++) {
        if (x < this.colPositions[i + 1]) {
          col = i;
          break;
        }
      }
    } else {
      // 在滚动区域
      const scrollX = x - headerWidth - frozenColsWidth + this.viewport.scrollLeft;
      for (let i = frozenCols; i < this.colPositions.length - 1; i++) {
        if (scrollX < this.colPositions[i + 1] - this.colPositions[frozenCols]) {
          col = i;
          break;
        }
      }
    }

    // 确定行
    let row = -1;
    if (y < headerHeight + frozenRowsHeight) {
      // 在冻结行区域
      for (let i = 0; i < frozenRows; i++) {
        if (y < this.rowPositions[i + 1]) {
          row = i;
          break;
        }
      }
    } else {
      // 在滚动区域
      const scrollY = y - headerHeight - frozenRowsHeight + this.viewport.scrollTop;
      for (let i = frozenRows; i < this.rowPositions.length - 1; i++) {
        if (scrollY < this.rowPositions[i + 1] - this.rowPositions[frozenRows]) {
          row = i;
          break;
        }
      }
    }

    if (row >= 0 && col >= 0) {
      return { row, col };
    }

    return null;
  }
}
