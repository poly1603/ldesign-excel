/**
 * 国际化系统
 * 支持多语言切换和本地化
 */

import { logger } from '../errors';

/**
 * 支持的语言类型
 */
export type SupportedLocale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'fr-FR' | 'de-DE' | 'es-ES' | 'pt-BR' | 'ru-RU';

/**
 * 翻译映射接口
 */
export interface TranslationMap {
  [key: string]: string | TranslationMap;
}

/**
 * 日期格式配置
 */
export interface DateFormatConfig {
  short: string;
  medium: string;
  long: string;
  full: string;
}

/**
 * 数字格式配置
 */
export interface NumberFormatConfig {
  decimal: string;
  thousands: string;
  currency: string;
  currencyPosition: 'before' | 'after';
}

/**
 * 本地化配置
 */
export interface LocaleConfig {
  locale: SupportedLocale;
  translations: TranslationMap;
  dateFormat: DateFormatConfig;
  numberFormat: NumberFormatConfig;
}

/**
 * 中文翻译
 */
const zhCN: TranslationMap = {
  common: {
    ok: '确定',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    close: '关闭',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    warning: '警告',
    info: '信息',
  },
  toolbar: {
    undo: '撤销',
    redo: '重做',
    cut: '剪切',
    copy: '复制',
    paste: '粘贴',
    bold: '加粗',
    italic: '斜体',
    underline: '下划线',
    strikethrough: '删除线',
    fontColor: '字体颜色',
    backgroundColor: '背景颜色',
    merge: '合并单元格',
    unmerge: '取消合并',
    align: '对齐',
    format: '格式',
  },
  menu: {
    file: '文件',
    edit: '编辑',
    view: '视图',
    insert: '插入',
    format: '格式',
    data: '数据',
    tools: '工具',
    help: '帮助',
  },
  dialog: {
    confirmDelete: '确定要删除吗?',
    unsavedChanges: '有未保存的更改',
    fileTooBig: '文件太大',
    invalidFile: '无效的文件格式',
  },
  validation: {
    required: '此字段为必填项',
    invalidNumber: '请输入有效的数字',
    invalidDate: '请输入有效的日期',
    invalidEmail: '请输入有效的邮箱',
  },
};

/**
 * 英文翻译
 */
const enUS: TranslationMap = {
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
  },
  toolbar: {
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    strikethrough: 'Strikethrough',
    fontColor: 'Font Color',
    backgroundColor: 'Background Color',
    merge: 'Merge Cells',
    unmerge: 'Unmerge Cells',
    align: 'Align',
    format: 'Format',
  },
  menu: {
    file: 'File',
    edit: 'Edit',
    view: 'View',
    insert: 'Insert',
    format: 'Format',
    data: 'Data',
    tools: 'Tools',
    help: 'Help',
  },
  dialog: {
    confirmDelete: 'Are you sure you want to delete?',
    unsavedChanges: 'You have unsaved changes',
    fileTooBig: 'File is too big',
    invalidFile: 'Invalid file format',
  },
  validation: {
    required: 'This field is required',
    invalidNumber: 'Please enter a valid number',
    invalidDate: 'Please enter a valid date',
    invalidEmail: 'Please enter a valid email',
  },
};

/**
 * 国际化管理器
 */
export class I18nManager {
  private currentLocale: SupportedLocale = 'zh-CN';
  private translations: Map<SupportedLocale, TranslationMap> = new Map();
  private dateFormats: Map<SupportedLocale, DateFormatConfig> = new Map();
  private numberFormats: Map<SupportedLocale, NumberFormatConfig> = new Map();
  private listeners: Set<(locale: SupportedLocale) => void> = new Set();

  constructor(initialLocale: SupportedLocale = 'zh-CN') {
    this.currentLocale = initialLocale;
    this.initializeDefaultLocales();
  }

  /**
   * 初始化默认语言
   */
  private initializeDefaultLocales(): void {
    // 中文
    this.translations.set('zh-CN', zhCN);
    this.dateFormats.set('zh-CN', {
      short: 'YYYY/MM/DD',
      medium: 'YYYY年MM月DD日',
      long: 'YYYY年MM月DD日 HH:mm',
      full: 'YYYY年MM月DD日 HH:mm:ss',
    });
    this.numberFormats.set('zh-CN', {
      decimal: '.',
      thousands: ',',
      currency: '¥',
      currencyPosition: 'before',
    });

    // 英文
    this.translations.set('en-US', enUS);
    this.dateFormats.set('en-US', {
      short: 'MM/DD/YYYY',
      medium: 'MMM DD, YYYY',
      long: 'MMM DD, YYYY HH:mm',
      full: 'MMMM DD, YYYY HH:mm:ss',
    });
    this.numberFormats.set('en-US', {
      decimal: '.',
      thousands: ',',
      currency: '$',
      currencyPosition: 'before',
    });

    // 可以继续添加其他语言...
    logger.info(`Initialized ${this.translations.size} locales`);
  }

