/**
 * 虚拟滚动系统
 * 只渲染可视区域的单元格,提升大数据量的性能
 */

import { logger } from '../errors';
import { throttle } from '../utils/memory';
import type { VirtualScrollConfig } from '../types';

/**
 * 可视区域
 */
export interface ViewportInfo {
  /** 起始行 */
  startRow: number;
  /** 结束行 */
  endRow: number;
  /** 起始列 */
  startCol: number;
  /** 结束列 */
  endCol: number;
  /** 可见行数 */
  visibleRows: number;
  /** 可见列数 */
  visibleCols: number;
}

/**
 * 滚动状态
 */
export interface ScrollState {
  /** 滚动位置 X */
  scrollX: number;
  /** 滚动位置 Y */
  scrollY: number;
  /** 容器宽度 */
  containerWidth: number;
  /** 容器高度 */
  containerHeight: number;
}

/**
 * 虚拟滚动管理器
 */
export class VirtualScrollManager {
  private config: Required<VirtualScrollConfig>;
  private rowHeights: Map<number, number> = new Map();
  private colWidths: Map<number, number> = new Map();
  private totalRows = 0;
  private totalCols = 0;
  private defaultRowHeight = 25;
  private defaultColWidth = 100;
  private viewport: ViewportInfo | null = null;
  private scrollState: ScrollState = {
    scrollX: 0,
    scrollY: 0,
    containerWidth: 0,
    containerHeight: 0,
  };
  private onViewportChange?: (viewport: ViewportInfo) => void;

  constructor(config?: VirtualScrollConfig) {
    this.config = {
      enabled: config?.enabled !== false,
      bufferSize: config?.bufferSize || 5,
      threshold: config?.threshold || 1000,
      estimateRowHeight: config?.estimateRowHeight || (() => this.defaultRowHeight),
      estimateColWidth: config?.estimateColWidth || (() => this.defaultColWidth),
    };

    logger.info('Virtual scroll manager initialized', {
      enabled: this.config.enabled,
      bufferSize: this.config.bufferSize,
      threshold: this.config.threshold,
    });
  }

  /**
   * 初始化
   */
  initialize(totalRows: number, totalCols: number): void {
    this.totalRows = totalRows;
    this.totalCols = totalCols;
    logger.debug('Virtual scroll initialized', { totalRows, totalCols });
  }

  /**
   * 设置行高
   */
  setRowHeight(row: number, height: number): void {
    this.rowHeights.set(row, height);
  }

  /**
   * 设置列宽
   */
  setColWidth(col: number, width: number): void {
    this.colWidths.set(col, width);
  }

  /**
   * 批量设置行高
   */
  setRowHeights(heights: Map<number, number>): void {
    heights.forEach((height, row) => {
      this.rowHeights.set(row, height);
    });
  }

  /**
   * 批量设置列宽
   */
  setColWidths(widths: Map<number, number>): void {
    widths.forEach((width, col) => {
      this.colWidths.set(col, width);
    });
  }

  /**
   * 获取行高
   */
  getRowHeight(row: number): number {
    return this.rowHeights.get(row) || this.config.estimateRowHeight(row);
  }

  /**
   * 获取列宽
   */
  getColWidth(col: number): number {
    return this.colWidths.get(col) || this.config.estimateColWidth(col);
  }

  /**
   * 更新滚动状态
   */
  updateScrollState(state: Partial<ScrollState>): void {
    this.scrollState = {
      ...this.scrollState,
      ...state,
    };

    // 计算新的可视区域
    this.calculateViewport();
  }

