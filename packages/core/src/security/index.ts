/**
 * 安全防护系统
 * 提供 XSS 防护、输入验证、CSP 支持等安全功能
 */

import { logger } from '../errors';

/**
 * XSS 防护级别
 */
export enum XSSProtectionLevel {
  /** 无防护 */
  NONE = 'none',
  /** 基础防护 */
  BASIC = 'basic',
  /** 严格防护 */
  STRICT = 'strict',
}

/**
 * 安全配置
 */
export interface SecurityConfig {
  /** XSS 防护级别 */
  xssProtection: XSSProtectionLevel;
  /** 最大文件大小 (字节) */
  maxFileSize: number;
  /** 允许的文件类型 */
  allowedFileTypes: string[];
  /** 是否启用 CSP */
  enableCSP: boolean;
  /** 是否允许执行公式 */
  allowFormulaExecution: boolean;
  /** 公式执行超时 (毫秒) */
  formulaTimeout: number;
}

/**
 * 安全管理器
 */
export class SecurityManager {
  private config: SecurityConfig;

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      xssProtection: XSSProtectionLevel.STRICT,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedFileTypes: [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
      ],
      enableCSP: true,
      allowFormulaExecution: true,
      formulaTimeout: 5000,
      ...config,
    };

    logger.info('Security manager initialized', {
      xssProtection: this.config.xssProtection,
      maxFileSize: this.config.maxFileSize,
    });
  }

  /**
   * HTML 转义
   */
  escapeHTML(text: string): string {
    if (this.config.xssProtection === XSSProtectionLevel.NONE) {
      return text;
    }

    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return String(text).replace(/[&<>"'/]/g, (char) => escapeMap[char] || char);
  }

  /**
   * HTML 反转义
   */
  unescapeHTML(text: string): string {
    const unescapeMap: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x2F;': '/',
    };

    return String(text).replace(/&(?:amp|lt|gt|quot|#x27|#x2F);/g, (entity) => unescapeMap[entity] || entity);
  }

  /**
   * 清理用户输入
   */
  sanitizeInput(input: string): string {
    if (this.config.xssProtection === XSSProtectionLevel.NONE) {
      return input;
    }

    let sanitized = input;

    // 移除脚本标签
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // 移除事件处理器
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

    // 移除 javascript: 协议
    sanitized = sanitized.replace(/javascript:/gi, '');

    // 严格模式下的额外处理
    if (this.config.xssProtection === XSSProtectionLevel.STRICT) {
      // 移除所有 HTML 标签
      sanitized = sanitized.replace(/<[^>]*>/g, '');

      // 移除潜在的注入代码
      sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    }

    return sanitized;
  }

  /**
   * 验证文件
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // 检查文件大小
    if (file.size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `文件大小超过限制 (${this.formatFileSize(this.config.maxFileSize)})`,
      };
    }

    // 检查文件类型
    if (!this.config.allowedFileTypes.includes(file.type)) {
      // 也检查文件扩展名
      const extension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['xlsx', 'xls', 'csv'];

      if (!extension || !allowedExtensions.includes(extension)) {
        return {
          valid: false,
          error: '不支持的文件类型',
        };
      }
    }

    // 检查文件名
    const filename = this.sanitizeInput(file.name);
    if (filename !== file.name) {
      return {
        valid: false,
        error: '文件名包含非法字符',
      };
    }

    return { valid: true };
  }

  /**
   * 验证单元格值
   */
  validateCellValue(value: any): { valid: boolean; sanitized: any; error?: string } {
    if (value === null || value === undefined) {
      return { valid: true, sanitized: value };
    }

    // 字符串值需要清理
    if (typeof value === 'string') {
      const sanitized = this.sanitizeInput(value);

      // 检查是否包含潜在的公式注入
      if (this.isPotentialFormulaInjection(value)) {
        logger.warn('Potential formula injection detected', { value });
        return {
          valid: false,
          sanitized: sanitized,
          error: '检测到潜在的公式注入攻击',
        };
      }

      return { valid: true, sanitized };
    }

    return { valid: true, sanitized: value };
  }

  /**
   * 检测公式注入
   */
  private isPotentialFormulaInjection(value: string): boolean {
    if (this.config.xssProtection === XSSProtectionLevel.NONE) {
      return false;
    }

    // 检查是否以危险字符开头
    const dangerousStarters = ['=', '+', '-', '@', '\t', '\r'];
    const startsWithDangerous = dangerousStarters.some((starter) => value.startsWith(starter));

    if (!startsWithDangerous) {
      return false;
    }

    // 检查是否包含潜在危险函数
    const dangerousFunctions = [
      'IMPORTXML',
      'IMPORTFEED',
      'IMPORTHTML',
      'IMPORTRANGE',
      'IMPORTDATA',
      'HYPERLINK',
      'DDE',
    ];

    const upperValue = value.toUpperCase();
    return dangerousFunctions.some((func) => upperValue.includes(func));
  }

  /**
   * 安全执行公式
   */
  async safeExecuteFormula(formula: string, executor: () => any): Promise<any> {
    if (!this.config.allowFormulaExecution) {
      throw new Error('公式执行已被禁用');
    }

    // 验证公式
    const sanitized = this.sanitizeInput(formula);
    if (this.isPotentialFormulaInjection(sanitized)) {
      throw new Error('检测到不安全的公式');
    }

    // 设置超时执行
    return Promise.race([
      executor(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('公式执行超时')), this.config.formulaTimeout)
      ),
    ]);
  }

  /**
   * 设置 CSP 策略
   */
  setContentSecurityPolicy(): void {
    if (!this.config.enableCSP || typeof document === 'undefined') {
      return;
    }

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Excel 需要 eval
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ');

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = csp;

    // 检查是否已存在
    const existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existing) {
      existing.remove();
    }

    document.head.appendChild(meta);
    logger.info('CSP policy set');
  }

  /**
   * 验证 URL
   */
  validateURL(url: string): boolean {
    try {
      const urlObj = new URL(url);

      // 只允许 HTTP(S) 协议
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }

      // 检查是否包含危险字符
      const dangerous = ['<', '>', '"', "'", '`', '{', '}', '|', '\\', '^', '[', ']'];
      return !dangerous.some((char) => url.includes(char));
    } catch {
      return false;
    }
  }

  /**
   * 生成安全令牌
   */
  generateToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';

    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return token;
  }

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * 获取配置
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SecurityConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    logger.info('Security config updated', config);
  }

  /**
   * 审计日志
   */
  auditLog(action: string, details?: Record<string, any>): void {
    logger.info(`[AUDIT] ${action}`, details);
  }
}

/**
 * 全局安全管理器实例
 */
let globalSecurityManager: SecurityManager | null = null;

/**
 * 获取全局安全管理器
 */
export function getSecurityManager(config?: Partial<SecurityConfig>): SecurityManager {
  if (!globalSecurityManager) {
    globalSecurityManager = new SecurityManager(config);
  }
  return globalSecurityManager;
}

/**
 * 快捷函数：HTML 转义
 */
export function escapeHTML(text: string): string {
  return getSecurityManager().escapeHTML(text);
}

/**
 * 快捷函数：清理输入
 */
export function sanitizeInput(input: string): string {
  return getSecurityManager().sanitizeInput(input);
}


