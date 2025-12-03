import type { CellData, SheetData } from '../types'
import { ExcelParser } from '../parser/ExcelParser'

/**
 * 公式函数类型
 */
export type FormulaFunction = (...args: any[]) => any

/**
 * 公式计算引擎
 * 负责解析和计算Excel公式
 */
export class FormulaEngine {
  private functions: Map<string, FormulaFunction>
  private sheet: SheetData | null = null

  constructor() {
    this.functions = new Map()
    this.registerBuiltInFunctions()
  }

  /**
   * 设置当前工作表
   */
  setSheet(sheet: SheetData): void {
    this.sheet = sheet
  }

  /**
   * 计算公式
   */
  calculate(formula: string, cellRef: string): any {
    try {
      // 移除开头的 =
      const expr = formula.startsWith('=') ? formula.substring(1) : formula

      // 解析并计算公式
      return this.evaluateExpression(expr, cellRef)
    } catch (error) {
      console.error('公式计算错误:', error)
      return '#ERROR!'
    }
  }

  /**
   * 计算表达式
   */
  private evaluateExpression(expr: string, currentCell: string): any {
    // 替换单元格引用
    expr = this.replaceCellReferences(expr)

    // 替换函数调用
    expr = this.replaceFunctionCalls(expr)

    // 使用 Function 执行表达式
    try {
      const result = new Function('return ' + expr)()
      return result
    } catch (error) {
      return '#ERROR!'
    }
  }

  /**
   * 替换单元格引用
   */
  private replaceCellReferences(expr: string): string {
    // 匹配 A1, B2, AA10 等单元格引用
    const cellRefRegex = /\b([A-Z]+[0-9]+)\b/g

    return expr.replace(cellRefRegex, (match) => {
      const value = this.getCellValue(match)
      if (typeof value === 'number') {
        return value.toString()
      } else if (typeof value === 'string') {
        return `"${value}"`
      }
      return '0'
    })
  }

  /**
   * 替换函数调用
   */
  private replaceFunctionCalls(expr: string): string {
    // 匹配函数调用，如 SUM(A1:A10)
    const funcRegex = /\b([A-Z]+)\((.*?)\)/g

    return expr.replace(funcRegex, (match, funcName, args) => {
      const func = this.functions.get(funcName.toUpperCase())
      if (!func) {
        return '#NAME?'
      }

      // 解析参数
      const parsedArgs = this.parseArguments(args)
      const result = func(...parsedArgs)

      if (typeof result === 'number') {
        return result.toString()
      } else if (typeof result === 'string') {
        return `"${result}"`
      }
      return result
    })
  }

  /**
   * 解析函数参数
   */
  private parseArguments(argsStr: string): any[] {
    const args: any[] = []
    const parts = argsStr.split(',')

    for (const part of parts) {
      const trimmed = part.trim()

      // 检查是否是范围（如 A1:A10）
      if (trimmed.includes(':')) {
        const values = this.getRangeValues(trimmed)
        args.push(...values)
      }
      // 检查是否是单元格引用
      else if (/^[A-Z]+[0-9]+$/.test(trimmed)) {
        args.push(this.getCellValue(trimmed))
      }
      // 检查是否是数字
      else if (!isNaN(parseFloat(trimmed))) {
        args.push(parseFloat(trimmed))
      }
      // 检查是否是字符串
      else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        args.push(trimmed.substring(1, trimmed.length - 1))
      }
      // 其他情况
      else {
        args.push(trimmed)
      }
    }

