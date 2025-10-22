/**
 * 查找替换功能
 * 支持正则表达式、全局查找替换等
 */

import { logger } from '../errors';

/**
 * 查找选项
 */
export interface FindOptions {
  /** 搜索关键词 */
  keyword: string;
  /** 是否区分大小写 */
  caseSensitive?: boolean;
  /** 是否全词匹配 */
  matchWholeWord?: boolean;
  /** 是否使用正则表达式 */
  useRegex?: boolean;
  /** 搜索范围 */
  scope?: 'current' | 'all' | 'selection';
  /** 搜索方向 */
  direction?: 'forward' | 'backward';
  /** 是否循环搜索 */
  wrap?: boolean;
  /** 是否搜索公式 */
  searchFormulas?: boolean;
  /** 起始位置 */
  startPosition?: { row: number; col: number };
}

/**
 * 替换选项
 */
export interface ReplaceOptions extends FindOptions {
  /** 替换文本 */
  replaceText: string;
  /** 是否替换全部 */
  replaceAll?: boolean;
  /** 是否需要确认 */
  confirmEach?: boolean;
}

/**
 * 查找结果
 */
export interface FindResult {
  /** 工作表索引 */
  sheetIndex: number;
  /** 工作表名称 */
  sheetName: string;
  /** 行号 */
  row: number;
  /** 列号 */
  col: number;
  /** 单元格值 */
  value: any;
  /** 匹配的文本 */
  matchText: string;
  /** 匹配位置 */
  matchIndex: number;
  /** 匹配长度 */
  matchLength: number;
}

/**
 * 替换结果
 */
export interface ReplaceResult {
  /** 替换数量 */
  count: number;
  /** 替换详情 */
  details: Array<{
    sheetIndex: number;
    row: number;
    col: number;
    oldValue: any;
    newValue: any;
  }>;
}

/**
 * 查找替换管理器
 */
export class FindReplaceManager {
  private currentResults: FindResult[] = [];
  private currentIndex = -1;

  /**
   * 查找
   */
  find(
    data: any[],
    options: FindOptions
  ): FindResult[] {
    this.currentResults = [];
    this.currentIndex = -1;

    const pattern = this.createPattern(options);
    if (!pattern) {
      return [];
    }

    // 遍历所有工作表
    data.forEach((sheet, sheetIndex) => {
      if (options.scope === 'current' && sheetIndex !== 0) {
        return;
      }

      // 遍历单元格
      sheet.data?.forEach((row: any[], rowIndex: number) => {
        row.forEach((cell: any, colIndex: number) => {
          const matches = this.findInCell(
            cell,
            pattern,
            options,
            sheetIndex,
            sheet.name,
            rowIndex,
            colIndex
          );
          this.currentResults.push(...matches);
        });
      });
    });

    logger.info(`Found ${this.currentResults.length} matches`, { keyword: options.keyword });
    return this.currentResults;
  }

  /**
   * 在单元格中查找
   */
  private findInCell(
    cell: any,
    pattern: RegExp,
    options: FindOptions,
    sheetIndex: number,
    sheetName: string,
    row: number,
    col: number
  ): FindResult[] {
    const results: FindResult[] = [];

    // 获取搜索文本
    let searchText = '';

    if (options.searchFormulas && cell?.f) {
      searchText = cell.f;
    } else if (cell?.v !== undefined) {
      searchText = String(cell.v);
    } else {
      return results;
    }

    // 查找所有匹配
    const matches = searchText.matchAll(pattern);

    for (const match of matches) {
      results.push({
        sheetIndex,
        sheetName,
        row,
        col,
        value: cell.v,
        matchText: match[0],
        matchIndex: match.index || 0,
        matchLength: match[0].length,
      });
    }

    return results;
  }

  /**
   * 创建搜索模式
   */
  private createPattern(options: FindOptions): RegExp | null {
    try {
      let pattern = options.keyword;

      if (!options.useRegex) {
        // 转义正则特殊字符
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }

      if (options.matchWholeWord) {
        pattern = `\\b${pattern}\\b`;
      }

      const flags = 'g' + (options.caseSensitive ? '' : 'i');
      return new RegExp(pattern, flags);
    } catch (error) {
      logger.error('Invalid search pattern', error as Error, { pattern: options.keyword });
      return null;
    }
  }

  /**
   * 查找下一个
   */
  findNext(): FindResult | null {
    if (this.currentResults.length === 0) {
      return null;
    }

    this.currentIndex = (this.currentIndex + 1) % this.currentResults.length;
    return this.currentResults[this.currentIndex];
  }

