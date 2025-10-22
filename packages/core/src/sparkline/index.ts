/**
 * 迷你图 (Sparkline) 系统
 * 在单元格中渲染小型图表
 */

import { logger } from '../errors';
import type { SparklineConfig } from '../types';

/**
 * 迷你图类型
 */
export enum SparklineType {
  LINE = 'line',
  COLUMN = 'column',
  WIN_LOSS = 'winloss',
}

/**
 * 迷你图数据点
 */
export interface SparklineDataPoint {
  value: number;
  index: number;
}

/**
 * 迷你图渲染选项
 */
export interface SparklineRenderOptions {
  width: number;
  height: number;
  color: string;
  negativeColor?: string;
  highColor?: string;
  lowColor?: string;
  firstColor?: string;
  lastColor?: string;
  showPoints?: boolean;
  lineWidth?: number;
}

/**
 * 迷你图渲染器
 */
export class SparklineRenderer {
  /**
   * 渲染到 Canvas
   */
  render(
    canvas: HTMLCanvasElement,
    data: number[],
    type: SparklineType,
    options: SparklineRenderOptions
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // 设置画布大小
    canvas.width = options.width;
    canvas.height = options.height;

    // 清空画布
    ctx.clearRect(0, 0, options.width, options.height);

    // 根据类型渲染
    switch (type) {
      case SparklineType.LINE:
        this.renderLine(ctx, data, options);
        break;
      case SparklineType.COLUMN:
        this.renderColumn(ctx, data, options);
        break;
      case SparklineType.WIN_LOSS:
        this.renderWinLoss(ctx, data, options);
        break;
    }

    logger.debug('Sparkline rendered', { type, dataPoints: data.length });
  }

  /**
   * 渲染线形图
   */
  private renderLine(
    ctx: CanvasRenderingContext2D,
    data: number[],
    options: SparklineRenderOptions
  ): void {
    if (data.length === 0) return;

    const { width, height, color, lineWidth = 2 } = options;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const xStep = width / (data.length - 1 || 1);
    const padding = lineWidth;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = index * xStep;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // 绘制特殊点
    if (options.showPoints) {
      this.renderPoints(ctx, data, options, xStep, min, range, padding);
    }
  }

