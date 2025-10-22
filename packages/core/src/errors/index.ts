/**
 * Excel 查看器错误处理系统
 */

/**
 * 错误代码枚举
 */
export enum ExcelErrorCode {
  // 文件相关错误 (1xxx)
  FILE_NOT_FOUND = 1001,
  FILE_TOO_LARGE = 1002,
  FILE_INVALID_FORMAT = 1003,
  FILE_CORRUPTED = 1004,
  FILE_LOAD_FAILED = 1005,

  // 解析相关错误 (2xxx)
  PARSE_FAILED = 2001,
  PARSE_INVALID_DATA = 2002,
  PARSE_UNSUPPORTED_FORMAT = 2003,
  PARSE_MEMORY_EXCEEDED = 2004,

  // 渲染相关错误 (3xxx)
  RENDER_FAILED = 3001,
  RENDER_CONTAINER_NOT_FOUND = 3002,
  RENDER_LUCKYSHEET_NOT_LOADED = 3003,
  RENDER_INITIALIZATION_FAILED = 3004,

  // 导出相关错误 (4xxx)
  EXPORT_FAILED = 4001,
  EXPORT_UNSUPPORTED_FORMAT = 4002,
  EXPORT_NO_DATA = 4003,

  // 操作相关错误 (5xxx)
  OPERATION_NOT_ALLOWED = 5001,
  OPERATION_INVALID_RANGE = 5002,
  OPERATION_INVALID_VALUE = 5003,

  // Worker 相关错误 (6xxx)
  WORKER_CREATION_FAILED = 6001,
  WORKER_COMMUNICATION_FAILED = 6002,
  WORKER_TIMEOUT = 6003,

  // 网络相关错误 (7xxx)
  NETWORK_REQUEST_FAILED = 7001,
  NETWORK_TIMEOUT = 7002,

  // 通用错误 (9xxx)
  UNKNOWN_ERROR = 9999,
}

/**
 * 错误严重级别
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Excel 错误类
 */
export class ExcelError extends Error {
  public readonly code: ExcelErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: number;
  public readonly recoverable: boolean;

  constructor(
    code: ExcelErrorCode,
    message: string,
    options?: {
      severity?: ErrorSeverity;
      context?: Record<string, unknown>;
      cause?: Error;
      recoverable?: boolean;
    }
  ) {
    super(message);
    this.name = 'ExcelError';
    this.code = code;
    this.severity = options?.severity || this.getSeverityFromCode(code);
    this.context = options?.context;
    this.timestamp = Date.now();
    this.recoverable = options?.recoverable ?? this.isRecoverableByDefault(code);

    // 保留原始错误
    if (options?.cause) {
      this.cause = options.cause;
    }

    // 确保原型链正确
    Object.setPrototypeOf(this, ExcelError.prototype);
  }

