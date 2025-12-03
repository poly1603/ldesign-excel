import * as XLSX from 'xlsx'
import type { WorkbookData, SheetData, CellData, MergeRange, CellStyle } from '../types'

/**
 * Excel文件解析器
 * 支持 .xlsx, .xls, .csv 格式
 */
export class ExcelParser {
  /**
   * 解析Excel文件
   * @param source - File对象或ArrayBuffer
   * @returns 工作簿数据
   */
  async parse(source: File | ArrayBuffer): Promise<WorkbookData> {
    try {
      // 读取文件数据
      const data = source instanceof File ? await this.readFile(source) : source

      // 使用XLSX解析
      const workbook = XLSX.read(data, {
        type: 'array',
        cellStyles: true,
        cellDates: true,
      })

      // 转换为内部数据结构
      const sheets: SheetData[] = workbook.SheetNames.map((name, index) => {
        const xlsxSheet = workbook.Sheets[name]
        return this.parseSheet(xlsxSheet, name, index)
      })

      // 构建工作簿元数据
      const metadata = {
        sheetCount: sheets.length,
        creator: workbook.Props?.Creator,
        created: workbook.Props?.CreatedDate,
        modified: workbook.Props?.ModifiedDate,
        lastModifiedBy: workbook.Props?.LastAuthor,
        application: workbook.Props?.Application,
      }

      return {
        sheets,
        metadata,
        activeSheetIndex: 0,
      }
    } catch (error) {
      throw new Error(`Excel解析失败: ${(error as Error).message}`)
    }
  }

  /**
   * 读取File对象为ArrayBuffer
   */
  private readFile(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer)
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * 解析单个工作表
   */
  private parseSheet(xlsxSheet: XLSX.WorkSheet, name: string, index: number): SheetData {
    const cells = new Map<string, CellData>()
    const merges: MergeRange[] = []
    const rowHeights = new Map<number, number>()
    const colWidths = new Map<number, number>()

    // 获取工作表范围
    const range = XLSX.utils.decode_range(xlsxSheet['!ref'] || 'A1')
    const rowCount = range.e.r + 1
    const colCount = range.e.c + 1

    // 解析所有单元格
    for (const cellRef in xlsxSheet) {
      // 跳过特殊属性
      if (cellRef[0] === '!') continue

      const xlsxCell = xlsxSheet[cellRef]
      const cellData = this.parseCell(xlsxCell, cellRef)
      cells.set(cellRef, cellData)
    }

    // 解析合并单元格
    if (xlsxSheet['!merges']) {
      xlsxSheet['!merges'].forEach((merge) => {
        merges.push({
          ref: XLSX.utils.encode_range(merge),
          startRow: merge.s.r,
          startCol: merge.s.c,
          endRow: merge.e.r,
          endCol: merge.e.c,
        })
      })
    }

    // 解析列宽
    if (xlsxSheet['!cols']) {
      xlsxSheet['!cols'].forEach((col, index) => {
        if (col && col.width) {
          colWidths.set(index, col.width * 8) // 转换为像素
        }
      })
    }

    // 解析行高
    if (xlsxSheet['!rows']) {
      xlsxSheet['!rows'].forEach((row, index) => {
        if (row && row.hpt) {
          rowHeights.set(index, row.hpt * 1.33) // 转换为像素
        }
      })
    }

    return {
      name,
      index,
      cells,
      merges,
      frozenRows: 0,
      frozenCols: 0,
      rowHeights,
      colWidths,
      rowCount,
      colCount,
    }
  }

  /**
   * 解析单个单元格
   */
  private parseCell(xlsxCell: XLSX.CellObject, ref: string): CellData {
    const [col, row] = this.parseRef(ref)

    // 获取单元格值
    const value = xlsxCell.v
    const displayValue = this.formatCellValue(xlsxCell)

    // 获取数据类型
    const dataType = this.getCellType(xlsxCell)

    // 解析样式
    const style = this.parseCellStyle(xlsxCell)

    return {
      row,
      col,
      ref,
      value,
      displayValue,
      formula: xlsxCell.f,
      dataType,
      style,
    }
  }

