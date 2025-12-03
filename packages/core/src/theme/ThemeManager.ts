import type { Theme } from '../types'
import { lightTheme, darkTheme } from './themes'

/**
 * 主题管理器
 * 负责管理和切换主题
 */
export class ThemeManager {
  private themes: Map<string, Theme>
  private currentTheme: Theme
  private listeners: Set<(theme: Theme) => void>

  constructor(initialTheme: string | Theme = 'light') {
    this.themes = new Map()
    this.listeners = new Set()

    // 注册内置主题
    this.registerTheme(lightTheme)
    this.registerTheme(darkTheme)

    // 设置初始主题
    if (typeof initialTheme === 'string') {
      const theme = this.themes.get(initialTheme)
      if (!theme) {
        throw new Error(`主题 "${initialTheme}" 不存在`)
      }
      this.currentTheme = theme
    } else {
      this.currentTheme = initialTheme
      this.registerTheme(initialTheme)
    }
  }

  /**
   * 注册主题
   */
  registerTheme(theme: Theme): void {
    this.themes.set(theme.name, theme)
  }

  /**
   * 获取主题
   */
  getTheme(name: string): Theme | undefined {
    return this.themes.get(name)
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme(): Theme {
    return this.currentTheme
  }

  /**
   * 设置当前主题
   */
  setTheme(nameOrTheme: string | Theme): void {
    let theme: Theme

    if (typeof nameOrTheme === 'string') {
      const foundTheme = this.themes.get(nameOrTheme)
      if (!foundTheme) {
        throw new Error(`主题 "${nameOrTheme}" 不存在`)
      }
      theme = foundTheme
    } else {
      theme = nameOrTheme
      // 如果是新主题，注册它
      if (!this.themes.has(theme.name)) {
        this.registerTheme(theme)
      }
    }

    this.currentTheme = theme
    this.notifyListeners()
  }

  /**
   * 获取所有可用主题名称
   */
  getThemeNames(): string[] {
    return Array.from(this.themes.keys())
  }

  /**
   * 监听主题变化
   */
  onThemeChange(listener: (theme: Theme) => void): () => void {
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
      listener(this.currentTheme)
    })
  }

  /**
   * 创建自定义主题（基于现有主题）
   */
  createTheme(name: string, baseTheme: string, overrides: Partial<Theme>): Theme {
    const base = this.themes.get(baseTheme)
    if (!base) {
      throw new Error(`基础主题 "${baseTheme}" 不存在`)
    }

    const customTheme: Theme = {
      ...base,
      ...overrides,
      name,
      colors: {
        ...base.colors,
        ...overrides.colors,
      },
      fonts: {
        ...base.fonts,
        ...overrides.fonts,
      },
      spacing: {
        ...base.spacing,
        ...overrides.spacing,
      },
      borders: {
        ...base.borders,
        ...overrides.borders,
      },
    }

    this.registerTheme(customTheme)
    return customTheme
  }
}