/**
 * 数据透视表功能
 * 支持动态数据分析和多维度聚合
 */

import { logger } from '../errors';

/**
 * 聚合函数类型
 */
export enum AggregateFunction {
  SUM = 'sum',
  AVERAGE = 'average',
  COUNT = 'count',
  MAX = 'max',
  MIN = 'min',
  PRODUCT = 'product',
  STDEV = 'stdev',
  VAR = 'var',
  MEDIAN = 'median',
}

/**
 * 数据透视表配置
 */
export interface PivotTableConfig {
  /** 源数据范围 */
  sourceRange: {
    sheetIndex: number;
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  };
  /** 行字段 */
  rowFields: number[];
  /** 列字段 */
  columnFields: number[];
  /** 数据字段 */
  dataFields: Array<{
    column: number;
    aggregateFunction: AggregateFunction;
    name?: string;
  }>;
  /** 筛选字段 */
  filterFields?: Array<{
    column: number;
    values: any[];
  }>;
  /** 是否显示总计 */
  showGrandTotals?: boolean;
  /** 是否显示小计 */
  showSubtotals?: boolean;
}

/**
 * 数据透视表结果
 */
export interface PivotTableResult {
  /** 行标签 */
  rowLabels: string[][];
  /** 列标签 */
  columnLabels: string[][];
  /** 数据值 */
  values: number[][];
  /** 总计 */
  grandTotals?: {
    row: number[];
    column: number[];
    total: number;
  };
}

/**
 * 数据透视表管理器
 */
export class PivotTableManager {
  private config: PivotTableConfig | null = null;
  private sourceData: any[][] = [];

  /**
   * 创建数据透视表
   */
  create(data: any[][], config: PivotTableConfig): PivotTableResult {
    this.config = config;
    this.sourceData = this.extractSourceData(data, config.sourceRange);

    logger.info('Creating pivot table', {
      sourceRows: this.sourceData.length,
      rowFields: config.rowFields.length,
      columnFields: config.columnFields.length,
      dataFields: config.dataFields.length,
    });

    // 应用筛选
    const filteredData = this.applyFilters(this.sourceData, config.filterFields);

    // 构建数据透视表
    const result = this.buildPivotTable(filteredData, config);

    logger.info('Pivot table created', {
      resultRows: result.rowLabels.length,
      resultCols: result.columnLabels.length,
    });

    return result;
  }

  /**
   * 提取源数据
   */
  private extractSourceData(
    data: any[][],
    range: PivotTableConfig['sourceRange']
  ): any[][] {
    const extracted: any[][] = [];

    for (let row = range.startRow; row <= range.endRow; row++) {
      const rowData: any[] = [];
      for (let col = range.startCol; col <= range.endCol; col++) {
        rowData.push(data[row]?.[col]?.v);
      }
      extracted.push(rowData);
    }

    return extracted;
  }

  /**
   * 应用筛选
   */
  private applyFilters(
    data: any[][],
    filterFields?: PivotTableConfig['filterFields']
  ): any[][] {
    if (!filterFields || filterFields.length === 0) {
      return data;
    }

    return data.filter((row) => {
      return filterFields.every((filter) => {
        const value = row[filter.column];
        return filter.values.includes(value);
      });
    });
  }

