/**
 * 数据验证系统
 * 支持单元格数据验证规则
 */

import { logger } from '../errors';

/**
 * 验证规则类型
 */
export enum ValidationType {
  /** 任意值 */
  ANY = 'any',
  /** 整数 */
  WHOLE_NUMBER = 'whole_number',
  /** 小数 */
  DECIMAL = 'decimal',
  /** 列表 */
  LIST = 'list',
  /** 日期 */
  DATE = 'date',
  /** 时间 */
  TIME = 'time',
  /** 文本长度 */
  TEXT_LENGTH = 'text_length',
  /** 自定义公式 */
  CUSTOM = 'custom',
}

/**
 * 验证操作符
 */
export enum ValidationOperator {
  BETWEEN = 'between',
  NOT_BETWEEN = 'not_between',
  EQUAL = 'equal',
  NOT_EQUAL = 'not_equal',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
}

/**
 * 验证错误样式
 */
export enum ValidationErrorStyle {
  /** 停止 */
  STOP = 'stop',
  /** 警告 */
  WARNING = 'warning',
  /** 信息 */
  INFORMATION = 'information',
}

/**
 * 验证规则配置
 */
export interface ValidationRule {
  /** 规则类型 */
  type: ValidationType;
  /** 操作符 */
  operator?: ValidationOperator;
  /** 公式1 */
  formula1?: string;
  /** 公式2 (用于 between 操作符) */
  formula2?: string;
  /** 列表值 (用于 LIST 类型) */
  list?: string[];
  /** 是否允许空白 */
  allowBlank?: boolean;
  /** 是否显示下拉箭头 */
  showDropdown?: boolean;
  /** 输入提示标题 */
  promptTitle?: string;
  /** 输入提示消息 */
  promptMessage?: string;
  /** 是否显示输入提示 */
  showPrompt?: boolean;
  /** 错误标题 */
  errorTitle?: string;
  /** 错误消息 */
  errorMessage?: string;
  /** 是否显示错误警告 */
  showError?: boolean;
  /** 错误样式 */
  errorStyle?: ValidationErrorStyle;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否通过验证 */
  valid: boolean;
  /** 错误消息 */
  error?: string;
  /** 建议值 */
  suggestion?: any;
}

/**
 * 数据验证器
 */
export class DataValidator {
  private rules: Map<string, ValidationRule> = new Map();

  /**
   * 添加验证规则
   */
  addRule(cellRef: string, rule: ValidationRule): void {
    this.rules.set(cellRef, rule);
    logger.debug(`Validation rule added for ${cellRef}`, { type: rule.type });
  }

  /**
   * 移除验证规则
   */
  removeRule(cellRef: string): boolean {
    return this.rules.delete(cellRef);
  }

  /**
   * 获取验证规则
   */
  getRule(cellRef: string): ValidationRule | undefined {
    return this.rules.get(cellRef);
  }

  /**
   * 验证值
   */
  validate(cellRef: string, value: any): ValidationResult {
    const rule = this.rules.get(cellRef);

    if (!rule) {
      return { valid: true };
    }

    // 检查是否允许空白
    if (rule.allowBlank && (value === null || value === undefined || value === '')) {
      return { valid: true };
    }

    try {
      switch (rule.type) {
        case ValidationType.ANY:
          return { valid: true };

        case ValidationType.WHOLE_NUMBER:
          return this.validateWholeNumber(value, rule);

        case ValidationType.DECIMAL:
          return this.validateDecimal(value, rule);

        case ValidationType.LIST:
          return this.validateList(value, rule);

        case ValidationType.DATE:
          return this.validateDate(value, rule);

        case ValidationType.TIME:
          return this.validateTime(value, rule);

        case ValidationType.TEXT_LENGTH:
          return this.validateTextLength(value, rule);

        case ValidationType.CUSTOM:
          return this.validateCustom(value, rule);

        default:
          return { valid: true };
      }
    } catch (error) {
      logger.error('Validation error', error as Error, { cellRef, value });
      return {
        valid: false,
        error: '验证过程中发生错误',
      };
    }
  }

  /**
   * 验证整数
   */
  private validateWholeNumber(value: any, rule: ValidationRule): ValidationResult {
    const num = Number(value);

    if (!Number.isInteger(num)) {
      return {
        valid: false,
        error: rule.errorMessage || '请输入整数',
      };
    }

    return this.validateNumber(num, rule);
  }

  /**
   * 验证小数
   */
  private validateDecimal(value: any, rule: ValidationRule): ValidationResult {
    const num = Number(value);

    if (isNaN(num)) {
      return {
        valid: false,
        error: rule.errorMessage || '请输入有效的数字',
      };
    }

    return this.validateNumber(num, rule);
  }

