import type { Viewport, CellData, SheetData, CellRange, Theme } from '../types'
import { VirtualScroller } from './VirtualScroller'
import { ExcelParser } from '../parser/ExcelParser'

/**
 * Canvas渲染器
 * 负责将Excel数据渲染到Canvas上
 */
export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private scroller: VirtualScroller
  private theme: Theme
  private dpr: number

  constructor(canvas: HTMLCanvasElement, theme: Theme) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.theme = theme
    this.dpr = window.devicePixelRatio || 1
    this.scroller = new VirtualScroller({
      rowHeight: theme.spacing.rowHeight,
      colWidth: theme.spacing.colWidth,
    })

    // 设置Canvas分辨率
    this.setupCanvas()
  }

  /**
   * 设置Canvas分辨率以支持高DPI屏幕
   */
  private setupCanvas(): void {
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = rect.width * this.dpr
    this.canvas.height = rect.height * this.dpr
    this.canvas.style.width = `${rect.width}px`
    this.canvas.style.height = `${rect.height}px`
    this.ctx.scale(this.dpr, this.dpr)
  }

  /**
   * 更新主题
   */
  setTheme(theme: Theme): void {
    this.theme = theme
    this.scroller = new VirtualScroller({
      rowHeight: theme.spacing.rowHeight,
      colWidth: theme.spacing.colWidth,
    })
  }

  /**
   * 设置行高和列宽
   */
  setDimensions(rowHeights: Map<number, number>, colWidths: Map<number, number>): void {
    this.scroller.setRowHeights(rowHeights)
    this.scroller.setColWidths(colWidths)
  }

  /**
   * 渲染工作表
   */
  render(sheet: SheetData, viewport: Viewport): void {
    // 清空画布
    this.clear()

    // 设置行高和列宽
    this.setDimensions(sheet.rowHeights, sheet.colWidths)

    // 获取可见范围
    const range = this.scroller.getVisibleRange(viewport)

    // 保存上下文状态
    this.ctx.save()

    // 绘制背景
    this.drawBackground()

    // 绘制网格
    this.drawGrid(range, viewport)

    // 绘制单元格内容
    this.drawCells(sheet, range, viewport)

    // 绘制冻结线
    if (sheet.frozenRows > 0 || sheet.frozenCols > 0) {
      this.drawFrozenLines(sheet, viewport)
    }

    // 恢复上下文状态
    this.ctx.restore()
  }

  /**
   * 清空画布
   */
  private clear(): void {
    const width = this.canvas.width / this.dpr
    const height = this.canvas.height / this.dpr
    this.ctx.clearRect(0, 0, width, height)
  }

  /**
   * 绘制背景
   */
  private drawBackground(): void {
    const width = this.canvas.width / this.dpr
    const height = this.canvas.height / this.dpr

    this.ctx.fillStyle = this.theme.colors.background
    this.ctx.fillRect(0, 0, width, height)
  }

  /**
   * 绘制网格线
   */
  private drawGrid(range: CellRange, viewport: Viewport): void {
    this.ctx.strokeStyle = this.theme.colors.grid
    this.ctx.lineWidth = 1

    const canvasWidth = this.canvas.width / this.dpr
    const canvasHeight = this.canvas.height / this.dpr

    // 绘制垂直线
    for (let col = range.startCol; col <= range.endCol; col++) {
      const x = this.scroller.getColX(col) - viewport.scrollLeft
      if (x >= 0 && x <= canvasWidth) {
        this.ctx.beginPath()
        this.ctx.moveTo(x, 0)
        this.ctx.lineTo(x, canvasHeight)
        this.ctx.stroke()
      }
    }

    // 绘制水平线
    for (let row = range.startRow; row <= range.endRow; row++) {
      const y = this.scroller.getRowY(row) - viewport.scrollTop
      if (y >= 0 && y <= canvasHeight) {
        this.ctx.beginPath()
        this.ctx.moveTo(0, y)
        this.ctx.lineTo(canvasWidth, y)
        this.ctx.stroke()
      }
    }
  }

  /**
   * 绘制单元格
   */
  private drawCells(sheet: SheetData, range: CellRange, viewport: Viewport): void {
    for (let row = range.startRow; row <= range.endRow; row++) {
      for (let col = range.startCol; col <= range.endCol; col++) {
        const ref = ExcelParser.toRef(row, col)
        const cell = sheet.cells.get(ref)

        if (cell) {
          this.drawCell(cell, viewport)
        }
      }
    }
  }

  /**
   * 绘制单个单元格
   */
  private drawCell(cell: CellData, viewport: Viewport): void {
    const rect = this.scroller.getCellRect(cell.row, cell.col)
    const x = rect.x - viewport.scrollLeft
    const y = rect.y - viewport.scrollTop

    // 绘制单元格背景
    if (cell.style.fill?.fgColor) {
      this.ctx.fillStyle = this.formatColor(cell.style.fill.fgColor)
      this.ctx.fillRect(x, y, rect.width, rect.height)
    }

    // 绘制单元格边框
    if (cell.style.border) {
      this.drawCellBorders(cell, x, y, rect.width, rect.height)
    }

    // 绘制单元格文本
    if (cell.displayValue) {
      this.drawCellText(cell, x, y, rect.width, rect.height)
    }
  }

  /**
   * 绘制单元格边框
   */
  private drawCellBorders(
    cell: CellData,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const borders = cell.style.border

    if (!borders) return

    // 上边框
    if (borders.top) {
      this.ctx.strokeStyle = this.formatColor(borders.top.color) || this.theme.colors.grid
      this.ctx.lineWidth = this.getBorderWidth(borders.top.style)
      this.ctx.beginPath()
      this.ctx.moveTo(x, y)
      this.ctx.lineTo(x + width, y)
      this.ctx.stroke()
    }

    // 右边框
    if (borders.right) {
      this.ctx.strokeStyle = this.formatColor(borders.right.color) || this.theme.colors.grid
      this.ctx.lineWidth = this.getBorderWidth(borders.right.style)
      this.ctx.beginPath()
      this.ctx.moveTo(x + width, y)
      this.ctx.lineTo(x + width, y + height)
      this.ctx.stroke()
    }

    // 下边框
    if (borders.bottom) {
      this.ctx.strokeStyle = this.formatColor(borders.bottom.color) || this.theme.colors.grid
      this.ctx.lineWidth = this.getBorderWidth(borders.bottom.style)
      this.ctx.beginPath()
      this.ctx.moveTo(x, y + height)
      this.ctx.lineTo(x + width, y + height)
      this.ctx.stroke()
    }

    // 左边框
    if (borders.left) {
      this.ctx.strokeStyle = this.formatColor(borders.left.color) || this.theme.colors.grid
      this.ctx.lineWidth = this.getBorderWidth(borders.left.style)
      this.ctx.beginPath()
      this.ctx.moveTo(x, y)
      this.ctx.lineTo(x, y + height)
      this.ctx.stroke()
    }
  }

  /**
   * 获取边框宽度
   */
  private getBorderWidth(style: string): number {
    switch (style) {
      case 'thin':
        return 1
      case 'medium':
        return 2
      case 'thick':
        return 3
      default:
        return 1
    }
  }

  /**
   * 绘制单元格文本
   */
  private drawCellText(
    cell: CellData,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const padding = this.theme.spacing.cellPadding

    // 设置字体
    const fontSize = cell.style.font?.size || this.theme.fonts.size
    const fontFamily = cell.style.font?.name || this.theme.fonts.default
    const bold = cell.style.font?.bold ? 'bold ' : ''
    const italic = cell.style.font?.italic ? 'italic ' : ''
    this.ctx.font = `${italic}${bold}${fontSize}px ${fontFamily}`

    // 设置颜色
    this.ctx.fillStyle = cell.style.font?.color
      ? this.formatColor(cell.style.font.color)
      : this.theme.colors.foreground

    // 设置对齐
    const hAlign = cell.style.alignment?.horizontal || 'left'
    const vAlign = cell.style.alignment?.vertical || 'middle'

    this.ctx.textAlign = hAlign
    this.ctx.textBaseline = vAlign === 'middle' ? 'middle' : vAlign === 'top' ? 'top' : 'bottom'

    // 计算文本位置
    let textX = x + padding
    if (hAlign === 'center') {
      textX = x + width / 2
    } else if (hAlign === 'right') {
      textX = x + width - padding
    }

    let textY = y + height / 2
    if (vAlign === 'top') {
      textY = y + padding
    } else if (vAlign === 'bottom') {
      textY = y + height - padding
    }

    // 绘制文本（考虑文本溢出）
    const maxWidth = width - padding * 2
    this.ctx.fillText(cell.displayValue, textX, textY, maxWidth)
  }

  /**
   * 绘制冻结线
   */
  private drawFrozenLines(sheet: SheetData, viewport: Viewport): void {
    this.ctx.strokeStyle = this.theme.colors.frozenLine
    this.ctx.lineWidth = 2

    // 绘制冻结行线
    if (sheet.frozenRows > 0) {
      const y = this.scroller.getRowY(sheet.frozenRows) - viewport.scrollTop
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.canvas.width / this.dpr, y)
      this.ctx.stroke()
    }

    // 绘制冻结列线
    if (sheet.frozenCols > 0) {
      const x = this.scroller.getColX(sheet.frozenCols) - viewport.scrollLeft
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.canvas.height / this.dpr)
      this.ctx.stroke()
    }
  }

  /**
   * 格式化颜色（支持多种颜色格式）
   */
  private formatColor(color?: string): string {
    if (!color) return this.theme.colors.foreground

    // 如果是ARGB格式（如 "FF000000"），转换为 "#RRGGBB"
    if (color.length === 8 && !color.startsWith('#')) {
      return '#' + color.substring(2)
    }

    // 如果是RGB格式（如 "000000"），添加 "#"
    if (color.length === 6 && !color.startsWith('#')) {
      return '#' + color
    }

    return color
  }

  /**
   * 获取虚拟滚动器（用于外部获取单元格位置等信息）
   */
  getScroller(): VirtualScroller {
    return this.scroller
  }

  /**
   * 调整Canvas大小
   */
  resize(): void {
    this.setupCanvas()
  }
}