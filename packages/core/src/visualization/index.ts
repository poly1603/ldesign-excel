/**
 * 数据可视化系统
 * 热力图、趋势分析等可视化功能
 */

import { logger } from '../errors';

/**
 * 热力图配置
 */
export interface HeatmapConfig {
  /** 数据范围 */
  range: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  };
  /** 颜色方案 */
  colorScheme?: {
    min: string;
    mid?: string;
    max: string;
  };
  /** 是否显示值 */
  showValues?: boolean;
  /** 最小值 */
  minValue?: number;
  /** 最大值 */
  maxValue?: number;
}

/**
 * 趋势分析结果
 */
export interface TrendAnalysis {
  /** 趋势方向 */
  direction: 'up' | 'down' | 'stable';
  /** 变化率 */
  changeRate: number;
  /** 线性回归系数 */
  slope: number;
  /** 相关系数 */
  correlation: number;
  /** 预测值 */
  forecast?: number[];
}

/**
 * 数据分布
 */
export interface DataDistribution {
  /** 最小值 */
  min: number;
  /** 最大值 */
  max: number;
  /** 平均值 */
  mean: number;
  /** 中位数 */
  median: number;
  /** 标准差 */
  stdDev: number;
  /** 四分位数 */
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
  /** 异常值 */
  outliers: number[];
}

/**
 * 热力图渲染器
 */
export class HeatmapRenderer {
  /**
   * 生成热力图颜色
   */
  getColor(value: number, min: number, max: number, colorScheme: HeatmapConfig['colorScheme']): string {
    const scheme = colorScheme || {
      min: '#63BE7B',
      mid: '#FFEB84',
      max: '#F8696B',
    };

    const range = max - min || 1;
    const ratio = (value - min) / range;

    if (scheme.mid) {
      // 三色渐变
      if (ratio < 0.5) {
        return this.interpolateColor(scheme.min, scheme.mid, ratio * 2);
      } else {
        return this.interpolateColor(scheme.mid, scheme.max, (ratio - 0.5) * 2);
      }
    } else {
      // 两色渐变
      return this.interpolateColor(scheme.min, scheme.max, ratio);
    }
  }

  /**
   * 颜色插值
   */
  private interpolateColor(color1: string, color2: string, ratio: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);

    const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
    const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
    const b = Math.round(c1.b + (c2.b - c1.b) * ratio);

    return this.rgbToHex(r, g, b);
  }

  /**
   * Hex 转 RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
      : { r: 0, g: 0, b: 0 };
  }

  /**
   * RGB 转 Hex
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  /**
   * 应用热力图
   */
  apply(data: any[][], config: HeatmapConfig): Map<string, string> {
    const colorMap = new Map<string, string>();
    const { range } = config;

    // 收集范围内的所有值
    const values: number[] = [];
    for (let row = range.startRow; row <= range.endRow; row++) {
      for (let col = range.startCol; col <= range.endCol; col++) {
        const value = Number(data[row]?.[col]?.v);
        if (!isNaN(value)) {
          values.push(value);
        }
      }
    }

    const min = config.minValue ?? Math.min(...values);
    const max = config.maxValue ?? Math.max(...values);

    // 为每个单元格生成颜色
    for (let row = range.startRow; row <= range.endRow; row++) {
      for (let col = range.startCol; col <= range.endCol; col++) {
        const value = Number(data[row]?.[col]?.v);
        if (!isNaN(value)) {
          const color = this.getColor(value, min, max, config.colorScheme);
          colorMap.set(`${row},${col}`, color);
        }
      }
    }

    logger.info('Heatmap applied', {
      cells: colorMap.size,
      min,
      max,
    });

    return colorMap;
  }
}

/**
 * 趋势分析器
 */
