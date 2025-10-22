/**
 * 导入数据验证器
 * 验证文件格式、大小、数据结构等
 */

import { logger, ExcelError, ExcelErrorCode } from '../errors';

/**
 * 验证级别
 */
export enum ValidationLevel {
  /** 严格 */
  STRICT = 'strict',
  /** 宽松 */
  LOOSE = 'loose',
  /** 警告 */
  WARNING = 'warning',
}

/**
 * 验证规则
 */
export interface ImportValidationRule {
  /** 规则名称 */
  name: string;
  /** 验证函数 */
  validate: (data: any) => boolean;
  /** 错误消息 */
  errorMessage: string;
  /** 级别 */
  level: ValidationLevel;
}

/**
 * 验证结果
 */
export interface ImportValidationResult {
  /** 是否通过 */
  valid: boolean;
  /** 错误列表 */
  errors: Array<{
    rule: string;
    message: string;
    level: ValidationLevel;
  }>;
  /** 警告列表 */
  warnings: Array<{
    rule: string;
    message: string;
  }>;
  /** 统计信息 */
  stats?: {
    totalSheets: number;
    totalRows: number;
    totalCells: number;
    fileSize: number;
  };
}

/**
 * 导入预览数据
 */
export interface ImportPreview {
  /** 文件信息 */
  fileInfo: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
  /** 工作表预览 */
  sheets: Array<{
    name: string;
    index: number;
    rowCount: number;
    colCount: number;
    preview: any[][]; // 前N行预览数据
  }>;
  /** 检测到的问题 */
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    location?: string;
  }>;
}

/**
 * 导入验证器
 */
export class ImportValidator {
  private rules: ImportValidationRule[] = [];
  private maxPreviewRows = 10;

  constructor() {
    this.registerDefaultRules();
  }

  /**
   * 注册默认规则
   */
  private registerDefaultRules(): void {
    // 文件大小限制
    this.addRule({
      name: 'fileSize',
      validate: (file: File) => file.size <= 100 * 1024 * 1024, // 100MB
      errorMessage: '文件大小不能超过 100MB',
      level: ValidationLevel.STRICT,
    });

    // 工作表数量限制
    this.addRule({
      name: 'sheetCount',
      validate: (data: any) => {
        const sheetCount = data?.SheetNames?.length || 0;
        return sheetCount > 0 && sheetCount <= 100;
      },
      errorMessage: '工作表数量必须在 1-100 之间',
      level: ValidationLevel.STRICT,
    });

    // 行数限制
    this.addRule({
      name: 'rowCount',
      validate: (sheet: any) => {
        const rowCount = sheet?.data?.length || 0;
        return rowCount <= 1000000; // 100万行
      },
      errorMessage: '单个工作表行数不能超过 100 万',
      level: ValidationLevel.STRICT,
    });

    // 列数限制
    this.addRule({
      name: 'columnCount',
      validate: (sheet: any) => {
        const colCount = sheet?.data?.[0]?.length || 0;
        return colCount <= 16384; // Excel 最大列数
      },
      errorMessage: '单个工作表列数不能超过 16384',
      level: ValidationLevel.STRICT,
    });

    logger.info(`Registered ${this.rules.length} default validation rules`);
  }

  /**
   * 添加验证规则
   */
  addRule(rule: ImportValidationRule): void {
    this.rules.push(rule);
    logger.debug(`Validation rule added: ${rule.name}`);
  }

  /**
   * 移除验证规则
   */
  removeRule(name: string): boolean {
    const index = this.rules.findIndex((r) => r.name === name);
    if (index > -1) {
      this.rules.splice(index, 1);
      logger.debug(`Validation rule removed: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * 验证文件
   */
  async validateFile(file: File): Promise<ImportValidationResult> {
    const errors: ImportValidationResult['errors'] = [];
    const warnings: ImportValidationResult['warnings'] = [];

    // 执行所有规则
    for (const rule of this.rules) {
      try {
        const valid = rule.validate(file);
        if (!valid) {
          if (rule.level === ValidationLevel.STRICT) {
            errors.push({
              rule: rule.name,
              message: rule.errorMessage,
              level: rule.level,
            });
          } else if (rule.level === ValidationLevel.WARNING) {
            warnings.push({
              rule: rule.name,
              message: rule.errorMessage,
            });
          }
        }
      } catch (error) {
        logger.error(`Validation rule ${rule.name} failed`, error as Error);
        errors.push({
          rule: rule.name,
          message: `验证失败: ${(error as Error).message}`,
          level: ValidationLevel.STRICT,
        });
      }
    }

    const result: ImportValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalSheets: 0,
        totalRows: 0,
        totalCells: 0,
        fileSize: file.size,
      },
    };

    logger.info('File validation completed', {
      valid: result.valid,
      errors: errors.length,
      warnings: warnings.length,
    });

    return result;
  }

  /**
   * 生成导入预览
   */
  async generatePreview(file: File, sheets: any[]): Promise<ImportPreview> {
    const preview: ImportPreview = {
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      },
      sheets: [],
      issues: [],
    };

    // 生成工作表预览
    for (const sheet of sheets) {
      const rowCount = sheet.data?.length || 0;
      const colCount = sheet.data?.[0]?.length || 0;

      // 提取预览数据 (前N行)
      const previewData = sheet.data?.slice(0, this.maxPreviewRows) || [];

      preview.sheets.push({
        name: sheet.name,
        index: sheet.index,
        rowCount,
        colCount,
        preview: previewData,
      });

      // 检测问题
      if (rowCount === 0) {
        preview.issues.push({
          type: 'warning',
          message: `工作表 "${sheet.name}" 为空`,
          location: sheet.name,
        });
      }

      if (rowCount > 10000) {
        preview.issues.push({
          type: 'info',
          message: `工作表 "${sheet.name}" 包含大量数据 (${rowCount} 行)`,
          location: sheet.name,
        });
      }
    }

    logger.info('Import preview generated', {
      sheets: preview.sheets.length,
      issues: preview.issues.length,
    });

    return preview;
  }

  /**
   * 验证数据结构
   */
  validateDataStructure(data: any[]): ImportValidationResult {
    const errors: ImportValidationResult['errors'] = [];
    const warnings: ImportValidationResult['warnings'] = [];

    // 检查是否为空
    if (!data || data.length === 0) {
      errors.push({
        rule: 'emptyData',
        message: '数据为空',
        level: ValidationLevel.STRICT,
      });
    }

    // 检查数据格式
    let totalRows = 0;
    let totalCells = 0;

    for (const sheet of data) {
      if (!sheet.data || !Array.isArray(sheet.data)) {
        errors.push({
          rule: 'invalidStructure',
          message: `工作表 "${sheet.name}" 数据结构无效`,
          level: ValidationLevel.STRICT,
        });
        continue;
      }

      totalRows += sheet.data.length;

      // 检查行结构
      for (let i = 0; i < sheet.data.length; i++) {
        const row = sheet.data[i];
        if (!Array.isArray(row)) {
          errors.push({
            rule: 'invalidRow',
            message: `工作表 "${sheet.name}" 第 ${i + 1} 行数据格式无效`,
            level: ValidationLevel.STRICT,
          });
        } else {
          totalCells += row.length;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalSheets: data.length,
        totalRows,
        totalCells,
        fileSize: 0,
      },
    };
  }

  /**
   * 设置最大预览行数
   */
  setMaxPreviewRows(rows: number): void {
    this.maxPreviewRows = rows;
  }
}