    return args
  }

  /**
   * 获取单元格值
   */
  private getCellValue(ref: string): any {
    if (!this.sheet) return 0

    const cell = this.sheet.cells.get(ref)
    if (!cell) return 0

    // 如果单元格有公式，先计算公式
    if (cell.formula) {
      return this.calculate(cell.formula, ref)
    }

    return cell.value || 0
  }

  /**
   * 获取范围内的所有值
   */
  private getRangeValues(range: string): number[] {
    const [start, end] = range.split(':')
    const startPos = ExcelParser.toRef(0, 0) // 需要解析引用
    const endPos = ExcelParser.toRef(0, 0)

    // 这里简化处理，实际应该解析范围并获取所有值
    const values: number[] = []

    // TODO: 实现完整的范围解析
    return values
  }

  /**
   * 注册函数
   */
  registerFunction(name: string, fn: FormulaFunction): void {
    this.functions.set(name.toUpperCase(), fn)
  }

  /**
   * 注册内置函数
   */
  private registerBuiltInFunctions(): void {
    // 数学函数
    this.registerFunction('SUM', (...args: number[]) => {
      return args.reduce((sum, val) => sum + (Number(val) || 0), 0)
    })

    this.registerFunction('AVERAGE', (...args: number[]) => {
      const numbers = args.filter((val) => typeof val === 'number')
      if (numbers.length === 0) return 0
      return numbers.reduce((sum, val) => sum + val, 0) / numbers.length
    })

    this.registerFunction('MAX', (...args: number[]) => {
      const numbers = args.filter((val) => typeof val === 'number')
      return numbers.length > 0 ? Math.max(...numbers) : 0
    })

    this.registerFunction('MIN', (...args: number[]) => {
      const numbers = args.filter((val) => typeof val === 'number')
      return numbers.length > 0 ? Math.min(...numbers) : 0
    })

    this.registerFunction('ROUND', (num: number, digits: number = 0) => {
      const multiplier = Math.pow(10, digits)
      return Math.round(num * multiplier) / multiplier
    })

    this.registerFunction('ABS', (num: number) => {
      return Math.abs(num)
    })

    this.registerFunction('SQRT', (num: number) => {
      return Math.sqrt(num)
    })

    this.registerFunction('POWER', (base: number, exponent: number) => {
      return Math.pow(base, exponent)
    })

    // 逻辑函数
    this.registerFunction('IF', (condition: boolean, trueVal: any, falseVal: any) => {
      return condition ? trueVal : falseVal
    })

    this.registerFunction('AND', (...args: boolean[]) => {
      return args.every((val) => Boolean(val))
    })

    this.registerFunction('OR', (...args: boolean[]) => {
      return args.some((val) => Boolean(val))
    })

    this.registerFunction('NOT', (val: boolean) => {
      return !val
    })

    // 文本函数
    this.registerFunction('CONCATENATE', (...args: string[]) => {
      return args.join('')
    })

    this.registerFunction('LEFT', (text: string, length: number = 1) => {
      return String(text).substring(0, length)
    })

    this.registerFunction('RIGHT', (text: string, length: number = 1) => {
      return String(text).substring(String(text).length - length)
    })

    this.registerFunction('MID', (text: string, start: number, length: number) => {
      return String(text).substring(start - 1, start - 1 + length)
    })

    this.registerFunction('UPPER', (text: string) => {
      return String(text).toUpperCase()
    })

    this.registerFunction('LOWER', (text: string) => {
      return String(text).toLowerCase()
    })

    this.registerFunction('LEN', (text: string) => {
      return String(text).length
    })

    // 统计函数
    this.registerFunction('COUNT', (...args: any[]) => {
      return args.filter((val) => typeof val === 'number').length
    })

    this.registerFunction('COUNTA', (...args: any[]) => {
      return args.filter((val) => val !== null && val !== undefined && val !== '').length
    })

    // 日期函数
    this.registerFunction('TODAY', () => {
      return new Date().toLocaleDateString()
    })

    this.registerFunction('NOW', () => {
      return new Date().toLocaleString()
    })

    this.registerFunction('YEAR', (date: Date | string) => {
      return new Date(date).getFullYear()
    })

    this.registerFunction('MONTH', (date: Date | string) => {
      return new Date(date).getMonth() + 1
    })

    this.registerFunction('DAY', (date: Date | string) => {
      return new Date(date).getDate()
    })
  }

  /**
   * 获取所有可用函数名称
   */
  getFunctionNames(): string[] {
    return Array.from(this.functions.keys())
  }

  /**
   * 检查函数是否存在
   */
  hasFunction(name: string): boolean {
    return this.functions.has(name.toUpperCase())
  }
}