  /**
   * 计算可视区域
   */
  private calculateViewport(): void {
    if (!this.config.enabled || this.totalRows < this.config.threshold) {
      // 不启用虚拟滚动
      this.viewport = {
        startRow: 0,
        endRow: this.totalRows - 1,
        startCol: 0,
        endCol: this.totalCols - 1,
        visibleRows: this.totalRows,
        visibleCols: this.totalCols,
      };
      return;
    }

    const { scrollY, scrollX, containerHeight, containerWidth } = this.scrollState;
    const { bufferSize } = this.config;

    // 计算可见的行范围
    let startRow = 0;
    let accumulatedHeight = 0;

    for (let row = 0; row < this.totalRows; row++) {
      const height = this.getRowHeight(row);
      if (accumulatedHeight + height > scrollY) {
        startRow = Math.max(0, row - bufferSize);
        break;
      }
      accumulatedHeight += height;
    }

    let endRow = startRow;
    accumulatedHeight = 0;

    for (let row = startRow; row < this.totalRows; row++) {
      const height = this.getRowHeight(row);
      accumulatedHeight += height;
      if (accumulatedHeight > containerHeight + scrollY - this.getRowOffset(startRow)) {
        endRow = Math.min(this.totalRows - 1, row + bufferSize);
        break;
      }
    }

    // 计算可见的列范围
    let startCol = 0;
    let accumulatedWidth = 0;

    for (let col = 0; col < this.totalCols; col++) {
      const width = this.getColWidth(col);
      if (accumulatedWidth + width > scrollX) {
        startCol = Math.max(0, col - bufferSize);
        break;
      }
      accumulatedWidth += width;
    }

    let endCol = startCol;
    accumulatedWidth = 0;

    for (let col = startCol; col < this.totalCols; col++) {
      const width = this.getColWidth(col);
      accumulatedWidth += width;
      if (accumulatedWidth > containerWidth + scrollX - this.getColOffset(startCol)) {
        endCol = Math.min(this.totalCols - 1, col + bufferSize);
        break;
      }
    }

    const newViewport: ViewportInfo = {
      startRow,
      endRow,
      startCol,
      endCol,
      visibleRows: endRow - startRow + 1,
      visibleCols: endCol - startCol + 1,
    };

    // 检查是否变化
    if (!this.viewportEquals(newViewport, this.viewport)) {
      this.viewport = newViewport;

      logger.debug('Viewport updated', newViewport);

      // 触发回调
      if (this.onViewportChange) {
        this.onViewportChange(newViewport);
      }
    }
  }

  /**
   * 判断视口是否相等
   */
  private viewportEquals(v1: ViewportInfo | null, v2: ViewportInfo | null): boolean {
    if (!v1 || !v2) return false;
    return (
      v1.startRow === v2.startRow &&
      v1.endRow === v2.endRow &&
      v1.startCol === v2.startCol &&
      v1.endCol === v2.endCol
    );
  }

  /**
   * 获取行偏移量
   */
  getRowOffset(row: number): number {
    let offset = 0;
    for (let i = 0; i < row; i++) {
      offset += this.getRowHeight(i);
    }
    return offset;
  }

  /**
   * 获取列偏移量
   */
  getColOffset(col: number): number {
    let offset = 0;
    for (let i = 0; i < col; i++) {
      offset += this.getColWidth(i);
    }
    return offset;
  }

  /**
   * 计算总高度
   */
  getTotalHeight(): number {
    return this.getRowOffset(this.totalRows);
  }

  /**
   * 计算总宽度
   */
  getTotalWidth(): number {
    return this.getColOffset(this.totalCols);
  }

  /**
   * 获取当前视口
   */
  getViewport(): ViewportInfo | null {
    return this.viewport ? { ...this.viewport } : null;
  }

  /**
   * 监听视口变化
   */
  onViewportChanged(callback: (viewport: ViewportInfo) => void): void {
    this.onViewportChange = callback;
  }

  /**
   * 滚动到指定位置
   */
  scrollTo(row: number, col: number): { scrollX: number; scrollY: number } {
    const scrollY = this.getRowOffset(row);
    const scrollX = this.getColOffset(col);

    this.updateScrollState({ scrollY, scrollX });

    return { scrollX, scrollY };
  }

  /**
   * 滚动到顶部
   */
  scrollToTop(): void {
    this.updateScrollState({ scrollY: 0 });
  }

  /**
   * 滚动到底部
   */
  scrollToBottom(): void {
    const scrollY = this.getTotalHeight() - this.scrollState.containerHeight;
    this.updateScrollState({ scrollY: Math.max(0, scrollY) });
  }

  /**
   * 是否启用虚拟滚动
   */
  isEnabled(): boolean {
    return this.config.enabled && this.totalRows >= this.config.threshold;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalRows: number;
    totalCols: number;
    visibleRows: number;
    visibleCols: number;
    renderRatio: number;
    enabled: boolean;
  } {
    const viewport = this.viewport || {
      startRow: 0,
      endRow: this.totalRows - 1,
      startCol: 0,
      endCol: this.totalCols - 1,
      visibleRows: this.totalRows,
      visibleCols: this.totalCols,
    };

    const totalCells = this.totalRows * this.totalCols;
    const visibleCells = viewport.visibleRows * viewport.visibleCols;
    const renderRatio = totalCells > 0 ? visibleCells / totalCells : 0;

    return {
      totalRows: this.totalRows,
      totalCols: this.totalCols,
      visibleRows: viewport.visibleRows,
      visibleCols: viewport.visibleCols,
      renderRatio,
      enabled: this.isEnabled(),
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.rowHeights.clear();
    this.colWidths.clear();
    logger.debug('Virtual scroll cache cleared');
  }

  /**
   * 重置
   */
  reset(): void {
    this.clearCache();
    this.viewport = null;
    this.scrollState = {
      scrollX: 0,
      scrollY: 0,
      containerWidth: 0,
      containerHeight: 0,
    };
    logger.info('Virtual scroll reset');
  }
}


