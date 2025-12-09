/**
 * 公式引擎
 * 支持基本的 Excel 公式计算
 */

export interface FormulaContext {
  /** 获取单元格值 */
  getCellValue(address: string): any;
  /** 获取范围值 */
  getRangeValues(range: string): any[][];
  /** 当前单元格地址 */
  currentCell?: string;
}

export interface FormulaResult {
  value: any;
  error?: string;
  type: 'number' | 'string' | 'boolean' | 'error' | 'array';
}

type FormulaFunction = (args: any[], context: FormulaContext) => any;

export class FormulaEngine {
  private functions: Map<string, FormulaFunction> = new Map();

  constructor() {
    this.registerBuiltinFunctions();
  }

  /**
   * 注册内置函数
   */
  private registerBuiltinFunctions(): void {
    // 数学函数
    this.register('SUM', (args) => {
      return this.flattenArgs(args).reduce((sum, val) => sum + (Number(val) || 0), 0);
    });

    this.register('AVERAGE', (args) => {
      const values = this.flattenArgs(args).filter(v => typeof v === 'number' || !isNaN(Number(v)));
      if (values.length === 0) return 0;
      return values.reduce((sum, val) => sum + Number(val), 0) / values.length;
    });

    this.register('COUNT', (args) => {
      return this.flattenArgs(args).filter(v => typeof v === 'number' || !isNaN(Number(v))).length;
    });

    this.register('COUNTA', (args) => {
      return this.flattenArgs(args).filter(v => v !== null && v !== undefined && v !== '').length;
    });

    this.register('MAX', (args) => {
      const values = this.flattenArgs(args).filter(v => typeof v === 'number' || !isNaN(Number(v)));
      if (values.length === 0) return 0;
      return Math.max(...values.map(Number));
    });

    this.register('MIN', (args) => {
      const values = this.flattenArgs(args).filter(v => typeof v === 'number' || !isNaN(Number(v)));
      if (values.length === 0) return 0;
      return Math.min(...values.map(Number));
    });

    this.register('ABS', (args) => Math.abs(Number(args[0]) || 0));
    this.register('ROUND', (args) => {
      const num = Number(args[0]) || 0;
      const decimals = Number(args[1]) || 0;
      return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    });
    this.register('FLOOR', (args) => Math.floor(Number(args[0]) || 0));
    this.register('CEILING', (args) => Math.ceil(Number(args[0]) || 0));
    this.register('SQRT', (args) => Math.sqrt(Number(args[0]) || 0));
    this.register('POWER', (args) => Math.pow(Number(args[0]) || 0, Number(args[1]) || 1));

    // 逻辑函数
    this.register('IF', (args) => {
      const condition = Boolean(args[0]);
      return condition ? args[1] : (args[2] ?? false);
    });

    this.register('AND', (args) => {
      return this.flattenArgs(args).every(Boolean);
    });

    this.register('OR', (args) => {
      return this.flattenArgs(args).some(Boolean);
    });

    this.register('NOT', (args) => !Boolean(args[0]));

    this.register('IFERROR', (args) => {
      try {
        const value = args[0];
        if (value instanceof Error || (typeof value === 'string' && value.startsWith('#'))) {
          return args[1];
        }
        return value;
      } catch {
        return args[1];
      }
    });

    // 文本函数
    this.register('CONCATENATE', (args) => {
      return args.map(String).join('');
    });

    this.register('CONCAT', (args) => {
      return this.flattenArgs(args).map(String).join('');
    });

    this.register('LEFT', (args) => {
      const text = String(args[0] || '');
      const count = Number(args[1]) || 1;
      return text.substring(0, count);
    });

    this.register('RIGHT', (args) => {
      const text = String(args[0] || '');
      const count = Number(args[1]) || 1;
      return text.substring(text.length - count);
    });

    this.register('MID', (args) => {
      const text = String(args[0] || '');
      const start = (Number(args[1]) || 1) - 1;
      const count = Number(args[2]) || 1;
      return text.substring(start, start + count);
    });

    this.register('LEN', (args) => String(args[0] || '').length);
    this.register('TRIM', (args) => String(args[0] || '').trim());
    this.register('UPPER', (args) => String(args[0] || '').toUpperCase());
    this.register('LOWER', (args) => String(args[0] || '').toLowerCase());
    this.register('PROPER', (args) => {
      return String(args[0] || '').replace(/\w\S*/g, txt =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    });

    this.register('TEXT', (args) => {
      const value = args[0];
      const format = String(args[1] || '');
      // 简化实现
      if (format.includes('%')) {
        return (Number(value) * 100).toFixed(format.split('.')[1]?.length || 0) + '%';
      }
      return String(value);
    });

    this.register('VALUE', (args) => Number(args[0]) || 0);

    // 日期函数
    this.register('TODAY', () => {
      const today = new Date();
      return this.dateToSerial(today);
    });

    this.register('NOW', () => {
      const now = new Date();
      return this.dateToSerial(now) + (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;
    });

    this.register('YEAR', (args) => {
      const date = this.serialToDate(Number(args[0]));
      return date.getFullYear();
    });

    this.register('MONTH', (args) => {
      const date = this.serialToDate(Number(args[0]));
      return date.getMonth() + 1;
    });

    this.register('DAY', (args) => {
      const date = this.serialToDate(Number(args[0]));
      return date.getDate();
    });

    this.register('DATE', (args) => {
      const year = Number(args[0]) || 1900;
      const month = Number(args[1]) || 1;
      const day = Number(args[2]) || 1;
      return this.dateToSerial(new Date(year, month - 1, day));
    });

    // 查找函数
    this.register('VLOOKUP', (args, context) => {
      const lookupValue = args[0];
      const range = args[1];
      const colIndex = Number(args[2]) || 1;
      const exactMatch = args[3] === false || args[3] === 0;

      if (!Array.isArray(range) || range.length === 0) {
        return '#N/A';
      }

      for (const row of range) {
        if (!Array.isArray(row)) continue;
        const firstCol = row[0];

        if (exactMatch) {
          if (firstCol === lookupValue) {
            return row[colIndex - 1] ?? '#REF!';
          }
        } else {
          if (firstCol <= lookupValue) {
            return row[colIndex - 1] ?? '#REF!';
          }
        }
      }

      return '#N/A';
    });

    this.register('HLOOKUP', (args, context) => {
      const lookupValue = args[0];
      const range = args[1];
      const rowIndex = Number(args[2]) || 1;
      const exactMatch = args[3] === false || args[3] === 0;

      if (!Array.isArray(range) || range.length === 0) {
        return '#N/A';
      }

      const firstRow = range[0];
      if (!Array.isArray(firstRow)) return '#N/A';

      for (let col = 0; col < firstRow.length; col++) {
        const value = firstRow[col];

        if (exactMatch) {
          if (value === lookupValue) {
            return range[rowIndex - 1]?.[col] ?? '#REF!';
          }
        } else {
          if (value <= lookupValue) {
            return range[rowIndex - 1]?.[col] ?? '#REF!';
          }
        }
      }

      return '#N/A';
    });

    this.register('INDEX', (args) => {
      const range = args[0];
      const rowNum = Number(args[1]) || 1;
      const colNum = Number(args[2]) || 1;

      if (!Array.isArray(range)) return '#REF!';
      return range[rowNum - 1]?.[colNum - 1] ?? '#REF!';
    });

    this.register('MATCH', (args) => {
      const lookupValue = args[0];
      const lookupArray = this.flattenArgs([args[1]]);
      const matchType = args[2] ?? 1;

      for (let i = 0; i < lookupArray.length; i++) {
        if (matchType === 0 && lookupArray[i] === lookupValue) {
          return i + 1;
        }
        if (matchType === 1 && lookupArray[i] <= lookupValue) {
          return i + 1;
        }
        if (matchType === -1 && lookupArray[i] >= lookupValue) {
          return i + 1;
        }
      }

      return '#N/A';
    });
  }

  /**
   * 注册自定义函数
   */
  register(name: string, fn: FormulaFunction): void {
    this.functions.set(name.toUpperCase(), fn);
  }

  /**
   * 计算公式
   */
  evaluate(formula: string, context: FormulaContext): FormulaResult {
    try {
      // 移除开头的等号
      let expr = formula.trim();
      if (expr.startsWith('=')) {
        expr = expr.substring(1);
      }

      const value = this.evaluateExpression(expr, context);

      return {
        value,
        type: this.getValueType(value)
      };
    } catch (error) {
      return {
        value: '#ERROR!',
        error: error instanceof Error ? error.message : String(error),
        type: 'error'
      };
    }
  }

  /**
   * 计算表达式
   */
  private evaluateExpression(expr: string, context: FormulaContext): any {
    expr = expr.trim();

    // 处理字符串字面量
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr.slice(1, -1);
    }

    // 处理数字
    if (/^-?\d+(\.\d+)?$/.test(expr)) {
      return parseFloat(expr);
    }

    // 处理布尔值
    if (expr.toUpperCase() === 'TRUE') return true;
    if (expr.toUpperCase() === 'FALSE') return false;

    // 处理单元格引用
    if (/^[A-Z]+\d+$/i.test(expr)) {
      return context.getCellValue(expr.toUpperCase());
    }

    // 处理范围引用
    if (/^[A-Z]+\d+:[A-Z]+\d+$/i.test(expr)) {
      return context.getRangeValues(expr.toUpperCase());
    }

    // 处理函数调用
    const funcMatch = expr.match(/^([A-Z_][A-Z0-9_]*)\s*\((.*)\)$/i);
    if (funcMatch) {
      const funcName = funcMatch[1].toUpperCase();
      const argsStr = funcMatch[2];
      const args = this.parseArguments(argsStr, context);

      const fn = this.functions.get(funcName);
      if (!fn) {
        throw new Error(`Unknown function: ${funcName}`);
      }

      return fn(args, context);
    }

    // 处理运算符（简化实现）
    // 加法
    if (expr.includes('+')) {
      const parts = this.splitByOperator(expr, '+');
      if (parts.length > 1) {
        return parts.reduce((sum, part) =>
          sum + Number(this.evaluateExpression(part, context)), 0
        );
      }
    }

    // 减法
    if (expr.includes('-') && !expr.startsWith('-')) {
      const parts = this.splitByOperator(expr, '-');
      if (parts.length > 1) {
        const first = Number(this.evaluateExpression(parts[0], context));
        return parts.slice(1).reduce((result, part) =>
          result - Number(this.evaluateExpression(part, context)), first
        );
      }
    }

    // 乘法
    if (expr.includes('*')) {
      const parts = this.splitByOperator(expr, '*');
      if (parts.length > 1) {
        return parts.reduce((product, part) =>
          product * Number(this.evaluateExpression(part, context)), 1
        );
      }
    }

    // 除法
    if (expr.includes('/')) {
      const parts = this.splitByOperator(expr, '/');
      if (parts.length > 1) {
        const first = Number(this.evaluateExpression(parts[0], context));
        return parts.slice(1).reduce((result, part) => {
          const divisor = Number(this.evaluateExpression(part, context));
          if (divisor === 0) throw new Error('#DIV/0!');
          return result / divisor;
        }, first);
      }
    }

    // 比较运算符
    for (const op of ['>=', '<=', '<>', '=', '>', '<']) {
      if (expr.includes(op)) {
        const idx = expr.indexOf(op);
        const left = this.evaluateExpression(expr.substring(0, idx), context);
        const right = this.evaluateExpression(expr.substring(idx + op.length), context);

        switch (op) {
          case '=': return left === right;
          case '<>': return left !== right;
          case '>': return left > right;
          case '<': return left < right;
          case '>=': return left >= right;
          case '<=': return left <= right;
        }
      }
    }

    // 字符串连接
    if (expr.includes('&')) {
      const parts = this.splitByOperator(expr, '&');
      if (parts.length > 1) {
        return parts.map(part => String(this.evaluateExpression(part, context))).join('');
      }
    }

    return expr;
  }

  /**
   * 解析函数参数
   */
  private parseArguments(argsStr: string, context: FormulaContext): any[] {
    const args: any[] = [];
    let current = '';
    let depth = 0;
    let inString = false;

    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];

      if (char === '"' && argsStr[i - 1] !== '\\') {
        inString = !inString;
      }

      if (!inString) {
        if (char === '(') depth++;
        if (char === ')') depth--;
        if (char === ',' && depth === 0) {
          args.push(this.evaluateExpression(current.trim(), context));
          current = '';
          continue;
        }
      }

      current += char;
    }

