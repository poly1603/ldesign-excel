/**
 * 电子表格核心类型定义
 */

// ============ 基础类型 ============

/** 单元格地址 */
export interface CellAddress {
  row: number;
  col: number;
}

/** 单元格范围 */
export interface CellRange {
  start: CellAddress;
  end: CellAddress;
}

/** 选区 */
export interface Selection {
  /** 选区范围列表（支持多选） */
  ranges: CellRange[];
  /** 活动单元格（光标所在） */
  activeCell: CellAddress;
  /** 选区锚点（用于 Shift 选择） */
  anchorCell?: CellAddress;
}

// ============ 单元格数据 ============

/** 单元格值类型 */
export type CellValueType = 'string' | 'number' | 'boolean' | 'date' | 'formula' | 'error' | 'empty';

/** 单元格数据 */
export interface CellData {
  /** 原始值 */
  value: string | number | boolean | Date | null;
  /** 显示文本 */
  text: string;
  /** 值类型 */
  type: CellValueType;
  /** 公式（如果有） */
  formula?: string;
  /** 格式化后的值 */
  formattedValue?: string;
  /** 样式索引 */
  styleIndex?: number;
  /** 是否被合并 */
  isMerged?: boolean;
  /** 是否是合并区域的起始单元格 */
  isMergeOrigin?: boolean;
  /** 合并区域 */
  mergeRange?: CellRange;
}

// ============ 行列定义 ============

/** 行定义 */
export interface RowData {
  height: number;
  hidden?: boolean;
  styleIndex?: number;
}

/** 列定义 */
export interface ColData {
  width: number;
  hidden?: boolean;
  styleIndex?: number;
}

// ============ 样式 ============

/** 字体样式 */
export interface FontStyle {
  name?: string;
  size?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean | 'single' | 'double';
  strikethrough?: boolean;
  color?: string;
}

/** 边框样式 */
export interface BorderStyle {
  style?: 'thin' | 'medium' | 'thick' | 'dashed' | 'dotted' | 'double';
  color?: string;
}

/** 边框 */
export interface Border {
  top?: BorderStyle;
  right?: BorderStyle;
  bottom?: BorderStyle;
  left?: BorderStyle;
}

/** 填充样式 */
export interface FillStyle {
  type: 'solid' | 'pattern' | 'gradient';
  color?: string;
  patternColor?: string;
}

/** 对齐方式 */
export interface Alignment {
  horizontal?: 'left' | 'center' | 'right' | 'justify';
  vertical?: 'top' | 'middle' | 'bottom';
  wrapText?: boolean;
  textRotation?: number;
  indent?: number;
}

/** 单元格样式 */
export interface CellStyle {
  font?: FontStyle;
  fill?: FillStyle;
  border?: Border;
  alignment?: Alignment;
  numberFormat?: string;
}

// ============ 工作表 ============

/** 冻结窗格 */
export interface FreezePane {
  row: number;
  col: number;
}

/** 工作表数据 */
export interface SheetData {
  /** 工作表 ID */
  id: string;
  /** 工作表名称 */
  name: string;
  /** 单元格数据 */
  cells: Map<string, CellData>;
  /** 行数据 */
  rows: Map<number, RowData>;
  /** 列数据 */
  cols: Map<number, ColData>;
  /** 合并单元格 */
  merges: CellRange[];
  /** 冻结窗格 */
  freeze?: FreezePane;
  /** 默认行高 */
  defaultRowHeight: number;
  /** 默认列宽 */
  defaultColWidth: number;
  /** 选区 */
  selection: Selection;
}

// ============ 工作簿 ============

/** 工作簿数据 */
export interface WorkbookData {
  /** 工作表列表 */
  sheets: SheetData[];
  /** 当前工作表索引 */
  activeSheetIndex: number;
  /** 样式表 */
  styles: CellStyle[];
}

// ============ 事件类型 ============

/** 事件类型 */
export type SpreadsheetEventType =
  | 'selectionChange'
  | 'cellChange'
  | 'cellEdit'
  | 'cellEditEnd'
  | 'sheetChange'
  | 'sheetAdd'
  | 'sheetDelete'
  | 'sheetRename'
  | 'rowInsert'
  | 'rowDelete'
  | 'rowResize'
  | 'colInsert'
  | 'colDelete'
  | 'colResize'
  | 'copy'
  | 'cut'
  | 'paste'
  | 'undo'
  | 'redo'
  | 'zoom'
  | 'scroll'
  | 'contextMenu';

/** 事件数据基类 */
export interface SpreadsheetEvent {
  type: SpreadsheetEventType;
  timestamp: number;
}

// ============ 配置选项 ============

/** 工具栏配置 */
export interface ToolbarConfig {
  show: boolean;
  items?: string[];
}

/** 右键菜单配置 */
export interface ContextMenuConfig {
  show: boolean;
  items?: string[];
}

/** 电子表格配置 */
export interface SpreadsheetConfig {
  /** 容器元素 */
  container: HTMLElement | string;
  /** 初始数据 */
  data?: WorkbookData;
  /** 是否只读 */
  readonly?: boolean;
  /** 是否显示网格线 */
  showGridLines?: boolean;
  /** 是否显示行号 */
  showRowHeader?: boolean;
  /** 是否显示列号 */
  showColHeader?: boolean;
  /** 初始缩放 */
  zoom?: number;
  /** 工具栏配置 */
  toolbar?: ToolbarConfig | boolean;
  /** 右键菜单配置 */
  contextMenu?: ContextMenuConfig | boolean;
  /** 是否启用公式 */
  enableFormula?: boolean;
  /** 是否启用协同编辑 */
  enableCollaboration?: boolean;
  /** 语言 */
  locale?: 'zh-CN' | 'en-US';
}
