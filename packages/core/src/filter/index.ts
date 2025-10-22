/**
 * 高级筛选和排序功能
 * 支持多条件筛选、自定义排序规则
 */

import { logger } from '../errors';

/**
 * 筛选条件类型
 */
export enum FilterType {
  /** 等于 */
  EQUALS = 'equals',
  /** 不等于 */
  NOT_EQUALS = 'not_equals',
  /** 包含 */
  CONTAINS = 'contains',
  /** 不包含 */
  NOT_CONTAINS = 'not_contains',
  /** 开始于 */
  STARTS_WITH = 'starts_with',
  /** 结束于 */
  ENDS_WITH = 'ends_with',
  /** 大于 */
  GREATER_THAN = 'greater_than',
  /** 小于 */
  LESS_THAN = 'less_than',
  /** 大于等于 */
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  /** 小于等于 */
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  /** 区间 */
  BETWEEN = 'between',
  /** 为空 */
  IS_EMPTY = 'is_empty',
  /** 不为空 */
  IS_NOT_EMPTY = 'is_not_empty',
  /** 自定义 */
  CUSTOM = 'custom',
}

/**
 * 逻辑操作符
 */
export enum LogicalOperator {
  AND = 'and',
  OR = 'or',
}

/**
 * 排序方向
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * 筛选条件
 */
export interface FilterCondition {
  /** 列索引 */
  column: number;
  /** 筛选类型 */
  type: FilterType;
  /** 值1 */
  value1?: any;
  /** 值2 (用于 BETWEEN) */
  value2?: any;
  /** 自定义函数 */
  customFn?: (value: any) => boolean;
}

/**
 * 筛选组
 */
export interface FilterGroup {
  /** 逻辑操作符 */
  operator: LogicalOperator;
  /** 筛选条件列表 */
  conditions: FilterCondition[];
}

/**
 * 排序规则
 */
export interface SortRule {
  /** 列索引 */
  column: number;
  /** 排序方向 */
  direction: SortDirection;
  /** 自定义比较函数 */
  compareFn?: (a: any, b: any) => number;
}

/**
 * 筛选结果
 */
export interface FilterResult {
  /** 筛选后的行索引 */
  rowIndices: number[];
  /** 筛选掉的行数 */
  filteredCount: number;
  /** 总行数 */
  totalCount: number;
}

/**
 * 高级筛选管理器
 */
export class AdvancedFilter {
  private filterHistory: FilterGroup[] = [];
  private currentFilter: FilterGroup | null = null;

  /**
   * 应用筛选
   */
  filter(data: any[][], filterGroup: FilterGroup): FilterResult {
    this.currentFilter = filterGroup;
    this.filterHistory.push(filterGroup);

    const rowIndices: number[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (this.matchFilterGroup(row, filterGroup)) {
        rowIndices.push(i);
      }
    }

    logger.info('Filter applied', {
      matched: rowIndices.length,
      total: data.length,
      filtered: data.length - rowIndices.length,
    });

    return {
      rowIndices,
      filteredCount: data.length - rowIndices.length,
      totalCount: data.length,
    };
  }

  /**
   * 匹配筛选组
   */
  private matchFilterGroup(row: any[], filterGroup: FilterGroup): boolean {
    const results = filterGroup.conditions.map((condition) =>
      this.matchCondition(row, condition)
    );

    if (filterGroup.operator === LogicalOperator.AND) {
      return results.every((r) => r);
    } else {
      return results.some((r) => r);
    }
  }

  /**
   * 匹配单个条件
   */
  private matchCondition(row: any[], condition: FilterCondition): boolean {
    const cellValue = row[condition.column];
    const { type, value1, value2, customFn } = condition;

    switch (type) {
      case FilterType.EQUALS:
        return cellValue == value1;

      case FilterType.NOT_EQUALS:
        return cellValue != value1;

      case FilterType.CONTAINS:
        return String(cellValue).includes(String(value1));

      case FilterType.NOT_CONTAINS:
        return !String(cellValue).includes(String(value1));

      case FilterType.STARTS_WITH:
        return String(cellValue).startsWith(String(value1));

      case FilterType.ENDS_WITH:
        return String(cellValue).endsWith(String(value1));

      case FilterType.GREATER_THAN:
        return Number(cellValue) > Number(value1);

      case FilterType.LESS_THAN:
        return Number(cellValue) < Number(value1);

      case FilterType.GREATER_THAN_OR_EQUAL:
        return Number(cellValue) >= Number(value1);

      case FilterType.LESS_THAN_OR_EQUAL:
        return Number(cellValue) <= Number(value1);

      case FilterType.BETWEEN:
        return Number(cellValue) >= Number(value1) && Number(cellValue) <= Number(value2);

      case FilterType.IS_EMPTY:
        return cellValue === null || cellValue === undefined || cellValue === '';

      case FilterType.IS_NOT_EMPTY:
        return cellValue !== null && cellValue !== undefined && cellValue !== '';

      case FilterType.CUSTOM:
        return customFn ? customFn(cellValue) : true;

      default:
        return true;
    }
  }