  /**
   * 查找上一个
   */
  findPrevious(): FindResult | null {
    if (this.currentResults.length === 0) {
      return null;
    }

    this.currentIndex = this.currentIndex <= 0
      ? this.currentResults.length - 1
      : this.currentIndex - 1;

    return this.currentResults[this.currentIndex];
  }

  /**
   * 获取当前结果
   */
  getCurrentResult(): FindResult | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.currentResults.length) {
      return null;
    }
    return this.currentResults[this.currentIndex];
  }

  /**
   * 获取所有结果
   */
  getAllResults(): FindResult[] {
    return [...this.currentResults];
  }

  /**
   * 替换
   */
  replace(
    data: any[],
    options: ReplaceOptions,
    onCellChange?: (sheetIndex: number, row: number, col: number, oldValue: any, newValue: any) => void
  ): ReplaceResult {
    const findResults = this.find(data, options);
    const result: ReplaceResult = {
      count: 0,
      details: [],
    };

    if (options.replaceAll) {
      // 替换全部
      findResults.forEach((findResult) => {
        if (this.replaceCell(data, findResult, options, onCellChange)) {
          result.count++;
          result.details.push({
            sheetIndex: findResult.sheetIndex,
            row: findResult.row,
            col: findResult.col,
            oldValue: findResult.value,
            newValue: options.replaceText,
          });
        }
      });
    } else {
      // 替换当前
      const current = this.getCurrentResult();
      if (current && this.replaceCell(data, current, options, onCellChange)) {
        result.count = 1;
        result.details.push({
          sheetIndex: current.sheetIndex,
          row: current.row,
          col: current.col,
          oldValue: current.value,
          newValue: options.replaceText,
        });
      }
    }

    logger.info(`Replaced ${result.count} occurrence(s)`, {
      keyword: options.keyword,
      replaceText: options.replaceText,
    });

    return result;
  }

  /**
   * 替换单元格
   */
  private replaceCell(
    data: any[],
    findResult: FindResult,
    options: ReplaceOptions,
    onCellChange?: (sheetIndex: number, row: number, col: number, oldValue: any, newValue: any) => void
  ): boolean {
    try {
      const sheet = data[findResult.sheetIndex];
      if (!sheet || !sheet.data) {
        return false;
      }

      const cell = sheet.data[findResult.row]?.[findResult.col];
      if (!cell) {
        return false;
      }

      const oldValue = options.searchFormulas && cell.f ? cell.f : String(cell.v);
      const pattern = this.createPattern(options);

      if (!pattern) {
        return false;
      }

      const newValue = oldValue.replace(pattern, options.replaceText);

      // 更新单元格
      if (options.searchFormulas && cell.f) {
        cell.f = newValue;
      } else {
        cell.v = newValue;
        cell.w = newValue;
      }

      // 触发回调
      if (onCellChange) {
        onCellChange(findResult.sheetIndex, findResult.row, findResult.col, oldValue, newValue);
      }

      return true;
    } catch (error) {
      logger.error('Replace cell failed', error as Error, {
        sheetIndex: findResult.sheetIndex,
        row: findResult.row,
        col: findResult.col,
      });
      return false;
    }
  }

  /**
   * 清空搜索结果
   */
  clear(): void {
    this.currentResults = [];
    this.currentIndex = -1;
  }

  /**
   * 获取结果统计
   */
  getStats(): {
    totalResults: number;
    currentIndex: number;
    hasResults: boolean;
  } {
    return {
      totalResults: this.currentResults.length,
      currentIndex: this.currentIndex,
      hasResults: this.currentResults.length > 0,
    };
  }

  /**
   * 按工作表分组结果
   */
  groupBySheet(): Map<number, FindResult[]> {
    const grouped = new Map<number, FindResult[]>();

    this.currentResults.forEach((result) => {
      const sheetResults = grouped.get(result.sheetIndex) || [];
      sheetResults.push(result);
      grouped.set(result.sheetIndex, sheetResults);
    });

    return grouped;
  }

  /**
   * 导出搜索结果
   */
  exportResults(): string {
    const lines = ['Sheet,Row,Column,Value,Match'];

    this.currentResults.forEach((result) => {
      lines.push(
        `${result.sheetName},${result.row + 1},${this.columnIndexToLetter(result.col)},${result.value},"${result.matchText}"`
      );
    });

    return lines.join('\n');
  }

  /**
   * 列索引转字母
   */
  private columnIndexToLetter(index: number): string {
    let letter = '';
    let num = index + 1;

    while (num > 0) {
      const remainder = (num - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      num = Math.floor((num - 1) / 26);
    }

    return letter;
  }
}


