/**
 * 图表系统
 * 提供图表创建、管理和渲染功能(不依赖外部库的基础实现)
 */

import { logger } from '../errors';
import type { ChartConfig } from '../types';

/**
 * 图表数据
 */
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

/**
 * 图表管理器
 */
export class ChartManager {
  private charts: Map<string, ChartConfig> = new Map();

  /**
   * 创建图表
   */
  createChart(id: string, config: ChartConfig): void {
    this.charts.set(id, config);
    logger.info('Chart created', { id, type: config.type });
  }

  /**
   * 删除图表
   */
  deleteChart(id: string): boolean {
    const deleted = this.charts.delete(id);
    if (deleted) {
      logger.info('Chart deleted', { id });
    }
    return deleted;
  }

  /**
   * 获取图表
   */
  getChart(id: string): ChartConfig | undefined {
    return this.charts.get(id);
  }

  /**
   * 提取图表数据
   */
  extractChartData(data: any[][], config: ChartConfig): ChartData {
    const { dataRange } = config;
    const chartData: ChartData = {
      labels: [],
      datasets: [],
    };

    // 提取标签 (第一列)
    for (let row = dataRange.startRow + 1; row <= dataRange.endRow; row++) {
      const label = String(data[row]?.[dataRange.startCol]?.v || '');
      chartData.labels.push(label);
    }

    // 提取数据集 (其他列)
    for (let col = dataRange.startCol + 1; col <= dataRange.endCol; col++) {
      const seriesName = String(data[dataRange.startRow]?.[col]?.v || `Series ${col}`);
      const seriesData: number[] = [];

      for (let row = dataRange.startRow + 1; row <= dataRange.endRow; row++) {
        const value = Number(data[row]?.[col]?.v || 0);
        seriesData.push(value);
      }

      chartData.datasets.push({
        label: seriesName,
        data: seriesData,
        color: config.colors?.[col - dataRange.startCol - 1],
      });
    }

    logger.debug('Chart data extracted', {
      labels: chartData.labels.length,
      datasets: chartData.datasets.length,
    });

    return chartData;
  }

  /**
   * 渲染简单图表到 Canvas
   */
  renderToCanvas(
    canvas: HTMLCanvasElement,
    chartData: ChartData,
    type: ChartConfig['type']
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (type) {
      case 'line':
        this.renderLineChart(ctx, canvas, chartData);
        break;
      case 'bar':
        this.renderBarChart(ctx, canvas, chartData);
        break;
      case 'pie':
        this.renderPieChart(ctx, canvas, chartData);
        break;
      default:
        logger.warn('Unsupported chart type', { type });
    }
  }

  /**
   * 渲染折线图
   */
  private renderLineChart(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    chartData: ChartData
  ): void {
    const padding = 40;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;

    // 找出最大值
    const allValues = chartData.datasets.flatMap((d) => d.data);
    const max = Math.max(...allValues);
    const min = Math.min(...allValues, 0);
    const range = max - min || 1;

    // 绘制坐标轴
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // 绘制数据
    const colors = ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5'];

    chartData.datasets.forEach((dataset, datasetIndex) => {
      const color = dataset.color || colors[datasetIndex % colors.length];
      const xStep = width / (dataset.data.length - 1 || 1);

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      dataset.data.forEach((value, index) => {
        const x = padding + index * xStep;
        const y = canvas.height - padding - ((value - min) / range) * height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    });
  }

  /**
   * 渲染柱状图
   */
  private renderBarChart(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    chartData: ChartData
  ): void {
    const padding = 40;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;

    const allValues = chartData.datasets.flatMap((d) => d.data);
    const max = Math.max(...allValues);
    const min = Math.min(...allValues, 0);
    const range = max - min || 1;

    const barWidth = width / chartData.labels.length / chartData.datasets.length;
    const colors = ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5'];

    chartData.datasets.forEach((dataset, datasetIndex) => {
      const color = dataset.color || colors[datasetIndex % colors.length];

      dataset.data.forEach((value, index) => {
        const x = padding + index * width / chartData.labels.length + datasetIndex * barWidth;
        const barHeight = Math.abs((value / range) * height);
        const y = canvas.height - padding - barHeight;

        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      });
    });
  }

  /**
   * 渲染饼图
   */
  private renderPieChart(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    chartData: ChartData
  ): void {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 40;

    // 只使用第一个数据集
    const dataset = chartData.datasets[0];
    if (!dataset) return;

    const total = dataset.data.reduce((a, b) => a + b, 0);
    const colors = ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47'];

    let currentAngle = -Math.PI / 2;

    dataset.data.forEach((value, index) => {
      const sliceAngle = (value / total) * Math.PI * 2;
      const color = colors[index % colors.length];

      // 绘制扇形
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // 绘制边框
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });
  }

  /**
   * 获取所有图表
   */
  getAllCharts(): Map<string, ChartConfig> {
    return new Map(this.charts);
  }

  /**
   * 清空所有图表
   */
  clear(): void {
    this.charts.clear();
    logger.info('All charts cleared');
  }
}