  /**
   * 获取当前语言
   */
  getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  /**
   * 设置当前语言
   */
  setLocale(locale: SupportedLocale): void {
    if (!this.translations.has(locale)) {
      logger.warn(`Locale ${locale} not found, falling back to ${this.currentLocale}`);
      return;
    }

    const oldLocale = this.currentLocale;
    this.currentLocale = locale;

    logger.info(`Locale changed from ${oldLocale} to ${locale}`);

    // 通知监听器
    this.listeners.forEach((listener) => {
      try {
        listener(locale);
      } catch (error) {
        logger.error('Error in locale change listener', error as Error);
      }
    });
  }

  /**
   * 翻译文本
   */
  t(key: string, params?: Record<string, any>): string {
    const translations = this.translations.get(this.currentLocale);
    if (!translations) {
      return key;
    }

    // 支持点号分隔的嵌套键
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        logger.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // 替换参数
    if (params) {
      return this.interpolate(value, params);
    }

    return value;
  }

  /**
   * 插值替换
   */
  private interpolate(template: string, params: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return params[key] !== undefined ? String(params[key]) : `{{${key}}}`;
    });
  }

  /**
   * 格式化日期
   */
  formatDate(date: Date, format: keyof DateFormatConfig | string = 'medium'): string {
    const dateFormat = this.dateFormats.get(this.currentLocale);
    if (!dateFormat) {
      return date.toLocaleDateString();
    }

    // 如果是预定义格式
    if (format in dateFormat) {
      const pattern = dateFormat[format as keyof DateFormatConfig];
      return this.applyDateFormat(date, pattern);
    }

    // 自定义格式
    return this.applyDateFormat(date, format);
  }

  /**
   * 应用日期格式
   */
  private applyDateFormat(date: Date, pattern: string): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    return pattern
      .replace('YYYY', String(year))
      .replace('MM', String(month).padStart(2, '0'))
      .replace('DD', String(day).padStart(2, '0'))
      .replace('HH', String(hour).padStart(2, '0'))
      .replace('mm', String(minute).padStart(2, '0'))
      .replace('ss', String(second).padStart(2, '0'));
  }

  /**
   * 格式化数字
   */
  formatNumber(num: number, decimals: number = 2): string {
    const numberFormat = this.numberFormats.get(this.currentLocale);
    if (!numberFormat) {
      return num.toFixed(decimals);
    }

    const parts = num.toFixed(decimals).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, numberFormat.thousands);
    const decimalPart = parts[1] || '';

    return decimalPart ? `${integerPart}${numberFormat.decimal}${decimalPart}` : integerPart;
  }

  /**
   * 格式化货币
   */
  formatCurrency(amount: number, decimals: number = 2): string {
    const numberFormat = this.numberFormats.get(this.currentLocale);
    if (!numberFormat) {
      return amount.toFixed(decimals);
    }

    const formatted = this.formatNumber(amount, decimals);

    return numberFormat.currencyPosition === 'before'
      ? `${numberFormat.currency}${formatted}`
      : `${formatted}${numberFormat.currency}`;
  }

  /**
   * 注册语言包
   */
  registerLocale(locale: SupportedLocale, config: Partial<LocaleConfig>): void {
    if (config.translations) {
      this.translations.set(locale, config.translations);
    }

    if (config.dateFormat) {
      this.dateFormats.set(locale, config.dateFormat);
    }

    if (config.numberFormat) {
      this.numberFormats.set(locale, config.numberFormat);
    }

    logger.info(`Locale registered: ${locale}`);
  }

  /**
   * 监听语言变化
   */
  onLocaleChange(listener: (locale: SupportedLocale) => void): void {
    this.listeners.add(listener);
  }

  /**
   * 取消监听语言变化
   */
  offLocaleChange(listener: (locale: SupportedLocale) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * 获取所有支持的语言
   */
  getSupportedLocales(): SupportedLocale[] {
    return Array.from(this.translations.keys());
  }

  /**
   * 检查是否支持某种语言
   */
  isSupported(locale: string): boolean {
    return this.translations.has(locale as SupportedLocale);
  }

  /**
   * 导出当前语言包
   */
  export(): TranslationMap | undefined {
    return this.translations.get(this.currentLocale);
  }
}

/**
 * 全局 I18n 实例
 */
let globalI18n: I18nManager | null = null;

/**
 * 获取全局 I18n 实例
 */
export function getI18n(locale?: SupportedLocale): I18nManager {
  if (!globalI18n) {
    globalI18n = new I18nManager(locale);
  }
  return globalI18n;
}

/**
 * 快捷翻译函数
 */
export function t(key: string, params?: Record<string, any>): string {
  return getI18n().t(key, params);
}


