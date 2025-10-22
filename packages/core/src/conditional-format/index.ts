/**
 * 条件格式系统
 * 支持数据条、色阶、图标集等条件格式
 */

import { logger } from '../errors';
import type { CellStyle } from '../types';

/**
 * 条件格式类型
 */
export enum ConditionalFormatType {
  /** 单元格值 */
  CELL_VALUE = 'cell_value',
  /** 公式 */
  FORMULA = 'formula',
  /** 数据条 */
  DATA_BAR = 'data_bar',
  /** 色阶 */
  COLOR_SCALE = 'color_scale',
  /** 图标集 */
  ICON_SET = 'icon_set',
  /** 重复值 */
  DUPLICATE = 'duplicate',
  /** 唯一值 */
  UNIQUE = 'unique',
  /** 前N项 */
  TOP_N = 'top_n',
  /** 后N项 */
  BOTTOM_N = 'bottom_n',
  /** 高于平均值 */
  ABOVE_AVERAGE = 'above_average',
  /** 低于平均值 */
  BELOW_AVERAGE = 'below_average',
}

/**
 * 数据条配置
 */
export interface DataBarConfig {
  /** 最小值 */
  minValue?: number;
  /** 最大值 */
  maxValue?: number;
  /** 颜色 */
  color: string;
  /** 是否显示值 */
  showValue?: boolean;
  /** 方向 */
  direction?: 'ltr' | 'rtl';
}

/**
 * 色阶点
 */
export interface ColorScalePoint {
  /** 值 */
  value: number | 'min' | 'max' | 'percentile';
  /** 百分位(当 value 为 percentile 时) */
  percentile?: number;
  /** 颜色 */
  color: string;
}

/**
 * 色阶配置
 */
export interface ColorScaleConfig {
  /** 色阶点(2-3个) */
  points: ColorScalePoint[];
}

/**
 * 图标集类型
 */
export enum IconSetType {
  /** 三色箭头 */
  ARROWS_3 = 'arrows_3',
  /** 三色旗帜 */
  FLAGS_3 = 'flags_3',
  /** 三色交通灯 */
  TRAFFIC_LIGHTS_3 = 'traffic_lights_3',
  /** 四色箭头 */
  ARROWS_4 = 'arrows_4',
  /** 五色箭头 */
  ARROWS_5 = 'arrows_5',
  /** 五星评级 */
  RATING_5 = 'rating_5',
}

/**
 * 图标集配置
 */
export interface IconSetConfig {
  /** 图标集类型 */
  type: IconSetType;
  /** 是否反转图标顺序 */
  reverse?: boolean;
  /** 是否只显示图标 */
  iconOnly?: boolean;
}

/**
 * 条件格式规则
 */
export interface ConditionalFormatRule {
  /** 规则ID */
  id: string;
  /** 规则类型 */
  type: ConditionalFormatType;
  /** 应用范围(行列范围) */
  range: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  };
  /** 条件 */
  condition?: {
    operator?: 'greater_than' | 'less_than' | 'between' | 'equal' | 'not_equal';
    value1?: any;
    value2?: any;
    formula?: string;
  };
  /** 样式 */
  style?: CellStyle;
  /** 数据条配置 */
  dataBar?: DataBarConfig;
  /** 色阶配置 */
  colorScale?: ColorScaleConfig;
  /** 图标集配置 */
  iconSet?: IconSetConfig;
  /** 优先级 */
  priority?: number;
  /** 是否停止后续规则 */
  stopIfTrue?: boolean;
}

/**
 * 条件格式结果
 */
export interface ConditionalFormatResult {
  /** 单元格位置 */
  row: number;
  col: number;
  /** 应用的样式 */
  style?: CellStyle;
  /** 数据条值 */
  dataBarValue?: number;
  /** 色阶颜色 */
  colorScaleColor?: string;
  /** 图标 */
  icon?: string;
}

/**
 * 条件格式管理器
 */
export class ConditionalFormatManager {
  private rules: Map<string, ConditionalFormatRule> = new Map();

  /**
   * 添加规则
   */
  addRule(rule: ConditionalFormatRule): void {
    this.rules.set(rule.id, rule);
    logger.debug(`Conditional format rule added: ${rule.id}`);
  }

