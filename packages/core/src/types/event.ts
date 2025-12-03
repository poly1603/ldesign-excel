import type { CellData, CellRange, Selection } from './cell'
import type { ScrollInfo } from './workbook'

/**
 * 事件类型
 */
export type EventType =
  | 'load'
  | 'error'
  | 'cellClick'
  | 'cellDoubleClick'
  | 'cellChange'
  | 'selectionChange'
  | 'sheetChange'
  | 'scroll'
  | 'zoom'
  | 'contextMenu'

/**
 * 基础事件
 */
export interface BaseEvent {
  type: EventType
  timestamp: number
}

/**
 * 单元格点击事件
 */
export interface CellClickEvent extends BaseEvent {
  type: 'cellClick'
  row: number
  col: number
  cell: CellData
  button: number
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
}

/**
 * 单元格双击事件
 */
export interface CellDoubleClickEvent extends BaseEvent {
  type: 'cellDoubleClick'
  row: number
  col: number
  cell: CellData
}

/**
 * 单元格值变化事件
 */
export interface CellChangeEvent extends BaseEvent {
  type: 'cellChange'
  row: number
  col: number
  cell: CellData
  oldValue: any
  newValue: any
}

/**
 * 选择变化事件
 */
export interface SelectionChangeEvent extends BaseEvent {
  type: 'selectionChange'
  selection: Selection
  oldSelection: Selection | null
}

/**
 * 工作表切换事件
 */
export interface SheetChangeEvent extends BaseEvent {
  type: 'sheetChange'
  sheetIndex: number
  sheetName: string
  oldSheetIndex: number
}

/**
 * 滚动事件
 */
export interface ScrollEvent extends BaseEvent {
  type: 'scroll'
  scrollInfo: ScrollInfo
}

/**
 * 缩放事件
 */
export interface ZoomEvent extends BaseEvent {
  type: 'zoom'
  level: number
  oldLevel: number
}

/**
 * 右键菜单事件
 */
export interface ContextMenuEvent extends BaseEvent {
  type: 'contextMenu'
  x: number
  y: number
  row: number
  col: number
  cell: CellData | null
}

/**
 * 加载完成事件
 */
export interface LoadEvent extends BaseEvent {
  type: 'load'
  sheetCount: number
}

/**
 * 错误事件
 */
export interface ErrorEvent extends BaseEvent {
  type: 'error'
  error: Error
  message: string
}

/**
 * 所有事件类型联合
 */
export type ExcelEvent =
  | CellClickEvent
  | CellDoubleClickEvent
  | CellChangeEvent
  | SelectionChangeEvent
  | SheetChangeEvent
  | ScrollEvent
  | ZoomEvent
  | ContextMenuEvent
  | LoadEvent
  | ErrorEvent

/**
 * 事件处理器类型
 */
export type EventHandler<T extends ExcelEvent = ExcelEvent> = (event: T) => void

/**
 * 事件映射
 */
export interface EventMap {
  load: LoadEvent
  error: ErrorEvent
  cellClick: CellClickEvent
  cellDoubleClick: CellDoubleClickEvent
  cellChange: CellChangeEvent
  selectionChange: SelectionChangeEvent
  sheetChange: SheetChangeEvent
  scroll: ScrollEvent
  zoom: ZoomEvent
  contextMenu: ContextMenuEvent
}