  /**
   * 根据错误代码推断严重级别
   */
  private getSeverityFromCode(code: ExcelErrorCode): ErrorSeverity {
    if (code >= 9000) return ErrorSeverity.CRITICAL;
    if (code >= 6000) return ErrorSeverity.HIGH;
    if (code >= 3000) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  /**
   * 判断错误是否可恢复
   */
  private isRecoverableByDefault(code: ExcelErrorCode): boolean {
    const unrecoverableCodes = [
      ExcelErrorCode.FILE_CORRUPTED,
      ExcelErrorCode.PARSE_MEMORY_EXCEEDED,
      ExcelErrorCode.RENDER_LUCKYSHEET_NOT_LOADED,
    ];
    return !unrecoverableCodes.includes(code);
  }

  /**
   * 转换为 JSON 格式
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
      stack: this.stack,
    };
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserMessage(): string {
    return ERROR_MESSAGES[this.code] || this.message;
  }
}

/**
 * 用户友好的错误消息映射
 */
const ERROR_MESSAGES: Record<ExcelErrorCode, string> = {
  [ExcelErrorCode.FILE_NOT_FOUND]: '文件未找到',
  [ExcelErrorCode.FILE_TOO_LARGE]: '文件过大,无法加载',
  [ExcelErrorCode.FILE_INVALID_FORMAT]: '文件格式不支持',
  [ExcelErrorCode.FILE_CORRUPTED]: '文件已损坏',
  [ExcelErrorCode.FILE_LOAD_FAILED]: '文件加载失败',

  [ExcelErrorCode.PARSE_FAILED]: '文件解析失败',
  [ExcelErrorCode.PARSE_INVALID_DATA]: '数据格式无效',
  [ExcelErrorCode.PARSE_UNSUPPORTED_FORMAT]: '不支持的文件格式',
  [ExcelErrorCode.PARSE_MEMORY_EXCEEDED]: '内存不足,无法解析',

  [ExcelErrorCode.RENDER_FAILED]: '渲染失败',
  [ExcelErrorCode.RENDER_CONTAINER_NOT_FOUND]: '容器元素未找到',
  [ExcelErrorCode.RENDER_LUCKYSHEET_NOT_LOADED]: 'Luckysheet 库未加载',
  [ExcelErrorCode.RENDER_INITIALIZATION_FAILED]: '初始化失败',

  [ExcelErrorCode.EXPORT_FAILED]: '导出失败',
  [ExcelErrorCode.EXPORT_UNSUPPORTED_FORMAT]: '不支持的导出格式',
  [ExcelErrorCode.EXPORT_NO_DATA]: '没有可导出的数据',

  [ExcelErrorCode.OPERATION_NOT_ALLOWED]: '操作不被允许',
  [ExcelErrorCode.OPERATION_INVALID_RANGE]: '无效的单元格范围',
  [ExcelErrorCode.OPERATION_INVALID_VALUE]: '无效的单元格值',

  [ExcelErrorCode.WORKER_CREATION_FAILED]: 'Worker 创建失败',
  [ExcelErrorCode.WORKER_COMMUNICATION_FAILED]: 'Worker 通信失败',
  [ExcelErrorCode.WORKER_TIMEOUT]: 'Worker 执行超时',

  [ExcelErrorCode.NETWORK_REQUEST_FAILED]: '网络请求失败',
  [ExcelErrorCode.NETWORK_TIMEOUT]: '网络请求超时',

  [ExcelErrorCode.UNKNOWN_ERROR]: '未知错误',
};

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * 日志接口
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, unknown>;
  error?: Error;
}

/**
 * 日志记录器
 */
export class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private enabled = true;
  private minLevel: LogLevel = LogLevel.DEBUG;

  constructor(options?: { maxLogs?: number; enabled?: boolean; minLevel?: LogLevel }) {
    if (options?.maxLogs) this.maxLogs = options.maxLogs;
    if (options?.enabled !== undefined) this.enabled = options.enabled;
    if (options?.minLevel) this.minLevel = options.minLevel;
  }

  /**
   * 记录调试信息
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * 记录一般信息
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * 记录警告
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * 记录错误
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * 通用日志记录方法
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!this.enabled || !this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      error,
    };

    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 输出到控制台
    this.consoleLog(entry);
  }

  /**
   * 判断是否应该记录该级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= currentLevelIndex;
  }

  /**
   * 输出到控制台
   */
  private consoleLog(entry: LogEntry): void {
    const prefix = `[Excel Viewer ${entry.level.toUpperCase()}]`;
    const timestamp = new Date(entry.timestamp).toISOString();
    const message = `${prefix} ${timestamp} - ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.context || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.context || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.error || entry.context || '');
        break;
    }
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 获取指定级别的日志
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * 启用/禁用日志
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 设置最小日志级别
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

/**
 * 全局日志实例
 */
export const logger = new Logger({
  enabled: process.env.NODE_ENV !== 'production',
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
});