  /**
   * 清除筛选
   */
  clearFilter(): void {
    this.currentFilter = null;
    logger.info('Filter cleared');
  }

  /**
   * 获取当前筛选
   */
  getCurrentFilter(): FilterGroup | null {
    return this.currentFilter;
  }

  /**
   * 获取筛选历史
   */
  getFilterHistory(): FilterGroup[] {
    return [...this.filterHistory];
  }

  /**
   * 清除历史
   */
  clearHistory(): void {
    this.filterHistory = [];
  }
}

/**
 * 排序管理器
 */
export class AdvancedSorter {
  /**
   * 多列排序
   */
  sort(data: any[][], sortRules: SortRule[]): number[] {
    // 创建索引数组
    const indices = Array.from({ length: data.length }, (_, i) => i);

    // 排序
    indices.sort((aIdx, bIdx) => {
      for (const rule of sortRules) {
        const aValue = data[aIdx][rule.column];
        const bValue = data[bIdx][rule.column];

        let compareResult = 0;

        if (rule.compareFn) {
          // 使用自定义比较函数
          compareResult = rule.compareFn(aValue, bValue);
        } else {
          // 默认比较
          compareResult = this.defaultCompare(aValue, bValue);
        }

        // 应用排序方向
        if (rule.direction === SortDirection.DESC) {
          compareResult = -compareResult;
        }

        // 如果不相等,返回结果
        if (compareResult !== 0) {
          return compareResult;
        }

        // 相等,继续下一个排序规则
      }

      return 0;
    });

    logger.info('Data sorted', {
      rules: sortRules.length,
      rows: data.length,
    });

    return indices;
  }

  /**
   * 默认比较函数
   */
  private defaultCompare(a: any, b: any): number {
    // 处理空值
    if (a === null || a === undefined) return 1;
    if (b === null || b === undefined) return -1;

    // 数字比较
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    // 日期比较
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() - b.getTime();
    }

    // 字符串比较
    return String(a).localeCompare(String(b));
  }

  /**
   * 单列排序
   */
  sortByColumn(data: any[][], column: number, direction: SortDirection = SortDirection.ASC): number[] {
    return this.sort(data, [{ column, direction }]);
  }
}

/**
 * 组合筛选和排序
 */
export class FilterSortManager {
  private filter: AdvancedFilter;
  private sorter: AdvancedSorter;

  constructor() {
    this.filter = new AdvancedFilter();
    this.sorter = new AdvancedSorter();
  }

  /**
   * 应用筛选和排序
   */
  filterAndSort(
    data: any[][],
    filterGroup?: FilterGroup,
    sortRules?: SortRule[]
  ): {
    indices: number[];
    filteredData: any[][];
  } {
    let indices: number[];

    // 先筛选
    if (filterGroup) {
      const filterResult = this.filter.filter(data, filterGroup);
      indices = filterResult.rowIndices;
    } else {
      indices = Array.from({ length: data.length }, (_, i) => i);
    }

    // 提取筛选后的数据
    const filteredData = indices.map((idx) => data[idx]);

    // 再排序
    if (sortRules && sortRules.length > 0) {
      const sortedIndices = this.sorter.sort(filteredData, sortRules);
      // 映射回原始索引
      indices = sortedIndices.map((i) => indices[i]);
    }

    return {
      indices,
      filteredData: indices.map((idx) => data[idx]),
    };
  }

  /**
   * 获取筛选器
   */
  getFilter(): AdvancedFilter {
    return this.filter;
  }

  /**
   * 获取排序器
   */
  getSorter(): AdvancedSorter {
    return this.sorter;
  }

  /**
   * 清除所有
   */
  clear(): void {
    this.filter.clearFilter();
    this.filter.clearHistory();
  }
}