export class TrendAnalyzer {
  /**
   * 分析趋势
   */
  analyze(data: number[], options?: { forecastSteps?: number }): TrendAnalysis {
    if (data.length === 0) {
      throw new Error('No data to analyze');
    }

    // 计算线性回归
    const { slope, intercept } = this.linearRegression(data);

    // 计算相关系数
    const correlation = this.calculateCorrelation(data);

    // 判断趋势方向
    const direction = slope > 0.01 ? 'up' : slope < -0.01 ? 'down' : 'stable';

    // 计算变化率
    const first = data[0];
    const last = data[data.length - 1];
    const changeRate = first !== 0 ? ((last - first) / first) * 100 : 0;

    // 预测未来值
    let forecast: number[] | undefined;
    if (options?.forecastSteps) {
      forecast = [];
      for (let i = 1; i <= options.forecastSteps; i++) {
        const x = data.length + i - 1;
        forecast.push(slope * x + intercept);
      }
    }

    const analysis: TrendAnalysis = {
      direction,
      changeRate,
      slope,
      correlation,
      forecast,
    };

    logger.info('Trend analysis completed', {
      direction,
      changeRate: changeRate.toFixed(2) + '%',
    });

    return analysis;
  }

  /**
   * 线性回归
   */
  private linearRegression(data: number[]): { slope: number; intercept: number } {
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    data.forEach((y, x) => {
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * 计算相关系数
   */
  private calculateCorrelation(data: number[]): number {
    const n = data.length;
    const xValues = Array.from({ length: n }, (_, i) => i);

    const meanX = xValues.reduce((a, b) => a + b, 0) / n;
    const meanY = data.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const diffX = xValues[i] - meanX;
      const diffY = data[i] - meanY;

      numerator += diffX * diffY;
      denomX += diffX * diffX;
      denomY += diffY * diffY;
    }

    return numerator / Math.sqrt(denomX * denomY);
  }
}

/**
 * 数据分布分析器
 */
export class DistributionAnalyzer {
  /**
   * 分析数据分布
   */
  analyze(data: number[]): DataDistribution {
    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;

    // 基本统计
    const min = sorted[0];
    const max = sorted[n - 1];
    const mean = data.reduce((a, b) => a + b, 0) / n;

    // 中位数
    const median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

    // 标准差
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // 四分位数
    const q1 = this.percentile(sorted, 25);
    const q2 = median;
    const q3 = this.percentile(sorted, 75);

    // 检测异常值 (IQR 方法)
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliers = data.filter((v) => v < lowerBound || v > upperBound);

    const distribution: DataDistribution = {
      min,
      max,
      mean,
      median,
      stdDev,
      quartiles: { q1, q2, q3 },
      outliers,
    };

    logger.info('Distribution analysis completed', {
      mean: mean.toFixed(2),
      stdDev: stdDev.toFixed(2),
      outliers: outliers.length,
    });

    return distribution;
  }

  /**
   * 计算百分位数
   */
  private percentile(sorted: number[], p: number): number {
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}

/**
 * 可视化管理器
 */
export class VisualizationManager {
  private heatmapRenderer: HeatmapRenderer;
  private trendAnalyzer: TrendAnalyzer;
  private distributionAnalyzer: DistributionAnalyzer;

  constructor() {
    this.heatmapRenderer = new HeatmapRenderer();
    this.trendAnalyzer = new TrendAnalyzer();
    this.distributionAnalyzer = new DistributionAnalyzer();

    logger.info('Visualization manager initialized');
  }

  /**
   * 应用热力图
   */
  applyHeatmap(data: any[][], config: HeatmapConfig): Map<string, string> {
    return this.heatmapRenderer.apply(data, config);
  }

  /**
   * 分析趋势
   */
  analyzeTrend(data: number[], options?: { forecastSteps?: number }): TrendAnalysis {
    return this.trendAnalyzer.analyze(data, options);
  }

  /**
   * 分析分布
   */
  analyzeDistribution(data: number[]): DataDistribution {
    return this.distributionAnalyzer.analyze(data);
  }
}