  /**
   * 构建数据透视表
   */
  private buildPivotTable(data: any[][], config: PivotTableConfig): PivotTableResult {
    // 构建行维度映射
    const rowDimensions = this.buildDimensions(data, config.rowFields);

    // 构建列维度映射
    const colDimensions = this.buildDimensions(data, config.columnFields);

    // 构建数据值矩阵
    const valueMatrix: Map<string, Map<string, number[]>> = new Map();

    // 聚合数据
    data.forEach((row) => {
      const rowKey = this.getKeyFromFields(row, config.rowFields);
      const colKey = this.getKeyFromFields(row, config.columnFields);

      if (!valueMatrix.has(rowKey)) {
        valueMatrix.set(rowKey, new Map());
      }

      const rowMap = valueMatrix.get(rowKey)!;
      if (!rowMap.has(colKey)) {
        rowMap.set(colKey, []);
      }

      // 添加数据字段的值
      config.dataFields.forEach((dataField) => {
        const value = Number(row[dataField.column]);
        if (!isNaN(value)) {
          rowMap.get(colKey)!.push(value);
        }
      });
    });

    // 计算聚合结果
    const rowLabels = Array.from(rowDimensions.keys()).map((key) => key.split('|'));
    const columnLabels = Array.from(colDimensions.keys()).map((key) => key.split('|'));
    const values: number[][] = [];

    rowLabels.forEach((_, rowIdx) => {
      const rowKey = Array.from(rowDimensions.keys())[rowIdx];
      const rowValues: number[] = [];

      columnLabels.forEach((_, colIdx) => {
        const colKey = Array.from(colDimensions.keys())[colIdx];
        const cellValues = valueMatrix.get(rowKey)?.get(colKey) || [];

        // 使用第一个数据字段的聚合函数
        const aggregateFunc = config.dataFields[0]?.aggregateFunction || AggregateFunction.SUM;
        const aggregatedValue = this.aggregate(cellValues, aggregateFunc);

        rowValues.push(aggregatedValue);
      });

      values.push(rowValues);
    });

    return {
      rowLabels,
      columnLabels,
      values,
    };
  }

  /**
   * 构建维度
   */
  private buildDimensions(data: any[][], fields: number[]): Map<string, any[]> {
    const dimensions = new Map<string, any[]>();

    data.forEach((row) => {
      const key = this.getKeyFromFields(row, fields);
      if (!dimensions.has(key)) {
        dimensions.set(key, fields.map((field) => row[field]));
      }
    });

    return dimensions;
  }

  /**
   * 从字段生成键
   */
  private getKeyFromFields(row: any[], fields: number[]): string {
    return fields.map((field) => String(row[field] || '')).join('|');
  }

  /**
   * 聚合函数
   */
  private aggregate(values: number[], func: AggregateFunction): number {
    if (values.length === 0) {
      return 0;
    }

    switch (func) {
      case AggregateFunction.SUM:
        return values.reduce((a, b) => a + b, 0);

      case AggregateFunction.AVERAGE:
        return values.reduce((a, b) => a + b, 0) / values.length;

      case AggregateFunction.COUNT:
        return values.length;

      case AggregateFunction.MAX:
        return Math.max(...values);

      case AggregateFunction.MIN:
        return Math.min(...values);

      case AggregateFunction.PRODUCT:
        return values.reduce((a, b) => a * b, 1);

      case AggregateFunction.STDEV:
        const avg = this.aggregate(values, AggregateFunction.AVERAGE);
        const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
        return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));

      case AggregateFunction.VAR:
        const avgVar = this.aggregate(values, AggregateFunction.AVERAGE);
        const squareDiffsVar = values.map((v) => Math.pow(v - avgVar, 2));
        return squareDiffsVar.reduce((a, b) => a + b, 0) / (values.length - 1);

      case AggregateFunction.MEDIAN:
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

      default:
        return 0;
    }
  }

  /**
   * 刷新数据透视表
   */
  refresh(data: any[][]): PivotTableResult | null {
    if (!this.config) {
      logger.warn('Cannot refresh: pivot table not configured');
      return null;
    }

    return this.create(data, this.config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): PivotTableConfig | null {
    return this.config ? { ...this.config } : null;
  }

  /**
   * 导出为普通表格
   */
  exportToTable(result: PivotTableResult): any[][] {
    const table: any[][] = [];

    // 添加列标题行
    const headerRow = [''];
    result.columnLabels.forEach((labels) => {
      headerRow.push(labels.join(' / '));
    });
    table.push(headerRow);

    // 添加数据行
    result.rowLabels.forEach((labels, rowIdx) => {
      const row = [labels.join(' / ')];
      result.values[rowIdx].forEach((value) => {
        row.push(value);
      });
      table.push(row);
    });

    return table;
  }
}


