import type {
  ExcelRendererOptions,
  WorkbookData,
  SheetData,
  Viewport,
  EventType,
  EventHandler,
  Theme,
  LocaleCode,
} from './types'
import { ExcelParser } from './parser/ExcelParser'
import { Renderer } from './renderer/Renderer'
import { ThemeManager } from './theme/ThemeManager'
import { I18nManager } from './i18n/I18nManager'

/**
 * Excel渲染器主类
 * 这是整个库的核心入口，负责协调各个模块
 */
export class ExcelRenderer {
  private options: ExcelRendererOptions
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private parser: ExcelParser
  private renderer: Renderer
  private themeManager: ThemeManager
  private i18nManager: I18nManager
  private workbook: WorkbookData | null = null
  private activeSheetIndex: number = 0
  private viewport: Viewport
  private eventHandlers: Map<EventType, Set<EventHandler>> = new Map()
  private isDestroyed: boolean = false

  constructor(options: ExcelRendererOptions) {
    this.options = this.mergeOptions(options)
    this.container = options.container

    if (!this.container) {
      throw new Error('容器元素不能为空')
    }

    // 初始化主题管理器
    this.themeManager = new ThemeManager(this.options.theme || 'light')

    // 初始化国际化管理器
    this.i18nManager = new I18nManager(this.options.locale || 'zh-CN')

    // 初始化解析器
    this.parser = new ExcelParser()

    // 创建Canvas
    this.canvas = this.createCanvas()

    // 初始化渲染器
    this.renderer = new Renderer(this.canvas, this.themeManager.getCurrentTheme())

    // 初始化视口
    this.viewport = {
      scrollTop: 0,
      scrollLeft: 0,
      width: this.canvas.clientWidth,
      height: this.canvas.clientHeight,
      zoom: this.options.zoom || 1,
    }

    // 设置事件监听
    this.setupEventListeners()

    // 如果提供了初始数据，加载它
    if (this.options.data) {
      this.loadData(this.options.data)
    }
  }

  /**
   * 合并默认选项
   */
  private mergeOptions(options: ExcelRendererOptions): ExcelRendererOptions {
    return {
      ...options,
      theme: options.theme || 'light',
      locale: options.locale || 'zh-CN',
      editable: options.editable !== undefined ? options.editable : false,
      features: {
        formula: true,
        filter: true,
        sort: true,
        search: true,
        contextMenu: true,
        toolbar: false,
        ...options.features,
      },
      performance: {
        virtualScroll: true,
        workerEnabled: false,
        cacheEnabled: true,
        bufferRows: 5,
        bufferCols: 3,
        ...options.performance,
      },
      style: {
        rowHeight: 25,
        colWidth: 100,
        fontSize: 14,
        fontFamily: 'Arial, sans-serif',
        showGridLines: true,
        showRowNumbers: true,
        showColNumbers: true,
        ...options.style,
      },
    }
  }

  /**
   * 创建Canvas元素
   */
  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    this.container.appendChild(canvas)
    return canvas
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    // 窗口大小变化
    window.addEventListener('resize', this.handleResize)

    // Canvas交互事件
    this.canvas.addEventListener('click', this.handleClick)
    this.canvas.addEventListener('dblclick', this.handleDoubleClick)
    this.canvas.addEventListener('contextmenu', this.handleContextMenu)
    this.canvas.addEventListener('wheel', this.handleWheel)

    // 主题变化
    this.themeManager.onThemeChange((theme) => {
      this.renderer.setTheme(theme)
      this.render()
    })

