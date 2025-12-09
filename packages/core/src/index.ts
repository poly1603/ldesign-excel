/**
 * @excel-viewer/core
 * 高性能 Excel 文档查看器核心库
 */

// 主类导出
export { ExcelViewer, type RenderMode } from './ExcelViewer';

// 类型导出
export type {
  // 基础类型
  CellValueType,
  CellErrorType,
  CellAddress,
  CellRange,
  Color,
  GradientStop,
  GradientType,

  // 字体样式
  FontStyle,

  // 边框样式
  BorderStyleType,
  BorderSide,
  Border,

  // 填充样式
  PatternType,
  Fill,

  // 对齐样式
  HorizontalAlignment,
  VerticalAlignment,
  ReadingOrder,
  Alignment,

  // 单元格样式
  Protection,
  CellStyle,

  // 富文本
  RichTextRun,
  RichText,

  // 单元格
  CellFormula,
  Hyperlink,
  Cell,

  // 行列
  Row,
  Column,

  // 合并单元格
  MergeCell,

  // 批注
  Comment,
  CommentAnchor,

  // 条件格式
  ConditionalFormatType,
  ConditionalOperator,
  DataBarDirection,
  IconSetType,
  ConditionalFormatRule,

  // 数据验证
  DataValidationType,
  DataValidationOperator,
  DataValidationErrorStyle,
  DataValidation,

  // 冻结窗格
  FreezePane,

  // 自动筛选
  FilterCriteria,
  AutoFilter,

  // 图表
  ChartType,
  ChartSeries,
  Chart,

  // 图片
  ImageType,
  ImagePositionType,
  Image,

  // 数据透视表
  PivotField,
  PivotTable,

  // 表格
  TableStyleInfo,
  TableColumn,
  Table,
  SortState,

  // 打印设置
  PageOrientation,
  PaperSize,
  PageMargins,
  PrintOptions,
  HeaderFooter,

  // 工作表视图
  SheetView,

  // 工作表保护
  SheetProtection,

  // 工作表
  SheetType,
  SheetState,
  Sheet,

  // 命名范围
  DefinedName,

  // 样式表
  NumberFormat,
  Stylesheet,

  // 工作簿属性
  WorkbookProperties,
  DocumentProperties,

  // 主题
  ThemeColors,
  ThemeFonts,
  Theme,

  // 工作簿
  Workbook,

  // 渲染选项
  RenderTheme,
  RenderOptions,

  // 事件类型
  EventType,
  BaseEventData,
  LoadEvent,
  LoadErrorEvent,
  SheetChangeEvent,
  CellClickEvent,
  CellHoverEvent,
  SelectionChangeEvent,
  ScrollEvent,
  ZoomEvent,
  LinkClickEvent,
  ContextMenuEvent,
  EventData,

  // 导出选项
  ExportFormat,
  CsvExportOptions,
  HtmlExportOptions,
  ImageExportOptions,
  ExportOptions,

  // 查看器选项
  ToolbarConfig,
  ExcelViewerOptions
} from './types';

// 常量导出
export { RENDER_THEMES, DEFAULT_RENDER_OPTIONS } from './types';

// 解析器导出
export { ExcelParser, type ParseOptions, type ParseProgressCallback } from './parser';

// 渲染器导出
export { SheetRenderer, DomRenderer, type Viewport, type DomRendererOptions } from './renderer';

// 事件发射器导出
export { EventEmitter, type EventListener } from './events';

// 工具类导出
export { ColorUtils, FormatUtils } from './utils';

// 新版电子表格核心（v2）
export { Spreadsheet } from './core';
export * from './core/types';
export * from './core/commands';
export { SelectionManager } from './core/selection/SelectionManager';
export * from './core/ui';
export { ClipboardManager } from './core/clipboard/ClipboardManager';