  /**
   * 格式化单元格显示值
   */
  private formatCellValue(cell: XLSX.CellObject): string {
    if (cell.w) return cell.w // 使用格式化后的值
    if (cell.v === undefined || cell.v === null) return ''

    // 根据类型格式化
    switch (cell.t) {
      case 'n': // 数字
        return typeof cell.v === 'number' ? cell.v.toString() : String(cell.v)
      case 's': // 字符串
        return String(cell.v)
      case 'b': // 布尔
        return cell.v ? 'TRUE' : 'FALSE'
      case 'd': // 日期
        return cell.v instanceof Date ? cell.v.toISOString() : String(cell.v)
      case 'e': // 错误
        return String(cell.v)
      default:
        return String(cell.v)
    }
  }

  /**
   * 获取单元格数据类型
   */
  private getCellType(cell: XLSX.CellObject): CellData['dataType'] {
    if (!cell.t) return 'string'

    switch (cell.t) {
      case 'n':
        return 'number'
      case 's':
        return 'string'
      case 'b':
        return 'boolean'
      case 'd':
        return 'date'
      case 'e':
        return 'error'
      default:
        return cell.f ? 'formula' : 'string'
    }
  }

  /**
   * 解析单元格样式
   */
  private parseCellStyle(cell: XLSX.CellObject): CellStyle {
    const style: CellStyle = {}

    // 注意：SheetJS的免费版本对样式支持有限
    // 这里提供基础的样式解析框架
    if (cell.s) {
      const cellStyle = cell.s as any

      // 字体样式
      if (cellStyle.font) {
        style.font = {
          name: cellStyle.font.name,
          size: cellStyle.font.sz,
          bold: cellStyle.font.bold,
          italic: cellStyle.font.italic,
          underline: cellStyle.font.underline,
          strike: cellStyle.font.strike,
          color: cellStyle.font.color?.rgb,
        }
      }

      // 填充样式
      if (cellStyle.fill) {
        style.fill = {
          type: 'solid',
          fgColor: cellStyle.fill.fgColor?.rgb,
          bgColor: cellStyle.fill.bgColor?.rgb,
        }
      }

      // 对齐样式
      if (cellStyle.alignment) {
        style.alignment = {
          horizontal: cellStyle.alignment.horizontal,
          vertical: cellStyle.alignment.vertical,
          wrapText: cellStyle.alignment.wrapText,
          indent: cellStyle.alignment.indent,
        }
      }

      // 边框样式
      if (cellStyle.border) {
        style.border = {}
        if (cellStyle.border.top) {
          style.border.top = {
            style: cellStyle.border.top.style || 'thin',
            color: cellStyle.border.top.color?.rgb,
          }
        }
        if (cellStyle.border.right) {
          style.border.right = {
            style: cellStyle.border.right.style || 'thin',
            color: cellStyle.border.right.color?.rgb,
          }
        }
        if (cellStyle.border.bottom) {
          style.border.bottom = {
            style: cellStyle.border.bottom.style || 'thin',
            color: cellStyle.border.bottom.color?.rgb,
          }
        }
        if (cellStyle.border.left) {
          style.border.left = {
            style: cellStyle.border.left.style || 'thin',
            color: cellStyle.border.left.color?.rgb,
          }
        }
      }

      // 数字格式
      if (cellStyle.numFmt) {
        style.numFmt = cellStyle.numFmt
      }
    }

    return style
  }

  /**
   * 解析单元格引用（如 "A1" -> [0, 0]）
   */
  private parseRef(ref: string): [number, number] {
    const match = ref.match(/^([A-Z]+)(\d+)$/)
    if (!match) {
      throw new Error(`无效的单元格引用: ${ref}`)
    }

    const col = this.colToIndex(match[1])
    const row = parseInt(match[2]) - 1

    return [col, row]
  }

  /**
   * 列名转索引（"A" -> 0, "B" -> 1, "AA" -> 26）
   */
  private colToIndex(col: string): number {
    let result = 0
    for (let i = 0; i < col.length; i++) {
      result = result * 26 + (col.charCodeAt(i) - 64)
    }
    return result - 1
  }

  /**
   * 索引转列名（0 -> "A", 1 -> "B", 26 -> "AA"）
   */
  static indexToCol(index: number): string {
    let col = ''
    let n = index + 1

    while (n > 0) {
      const remainder = (n - 1) % 26
      col = String.fromCharCode(65 + remainder) + col
      n = Math.floor((n - 1) / 26)
    }

    return col
  }

  /**
   * 转换为单元格引用（0, 0 -> "A1"）
   */
  static toRef(row: number, col: number): string {
    return `${ExcelParser.indexToCol(col)}${row + 1}`
  }
}