  /**
   * 验证数字范围
   */
  private validateNumber(num: number, rule: ValidationRule): ValidationResult {
    const val1 = rule.formula1 ? Number(rule.formula1) : 0;
    const val2 = rule.formula2 ? Number(rule.formula2) : 0;

    switch (rule.operator) {
      case ValidationOperator.BETWEEN:
        if (num < val1 || num > val2) {
          return {
            valid: false,
            error: rule.errorMessage || `值必须在 ${val1} 和 ${val2} 之间`,
          };
        }
        break;

      case ValidationOperator.NOT_BETWEEN:
        if (num >= val1 && num <= val2) {
          return {
            valid: false,
            error: rule.errorMessage || `值不能在 ${val1} 和 ${val2} 之间`,
          };
        }
        break;

      case ValidationOperator.EQUAL:
        if (num !== val1) {
          return {
            valid: false,
            error: rule.errorMessage || `值必须等于 ${val1}`,
          };
        }
        break;

      case ValidationOperator.NOT_EQUAL:
        if (num === val1) {
          return {
            valid: false,
            error: rule.errorMessage || `值不能等于 ${val1}`,
          };
        }
        break;

      case ValidationOperator.GREATER_THAN:
        if (num <= val1) {
          return {
            valid: false,
            error: rule.errorMessage || `值必须大于 ${val1}`,
          };
        }
        break;

      case ValidationOperator.LESS_THAN:
        if (num >= val1) {
          return {
            valid: false,
            error: rule.errorMessage || `值必须小于 ${val1}`,
          };
        }
        break;

      case ValidationOperator.GREATER_THAN_OR_EQUAL:
        if (num < val1) {
          return {
            valid: false,
            error: rule.errorMessage || `值必须大于或等于 ${val1}`,
          };
        }
        break;

      case ValidationOperator.LESS_THAN_OR_EQUAL:
        if (num > val1) {
          return {
            valid: false,
            error: rule.errorMessage || `值必须小于或等于 ${val1}`,
          };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * 验证列表
   */
  private validateList(value: any, rule: ValidationRule): ValidationResult {
    if (!rule.list || rule.list.length === 0) {
      return { valid: true };
    }

    const strValue = String(value);
    const valid = rule.list.includes(strValue);

    if (!valid) {
      return {
        valid: false,
        error: rule.errorMessage || '请从列表中选择一个值',
        suggestion: rule.list[0],
      };
    }

    return { valid: true };
  }

  /**
   * 验证日期
   */
  private validateDate(value: any, rule: ValidationRule): ValidationResult {
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return {
        valid: false,
        error: rule.errorMessage || '请输入有效的日期',
      };
    }

    // 如果有范围验证
    if (rule.formula1) {
      const date1 = new Date(rule.formula1);
      const date2 = rule.formula2 ? new Date(rule.formula2) : new Date();

      switch (rule.operator) {
        case ValidationOperator.BETWEEN:
          if (date < date1 || date > date2) {
            return {
              valid: false,
              error: rule.errorMessage || `日期必须在 ${date1.toLocaleDateString()} 和 ${date2.toLocaleDateString()} 之间`,
            };
          }
          break;

        case ValidationOperator.GREATER_THAN:
          if (date <= date1) {
            return {
              valid: false,
              error: rule.errorMessage || `日期必须晚于 ${date1.toLocaleDateString()}`,
            };
          }
          break;

        case ValidationOperator.LESS_THAN:
          if (date >= date1) {
            return {
              valid: false,
              error: rule.errorMessage || `日期必须早于 ${date1.toLocaleDateString()}`,
            };
          }
          break;
      }
    }

    return { valid: true };
  }

  /**
   * 验证时间
   */
  private validateTime(value: any, rule: ValidationRule): ValidationResult {
    // 简化实现，实际应解析时间格式
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

    if (!timeRegex.test(String(value))) {
      return {
        valid: false,
        error: rule.errorMessage || '请输入有效的时间 (HH:MM 或 HH:MM:SS)',
      };
    }

    return { valid: true };
  }

  /**
   * 验证文本长度
   */
  private validateTextLength(value: any, rule: ValidationRule): ValidationResult {
    const length = String(value).length;
    const val1 = rule.formula1 ? Number(rule.formula1) : 0;
    const val2 = rule.formula2 ? Number(rule.formula2) : 0;

    switch (rule.operator) {
      case ValidationOperator.BETWEEN:
        if (length < val1 || length > val2) {
          return {
            valid: false,
            error: rule.errorMessage || `文本长度必须在 ${val1} 和 ${val2} 之间`,
          };
        }
        break;

      case ValidationOperator.EQUAL:
        if (length !== val1) {
          return {
            valid: false,
            error: rule.errorMessage || `文本长度必须等于 ${val1}`,
          };
        }
        break;

      case ValidationOperator.GREATER_THAN:
        if (length <= val1) {
          return {
            valid: false,
            error: rule.errorMessage || `文本长度必须大于 ${val1}`,
          };
        }
        break;

      case ValidationOperator.LESS_THAN:
        if (length >= val1) {
          return {
            valid: false,
            error: rule.errorMessage || `文本长度必须小于 ${val1}`,
          };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * 验证自定义公式
   */
  private validateCustom(value: any, rule: ValidationRule): ValidationResult {
    if (!rule.formula1) {
      return { valid: true };
    }

    // TODO: 集成公式引擎进行验证
    // 这里简化处理
    return {
      valid: true,
    };
  }

  /**
   * 清空所有规则
   */
  clear(): void {
    this.rules.clear();
  }

  /**
   * 获取所有规则
   */
  getAllRules(): Map<string, ValidationRule> {
    return new Map(this.rules);
  }
}


