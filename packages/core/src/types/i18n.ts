/**
 * 工具栏消息
 */
export interface ToolbarMessages {
  zoomIn: string
  zoomOut: string
  export: string
  search: string
  print: string
  undo: string
  redo: string
}

/**
 * 右键菜单消息
 */
export interface ContextMenuMessages {
  copy: string
  paste: string
  cut: string
  delete: string
  insertRow: string
  insertCol: string
  deleteRow: string
  deleteCol: string
  clearContent: string
  clearFormat: string
}

/**
 * 筛选器消息
 */
export interface FilterMessages {
  filterBy: string
  sortAsc: string
  sortDesc: string
  clearFilter: string
  customFilter: string
  searchPlaceholder: string
}

/**
 * 错误消息
 */
export interface ErrorMessages {
  fileNotSupported: string
  parseError: string
  formulaError: string
  loadError: string
  exportError: string
  invalidRange: string
  networkError: string
}

/**
 * 通用消息
 */
export interface CommonMessages {
  ok: string
  cancel: string
  close: string
  confirm: string
  warning: string
  error: string
  success: string
  loading: string
}

/**
 * 完整的语言包
 */
export interface LocaleMessages {
  toolbar: ToolbarMessages
  contextMenu: ContextMenuMessages
  filter: FilterMessages
  errors: ErrorMessages
  common: CommonMessages
}

/**
 * 支持的语言代码
 */
export type LocaleCode = 'zh-CN' | 'en-US' | string