    if (current.trim()) {
      args.push(this.evaluateExpression(current.trim(), context));
    }

    return args;
  }

  /**
   * 按运算符分割（考虑括号）
   */
  private splitByOperator(expr: string, op: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;

    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];

      if (char === '"' && expr[i - 1] !== '\\') {
        inString = !inString;
      }

      if (!inString) {
        if (char === '(') depth++;
        if (char === ')') depth--;
        if (char === op && depth === 0) {
          parts.push(current);
          current = '';
          continue;
        }
      }

      current += char;
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  }

  /**
   * 展平参数（处理范围）
   */
  private flattenArgs(args: any[]): any[] {
    const result: any[] = [];

    for (const arg of args) {
      if (Array.isArray(arg)) {
        for (const row of arg) {
          if (Array.isArray(row)) {
            result.push(...row);
          } else {
            result.push(row);
          }
        }
      } else {
        result.push(arg);
      }
    }

    return result;
  }

  /**
   * 获取值类型
   */
  private getValueType(value: any): FormulaResult['type'] {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string' && value.startsWith('#')) return 'error';
    if (Array.isArray(value)) return 'array';
    return 'string';
  }

  /**
   * 日期转序列号
   */
  private dateToSerial(date: Date): number {
    const epoch = new Date(1899, 11, 30);
    return Math.floor((date.getTime() - epoch.getTime()) / 86400000);
  }

  /**
   * 序列号转日期
   */
  private serialToDate(serial: number): Date {
    const epoch = new Date(1899, 11, 30);
    return new Date(epoch.getTime() + serial * 86400000);
  }
}

// 单例
let engineInstance: FormulaEngine | null = null;

export function getFormulaEngine(): FormulaEngine {
  if (!engineInstance) {
    engineInstance = new FormulaEngine();
  }
  return engineInstance;
}
