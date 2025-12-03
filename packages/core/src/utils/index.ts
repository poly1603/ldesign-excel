/**
 * 工具函数集合
 */

/**
 * 将列索引转换为列名（0 -> "A", 25 -> "Z", 26 -> "AA"）
 */
export function indexToCol(index: number): string {
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
 * 将列名转换为列索引（"A" -> 0, "Z" -> 25, "AA" -> 26）
 */
export function colToIndex(col: string): number {
  let result = 0
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + (col.charCodeAt(i) - 64)
  }
  return result - 1
}

/**
 * 将行列索引转换为单元格引用（0, 0 -> "A1"）
 */
export function toRef(row: number, col: number): string {
  return `${indexToCol(col)}${row + 1}`
}

/**
 * 解析单元格引用（"A1" -> {row: 0, col: 0}）
 */
export function parseRef(ref: string): { row: number; col: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/)
  if (!match) {
    throw new Error(`无效的单元格引用: ${ref}`)
  }

  return {
    row: parseInt(match[2]) - 1,
    col: colToIndex(match[1]),
  }
}

/**
 * 格式化颜色（ARGB -> RGB）
 */
export function formatColor(color?: string, defaultColor: string = '#000000'): string {
  if (!color) return defaultColor

  // ARGB格式（如 "FF000000"）转换为 "#RRGGBB"
  if (color.length === 8 && !color.startsWith('#')) {
    return '#' + color.substring(2)
  }

  // RGB格式（如 "000000"）添加 "#"
  if (color.length === 6 && !color.startsWith('#')) {
    return '#' + color
  }

  return color
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as any
  }

  if (obj instanceof Map) {
    const clonedMap = new Map()
    obj.forEach((value, key) => {
      clonedMap.set(key, deepClone(value))
    })
    return clonedMap as any
  }

  if (obj instanceof Set) {
    const clonedSet = new Set()
    obj.forEach((value) => {
      clonedSet.add(deepClone(value))
    })
    return clonedSet as any
  }

  const clonedObj = {} as T
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key])
    }
  }

  return clonedObj
}

/**
 * 判断是否为有效的单元格引用
 */
export function isValidRef(ref: string): boolean {
  return /^[A-Z]+\d+$/.test(ref)
}

/**
 * 计算两点之间的距离
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

/**
 * 限制数值范围
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}