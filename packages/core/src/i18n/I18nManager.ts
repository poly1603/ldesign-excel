import type { LocaleMessages, LocaleCode } from '../types'
import { zhCN, enUS } from './locales'

/**
 * 国际化管理器
 * 负责管理多语言翻译
 */
export class I18nManager {
  private locales: Map<LocaleCode, LocaleMessages>
  private currentLocale: LocaleCode
  private listeners: Set<(locale: LocaleCode) => void>

  constructor(initialLocale: LocaleCode = 'zh-CN') {
    this.locales = new Map()
    this.listeners = new Set()

    // 注册内置语言包
    this.registerLocale('zh-CN', zhCN)
    this.registerLocale('en-US', enUS)

    // 设置初始语言
    if (!this.locales.has(initialLocale)) {
      throw new Error(`语言包 "${initialLocale}" 不存在`)
    }
    this.currentLocale = initialLocale
  }

  /**
   * 注册语言包
   */
  registerLocale(code: LocaleCode, messages: LocaleMessages): void {
    this.locales.set(code, messages)
  }

  /**
   * 获取语言包
   */
  getLocale(code: LocaleCode): LocaleMessages | undefined {
    return this.locales.get(code)
  }

  /**
   * 获取当前语言代码
   */
  getCurrentLocale(): LocaleCode {
    return this.currentLocale
  }

  /**
   * 设置当前语言
   */
  setLocale(code: LocaleCode): void {
    if (!this.locales.has(code)) {
      throw new Error(`语言包 "${code}" 不存在`)
    }
    this.currentLocale = code
    this.notifyListeners()
  }

  /**
   * 翻译文本
   * @param key - 翻译键（支持点号分隔，如 "toolbar.zoomIn"）
   * @param params - 替换参数（可选）
   */
  t(key: string, params?: Record<string, string | number>): string {
    const messages = this.locales.get(this.currentLocale)
    if (!messages) {
      return key
    }

    // 使用点号分隔的键获取嵌套值
    const value = this.getNestedValue(messages, key)
    if (typeof value !== 'string') {
      return key
    }

    // 替换参数（如果有）
    if (params) {
      return this.replaceParams(value, params)
    }

    return value
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.')
    let current = obj

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return undefined
      }
    }

    return current
  }

  /**
   * 替换参数
   * 例如: "Hello {name}" + {name: "World"} => "Hello World"
   */
  private replaceParams(text: string, params: Record<string, string | number>): string {
    let result = text

    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
    }

    return result
  }

  /**
   * 获取所有可用语言代码
   */
  getAvailableLocales(): LocaleCode[] {
    return Array.from(this.locales.keys())
  }

  /**
   * 监听语言变化
   */
  onLocaleChange(listener: (locale: LocaleCode) => void): () => void {
    this.listeners.add(listener)
    // 返回取消监听函数
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(this.currentLocale)
    })
  }
}