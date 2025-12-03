/**
 * 边框样式类型
 */
export type BorderStyleType = 'thin' | 'medium' | 'thick' | 'dashed' | 'dotted' | 'double'

/**
 * 水平对齐方式
 */
export type HorizontalAlign = 'left' | 'center' | 'right' | 'fill' | 'justify'

/**
 * 垂直对齐方式
 */
export type VerticalAlign = 'top' | 'middle' | 'bottom'

/**
 * 填充类型
 */
export type FillType = 'solid' | 'pattern' | 'gradient'

/**
 * 边框样式
 */
export interface BorderStyle {
  /** 边框类型 */
  style: BorderStyleType
  /** 边框颜色 */
  color?: string
}

/**
 * 字体样式
 */
export interface FontStyle {
  /** 字体名称 */
  name?: string
  /** 字体大小 */
  size?: number
  /** 是否粗体 */
  bold?: boolean
  /** 是否斜体 */
  italic?: boolean
  /** 是否下划线 */
  underline?: boolean
  /** 是否删除线 */
  strike?: boolean
  /** 字体颜色 */
  color?: string
}

/**
 * 填充样式
 */
export interface FillStyle {
  /** 填充类型 */
  type?: FillType
  /** 前景色 */
  fgColor?: string
  /** 背景色 */
  bgColor?: string
  /** 图案（如果是pattern类型） */
  pattern?: string
}

/**
 * 对齐样式
 */
export interface AlignmentStyle {
  /** 水平对齐 */
  horizontal?: HorizontalAlign
  /** 垂直对齐 */
  vertical?: VerticalAlign
  /** 是否换行 */
  wrapText?: boolean
  /** 缩进级别 */
  indent?: number
  /** 文本旋转角度 */
  textRotation?: number
}

/**
 * 边框集合
 */
export interface Borders {
  /** 上边框 */
  top?: BorderStyle
  /** 右边框 */
  right?: BorderStyle
  /** 下边框 */
  bottom?: BorderStyle
  /** 左边框 */
  left?: BorderStyle
  /** 对角线（左上到右下） */
  diagonal?: BorderStyle
  /** 对角线方向 */
  diagonalDown?: boolean
  /** 对角线方向 */
  diagonalUp?: boolean
}

/**
 * 完整单元格样式
 */
export interface CellStyle {
  /** 字体样式 */
  font?: FontStyle
  /** 填充样式 */
  fill?: FillStyle
  /** 边框样式 */
  border?: Borders
  /** 对齐样式 */
  alignment?: AlignmentStyle
  /** 数字格式 */
  numFmt?: string
  /** 是否锁定 */
  locked?: boolean
  /** 是否隐藏 */
  hidden?: boolean
}