  /**
   * 删除规则
   */
  removeRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      logger.debug(`Conditional format rule removed: ${ruleId}`);
    }
    return deleted;
  }

  /**
   * 获取规则
   */
  getRule(ruleId: string): ConditionalFormatRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * 应用条件格式
   */
  apply(data: any[][]): Map<string, ConditionalFormatResult> {
    const results = new Map<string, ConditionalFormatResult>();

    // 按优先级排序规则
    const sortedRules = Array.from(this.rules.values()).sort(
      (a, b) => (a.priority || 0) - (b.priority || 0)
    );

    for (const rule of sortedRules) {
      this.applyRule(data, rule, results);
    }

    logger.info(`Applied ${this.rules.size} conditional format rules`);
    return results;
  }

  /**
   * 应用单个规则
   */
  private applyRule(
    data: any[][],
    rule: ConditionalFormatRule,
    results: Map<string, ConditionalFormatResult>
  ): void {
    const { range } = rule;

    for (let row = range.startRow; row <= range.endRow; row++) {
      for (let col = range.startCol; col <= range.endCol; col++) {
        const key = `${row},${col}`;

        // 如果已有结果且前一个规则设置了 stopIfTrue,跳过
        if (results.has(key)) {
          const existingResult = results.get(key);
          // 这里简化处理,实际应该检查前一个规则的 stopIfTrue
          continue;
        }

        const cellValue = data[row]?.[col];
        const result = this.evaluateRule(rule, cellValue, data, row, col);

        if (result) {
          results.set(key, result);

          if (rule.stopIfTrue) {
            // 标记停止后续规则
          }
        }
      }
    }
  }

  /**
   * 评估规则
   */
  private evaluateRule(
    rule: ConditionalFormatRule,
    cellValue: any,
    data: any[][],
    row: number,
    col: number
  ): ConditionalFormatResult | null {
    switch (rule.type) {
      case ConditionalFormatType.CELL_VALUE:
        return this.evaluateCellValue(rule, cellValue, row, col);

      case ConditionalFormatType.DATA_BAR:
        return this.evaluateDataBar(rule, cellValue, data, row, col);

      case ConditionalFormatType.COLOR_SCALE:
        return this.evaluateColorScale(rule, cellValue, data, row, col);

      case ConditionalFormatType.ICON_SET:
        return this.evaluateIconSet(rule, cellValue, data, row, col);

      case ConditionalFormatType.DUPLICATE:
        return this.evaluateDuplicate(rule, cellValue, data, row, col);

      case ConditionalFormatType.UNIQUE:
        return this.evaluateUnique(rule, cellValue, data, row, col);

      default:
        return null;
    }
  }

  /**
   * 评估单元格值条件
   */
  private evaluateCellValue(
    rule: ConditionalFormatRule,
    cellValue: any,
    row: number,
    col: number
  ): ConditionalFormatResult | null {
    if (!rule.condition) {
      return null;
    }

    const { operator, value1, value2 } = rule.condition;
    let matches = false;

    switch (operator) {
      case 'greater_than':
        matches = Number(cellValue) > Number(value1);
        break;
      case 'less_than':
        matches = Number(cellValue) < Number(value1);
        break;
      case 'between':
        matches = Number(cellValue) >= Number(value1) && Number(cellValue) <= Number(value2);
        break;
      case 'equal':
        matches = cellValue == value1;
        break;
      case 'not_equal':
        matches = cellValue != value1;
        break;
    }

    if (matches && rule.style) {
      return {
        row,
        col,
        style: rule.style,
      };
    }

    return null;
  }

  /**
   * 评估数据条
   */
  private evaluateDataBar(
    rule: ConditionalFormatRule,
    cellValue: any,
    data: any[][],
    row: number,
    col: number
  ): ConditionalFormatResult | null {
    if (!rule.dataBar) {
      return null;
    }

    // 计算范围内的最小最大值
    const values = this.getRangeValues(data, rule.range);
    const numValue = Number(cellValue);

    if (isNaN(numValue)) {
      return null;
    }

    const min = rule.dataBar.minValue ?? Math.min(...values);
    const max = rule.dataBar.maxValue ?? Math.max(...values);

    // 计算数据条长度(0-100%)
    const barValue = max > min ? ((numValue - min) / (max - min)) * 100 : 0;

    return {
      row,
      col,
      dataBarValue: Math.max(0, Math.min(100, barValue)),
    };
  }

  /**
   * 评估色阶
   */
  private evaluateColorScale(
    rule: ConditionalFormatRule,
    cellValue: any,
    data: any[][],
    row: number,
    col: number
  ): ConditionalFormatResult | null {
    if (!rule.colorScale || rule.colorScale.points.length < 2) {
      return null;
    }

    const values = this.getRangeValues(data, rule.range);
    const numValue = Number(cellValue);

    if (isNaN(numValue)) {
      return null;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);

    // 计算颜色
    const color = this.interpolateColor(rule.colorScale.points, numValue, min, max);

    return {
      row,
      col,
      colorScaleColor: color,
    };
  }

  /**
   * 颜色插值
   */
  private interpolateColor(
    points: ColorScalePoint[],
    value: number,
    min: number,
    max: number
  ): string {
    // 简化实现,实际应该根据点位置进行插值
    const ratio = max > min ? (value - min) / (max - min) : 0;

    if (points.length === 2) {
      // 两点插值
      return this.blendColors(points[0].color, points[1].color, ratio);
    } else if (points.length === 3) {
      // 三点插值
      if (ratio < 0.5) {
        return this.blendColors(points[0].color, points[1].color, ratio * 2);
      } else {
        return this.blendColors(points[1].color, points[2].color, (ratio - 0.5) * 2);
      }
    }

    return points[0].color;
  }

  /**
   * 混合两个颜色
   */
  private blendColors(color1: string, color2: string, ratio: number): string {
    // 简化实现,返回第一个颜色
    // 实际应该进行 RGB 插值
    return ratio < 0.5 ? color1 : color2;
  }

  /**
   * 评估图标集
   */
  private evaluateIconSet(
    rule: ConditionalFormatRule,
    cellValue: any,
    data: any[][],
    row: number,
    col: number
  ): ConditionalFormatResult | null {
    if (!rule.iconSet) {
      return null;
    }

    const values = this.getRangeValues(data, rule.range);
    const numValue = Number(cellValue);

    if (isNaN(numValue)) {
      return null;
    }

    // 根据图标集类型确定图标
    const icon = this.getIcon(rule.iconSet, numValue, values);

    return {
      row,
      col,
      icon,
    };
  }

  /**
   * 获取图标
   */
  private getIcon(config: IconSetConfig, value: number, allValues: number[]): string {
    // 简化实现,实际应该根据阈值返回不同图标
    const sorted = [...allValues].sort((a, b) => a - b);
    const rank = sorted.indexOf(value);
    const ratio = allValues.length > 0 ? rank / allValues.length : 0;

    if (config.type === IconSetType.ARROWS_3) {
      if (ratio < 0.33) return '↓';
      if (ratio < 0.67) return '→';
      return '↑';
    }

    return '';
  }

  /**
   * 评估重复值
   */
  private evaluateDuplicate(
    rule: ConditionalFormatRule,
    cellValue: any,
    data: any[][],
    row: number,
    col: number
  ): ConditionalFormatResult | null {
    const values = this.getRangeValues(data, rule.range);
    const count = values.filter((v) => v === cellValue).length;

    if (count > 1 && rule.style) {
      return {
        row,
        col,
        style: rule.style,
      };
    }

    return null;
  }

  /**
   * 评估唯一值
   */
  private evaluateUnique(
    rule: ConditionalFormatRule,
    cellValue: any,
    data: any[][],
    row: number,
    col: number
  ): ConditionalFormatResult | null {
    const values = this.getRangeValues(data, rule.range);
    const count = values.filter((v) => v === cellValue).length;

    if (count === 1 && rule.style) {
      return {
        row,
        col,
        style: rule.style,
      };
    }

    return null;
  }

  /**
   * 获取范围内的所有值
   */
  private getRangeValues(
    data: any[][],
    range: { startRow: number; startCol: number; endRow: number; endCol: number }
  ): number[] {
    const values: number[] = [];

    for (let row = range.startRow; row <= range.endRow; row++) {
      for (let col = range.startCol; col <= range.endCol; col++) {
        const value = data[row]?.[col];
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          values.push(numValue);
        }
      }
    }

    return values;
  }

  /**
   * 清除所有规则
   */
  clear(): void {
    this.rules.clear();
    logger.info('All conditional format rules cleared');
  }

  /**
   * 获取所有规则
   */
  getAllRules(): ConditionalFormatRule[] {
    return Array.from(this.rules.values());
  }
}


