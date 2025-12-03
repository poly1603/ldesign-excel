import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { ExcelRenderer } from '@excel-renderer/core'
import type { ExcelRendererOptions, WorkbookData, SheetData, Theme, LocaleCode } from '@excel-renderer/core'

/**
 * useExcelRenderer Composable
 * 用于在Vue组件中使用Excel渲染器
 */
export function useExcelRenderer(options: Omit<ExcelRendererOptions, 'container'>) {
  const container = ref<HTMLElement>()
  const renderer = ref<ExcelRenderer>()
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const workbook = ref<WorkbookData | null>(null)

  /**
   * 初始化渲染器
   */
  function init() {
    if (!container.value) {
      console.warn('容器元素未准备好')
      return
    }

    try {
      renderer.value = new ExcelRenderer({
        ...options,
        container: container.value,
      })
    } catch (err) {
      error.value = err as Error
      console.error('初始化渲染器失败:', err)
    }
  }

  /**
   * 加载Excel文件
   */
  async function loadFile(file: File): Promise<void> {
    if (!renderer.value) {
      throw new Error('渲染器未初始化')
    }

    isLoading.value = true
    error.value = null

    try {
      await renderer.value.loadFile(file)
      workbook.value = renderer.value.getActiveSheet() as any
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 加载工作簿数据
   */
  function loadData(data: WorkbookData): void {
    if (!renderer.value) {
      throw new Error('渲染器未初始化')
    }

    renderer.value.loadData(data)
    workbook.value = data
  }

  /**
   * 获取单元格值
   */
  function getCellValue(ref: string): any {
    return renderer.value?.getCellValue(ref)
  }

  /**
   * 设置活动工作表
   */
  function setActiveSheet(index: number): void {
    renderer.value?.setActiveSheet(index)
  }

  /**
   * 获取活动工作表
   */
  function getActiveSheet(): SheetData | null {
    return renderer.value?.getActiveSheet() || null
  }

  /**
   * 获取工作表数量
   */
  function getSheetCount(): number {
    return renderer.value?.getSheetCount() || 0
  }

  /**
   * 获取所有工作表名称
   */
  function getSheetNames(): string[] {
    return renderer.value?.getSheetNames() || []
  }

  /**
   * 设置主题
   */
  function setTheme(theme: string | Theme): void {
    renderer.value?.setTheme(theme)
  }

  /**
   * 设置语言
   */
  function setLocale(locale: LocaleCode): void {
    renderer.value?.setLocale(locale)
  }

  /**
   * 翻译文本
   */
  function t(key: string): string {
    return renderer.value?.t(key) || key
  }

  /**
   * 销毁渲染器
   */
  function destroy(): void {
    if (renderer.value) {
      renderer.value.destroy()
      renderer.value = undefined
    }
  }

  // 生命周期
  onMounted(() => {
    init()
  })

  onUnmounted(() => {
    destroy()
  })

  return {
    // Refs
    container,
    renderer,
    isLoading,
    error,
    workbook,

    // Methods
    init,
    loadFile,
    loadData,
    getCellValue,
    setActiveSheet,
    getActiveSheet,
    getSheetCount,
    getSheetNames,
    setTheme,
    setLocale,
    t,
    destroy,
  }
}