  /**
   * 渲染点
   */
  private renderPoints(
    ctx: CanvasRenderingContext2D,
    data: number[],
    options: SparklineRenderOptions,
    xStep: number,
    min: number,
    range: number,
    padding: number
  ): void {
    const { width, height } = options;
    const maxIndex = data.indexOf(Math.max(...data));
    const minIndex = data.indexOf(Math.min(...data));

    data.forEach((value, index) => {
      const x = index * xStep;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);

      // 设置颜色
      if (index === 0 && options.firstColor) {
        ctx.fillStyle = options.firstColor;
      } else if (index === data.length - 1 && options.lastColor) {
        ctx.fillStyle = options.lastColor;
      } else if (index === maxIndex && options.highColor) {
        ctx.fillStyle = options.highColor;
      } else if (index === minIndex && options.lowColor) {
        ctx.fillStyle = options.lowColor;
      } else {
        ctx.fillStyle = options.color;
      }

      ctx.fill();
    });
  }

  /**
   * 渲染柱形图
   */
  private renderColumn(
    ctx: CanvasRenderingContext2D,
    data: number[],
    options: SparklineRenderOptions
  ): void {
    if (data.length === 0) return;

    const { width, height, color, negativeColor } = options;
    const min = Math.min(...data, 0);
    const max = Math.max(...data, 0);
    const range = max - min || 1;
    const barWidth = width / data.length;
    const zeroY = height - ((0 - min) / range) * height;

    data.forEach((value, index) => {
      const x = index * barWidth;
      const barHeight = Math.abs((value / range) * height);
      const y = value >= 0 ? zeroY - barHeight : zeroY;

      ctx.fillStyle = value >= 0 ? color : (negativeColor || color);
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
  }

  /**
   * 渲染盈亏图
   */
  private renderWinLoss(
    ctx: CanvasRenderingContext2D,
    data: number[],
    options: SparklineRenderOptions
  ): void {
    const { width, height, color, negativeColor } = options;
    const barWidth = width / data.length;
    const barHeight = height / 2;

    data.forEach((value, index) => {
      const x = index * barWidth;
      const y = value >= 0 ? 0 : barHeight;

      ctx.fillStyle = value >= 0 ? color : (negativeColor || color);
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
  }

  /**
   * 渲染为 SVG
   */
  renderSVG(data: number[], type: SparklineType, options: SparklineRenderOptions): string {
    const { width, height, color } = options;
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

    if (type === SparklineType.LINE) {
      svg += this.generateLineSVG(data, options);
    } else if (type === SparklineType.COLUMN) {
      svg += this.generateColumnSVG(data, options);
    } else if (type === SparklineType.WIN_LOSS) {
      svg += this.generateWinLossSVG(data, options);
    }

    svg += '</svg>';

    return svg;
  }

  /**
   * 生成线形 SVG
   */
  private generateLineSVG(data: number[], options: SparklineRenderOptions): string {
    if (data.length === 0) return '';

    const { width, height, color, lineWidth = 2 } = options;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const xStep = width / (data.length - 1 || 1);

    const points = data.map((value, index) => {
      const x = index * xStep;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });

    return `<polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="${lineWidth}" />`;
  }

  /**
   * 生成柱形 SVG
   */
  private generateColumnSVG(data: number[], options: SparklineRenderOptions): string {
    const { width, height, color, negativeColor } = options;
    const min = Math.min(...data, 0);
    const max = Math.max(...data, 0);
    const range = max - min || 1;
    const barWidth = width / data.length;
    const zeroY = height - ((0 - min) / range) * height;

    let svg = '';

    data.forEach((value, index) => {
      const x = index * barWidth;
      const barHeight = Math.abs((value / range) * height);
      const y = value >= 0 ? zeroY - barHeight : zeroY;
      const fillColor = value >= 0 ? color : (negativeColor || color);

      svg += `<rect x="${x}" y="${y}" width="${barWidth - 1}" height="${barHeight}" fill="${fillColor}" />`;
    });

    return svg;
  }

  /**
   * 生成盈亏 SVG
   */
  private generateWinLossSVG(data: number[], options: SparklineRenderOptions): string {
    const { width, height, color, negativeColor } = options;
    const barWidth = width / data.length;
    const barHeight = height / 2;

    let svg = '';

    data.forEach((value, index) => {
      const x = index * barWidth;
      const y = value >= 0 ? 0 : barHeight;
      const fillColor = value >= 0 ? color : (negativeColor || color);

      svg += `<rect x="${x}" y="${y}" width="${barWidth - 1}" height="${barHeight}" fill="${fillColor}" />`;
    });

    return svg;
  }
}

/**
 * 迷你图管理器
 */
export class SparklineManager {
  private sparklines: Map<string, SparklineConfig> = new Map();
  private renderer: SparklineRenderer;

  constructor() {
    this.renderer = new SparklineRenderer();
    logger.info('Sparkline manager initialized');
  }

  /**
   * 添加迷你图
   */
  addSparkline(cellRef: string, config: SparklineConfig): void {
    this.sparklines.set(cellRef, config);
    logger.debug('Sparkline added', { cellRef, type: config.type });
  }

  /**
   * 移除迷你图
   */
  removeSparkline(cellRef: string): boolean {
    return this.sparklines.delete(cellRef);
  }

  /**
   * 获取迷你图配置
   */
  getSparkline(cellRef: string): SparklineConfig | undefined {
    return this.sparklines.get(cellRef);
  }

  /**
   * 渲染迷你图
   */
  render(cellRef: string, canvas: HTMLCanvasElement, data: number[]): void {
    const config = this.sparklines.get(cellRef);

    if (!config) {
      logger.warn('Sparkline config not found', { cellRef });
      return;
    }

    const options: SparklineRenderOptions = {
      width: config.width || canvas.width,
      height: config.height || canvas.height,
      color: config.color || '#4472C4',
      negativeColor: config.negativeColor,
      highColor: config.highColor,
      lowColor: config.lowColor,
    };

    this.renderer.render(canvas, data, config.type as SparklineType, options);
  }

  /**
   * 渲染为 SVG
   */
  renderSVG(cellRef: string, data: number[]): string | null {
    const config = this.sparklines.get(cellRef);

    if (!config) {
      return null;
    }

    const options: SparklineRenderOptions = {
      width: config.width || 100,
      height: config.height || 30,
      color: config.color || '#4472C4',
      negativeColor: config.negativeColor,
      highColor: config.highColor,
      lowColor: config.lowColor,
    };

    return this.renderer.renderSVG(data, config.type as SparklineType, options);
  }

  /**
   * 获取所有迷你图
   */
  getAllSparklines(): Map<string, SparklineConfig> {
    return new Map(this.sparklines);
  }

  /**
   * 清空所有迷你图
   */
  clear(): void {
    this.sparklines.clear();
    logger.info('All sparklines cleared');
  }
}

