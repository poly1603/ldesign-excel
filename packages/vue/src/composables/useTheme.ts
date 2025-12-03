import { ref, type Ref } from 'vue'
import type { Theme } from '@excel-renderer/core'

/**
 * useTheme Composable
 * 用于管理主题
 */
export function useTheme(initialTheme: string = 'light') {
  const currentTheme = ref<string>(initialTheme)
  const customThemes = ref<Map<string, Theme>>(new Map())

  /**
   * 切换主题
   */
  function setTheme(theme: string): void {
    currentTheme.value = theme
  }

  /**
   * 注册自定义主题
   */
  function registerTheme(theme: Theme): void {
    customThemes.value.set(theme.name, theme)
  }

  /**
   * 获取主题
   */
  function getTheme(name: string): Theme | undefined {
    return customThemes.value.get(name)
  }

  /**
   * 切换到下一个主题（在light和dark之间切换）
   */
  function toggleTheme(): void {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  }

  return {
    currentTheme,
    customThemes,
    setTheme,
    registerTheme,
    getTheme,
    toggleTheme,
  }
}