    // 语言变化
    this.i18nManager.onLocaleChange(() => {
      this.render()
    })
  }

  /**
   * 加载Excel文件
   */
  async loadFile(file: File): Promise<void> {
    try {
      this.workbook = await this.parser.parse(file)
      this.activeSheetIndex = this.options.activeSheet || 0

      // 触发加载完成事件
      this.emit('load', {
        type: 'load',
        timestamp: Date.now(),
        sheetCount: this.workbook.sheets.length,
      })

      // 渲染第一个工作表
      this.render()

      // 调用回调
      if (this.options.onLoad) {
        this.options.onLoad(this.workbook)
      }
    } catch (error) {
      const errorEvent = {
        type: 'error' as const,
        timestamp: Date.now(),
        error: error as Error,
        message: (error as Error).message,
      }

      this.emit('error', errorEvent)

      if (this.options.onError) {
        this.options.onError(error as Error)
      }

      throw error
    }
  }

  /**
   * 加载工作簿数据
   */
  loadData(data: WorkbookData): void {
    this.workbook = data
    this.activeSheetIndex = this.options.activeSheet || 0
    this.render()

    if (this.options.onLoad) {
      this.options.onLoad(data)
    }
  }

  /**
   * 渲染当前工作表
   */
  private render(): void {
    if (!this.workbook || this.isDestroyed) return

    const sheet = this.workbook.sheets[this.activeSheetIndex]
    if (!sheet) return

    this.renderer.render(sheet, this.viewport)
  }

  /**
   * 设置活动工作表
   */
  setActiveSheet(index: number): void {
    if (!this.workbook) {
      throw new Error('未加载工作簿')
    }

    if (index < 0 || index >= this.workbook.sheets.length) {
      throw new Error(`工作表索引 ${index} 超出范围`)
    }

    const oldIndex = this.activeSheetIndex
    this.activeSheetIndex = index

    this.emit('sheetChange', {
      type: 'sheetChange',
      timestamp: Date.now(),
      sheetIndex: index,
      sheetName: this.workbook.sheets[index].name,
      oldSheetIndex: oldIndex,
    })

    this.render()
  }

  /**
   * 获取活动工作表
   */
  getActiveSheet(): SheetData | null {
    if (!this.workbook) return null
    return this.workbook.sheets[this.activeSheetIndex]
  }

  /**
   * 获取工作表数量
   */
  getSheetCount(): number {
    return this.workbook?.sheets.length || 0
  }

  /**
   * 获取所有工作表名称
   */
  getSheetNames(): string[] {
    return this.workbook?.sheets.map((sheet) => sheet.name) || []
  }

  /**
   * 获取单元格值
   */
  getCellValue(ref: string): any {
    const sheet = this.getActiveSheet()
    if (!sheet) return null
    return sheet.cells.get(ref)?.value
  }

  /**
   * 设置主题
   */
  setTheme(theme: string | Theme): void {
    this.themeManager.setTheme(theme)
  }

  /**
   * 获取当前主题
   */
  getTheme(): Theme {
    return this.themeManager.getCurrentTheme()
  }

  /**
   * 设置语言
   */
  setLocale(locale: LocaleCode): void {
    this.i18nManager.setLocale(locale)
  }

  /**
   * 获取当前语言
   */
  getLocale(): LocaleCode {
    return this.i18nManager.getCurrentLocale()
  }

  /**
   * 翻译文本
   */
  t(key: string): string {
    return this.i18nManager.t(key)
  }

  /**
   * 监听事件
   */
  on(event: EventType, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  /**
   * 取消监听事件
   */
  off(event: EventType, handler: EventHandler): void {
    this.eventHandlers.get(event)?.delete(handler)
  }

  /**
   * 触发事件
   */
  private emit(event: EventType, data: any): void {
    this.eventHandlers.get(event)?.forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error(`事件处理器错误 [${event}]:`, error)
      }
    })
  }

  /**
   * 处理窗口大小变化
   */
  private handleResize = (): void => {
    this.renderer.resize()
    this.viewport.width = this.canvas.clientWidth
    this.viewport.height = this.canvas.clientHeight
    this.render()
  }

  /**
   * 处理点击事件
   */
  private handleClick = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left + this.viewport.scrollLeft
    const y = e.clientY - rect.top + this.viewport.scrollTop

    const scroller = this.renderer.getScroller()
    const { row, col } = scroller.getCellByPosition(x, y)

    const sheet = this.getActiveSheet()
    if (!sheet) return

    const ref = ExcelParser.toRef(row, col)
    const cell = sheet.cells.get(ref)

    if (this.options.onCellClick) {
      this.options.onCellClick({
        type: 'cellClick',
        timestamp: Date.now(),
        row,
        col,
        cell: cell || ({} as any),
        button: e.button,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
      })
    }
  }

  /**
   * 处理双击事件
   */
  private handleDoubleClick = (e: MouseEvent): void => {
    // 双击事件处理
  }

  /**
   * 处理右键菜单
   */
  private handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault()
  }

  /**
   * 处理滚轮事件
   */
  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault()

    // 更新滚动位置
    this.viewport.scrollTop += e.deltaY
    this.viewport.scrollLeft += e.deltaX

    // 限制滚动范围
    const sheet = this.getActiveSheet()
    if (sheet) {
      const scroller = this.renderer.getScroller()
      const maxScrollTop = scroller.getTotalHeight(sheet.rowCount) - this.viewport.height
      const maxScrollLeft = scroller.getTotalWidth(sheet.colCount) - this.viewport.width

      this.viewport.scrollTop = Math.max(0, Math.min(this.viewport.scrollTop, maxScrollTop))
      this.viewport.scrollLeft = Math.max(0, Math.min(this.viewport.scrollLeft, maxScrollLeft))
    }

    this.render()
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    if (this.isDestroyed) return

    // 移除事件监听
    window.removeEventListener('resize', this.handleResize)
    this.canvas.removeEventListener('click', this.handleClick)
    this.canvas.removeEventListener('dblclick', this.handleDoubleClick)
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu)
    this.canvas.removeEventListener('wheel', this.handleWheel)

    // 清除Canvas
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }

    // 清除事件处理器
    this.eventHandlers.clear()

    this.isDestroyed = true
  }
}