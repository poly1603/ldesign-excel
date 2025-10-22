/**
 * @ldesign/excel-viewer-core
 * Excel 预览编辑插件核心库
 */

// 核心类
export { ExcelViewer } from './viewer';
export { ExcelParser } from './parser';
export { ExcelRenderer } from './renderer';
export { ExcelExporter } from './exporter';

// 错误处理
export { ExcelError, ExcelErrorCode, ErrorSeverity, Logger, logger } from './errors';

// 内存管理
export { LRUCache, SparseMatrix, MemoryMonitor, ObjectPool, ChunkedDataLoader, debounce, throttle } from './utils/memory';

// Worker 支持
export { WorkerPool, getWorkerPool, destroyWorkerPool } from './workers/worker-pool';

// 公式引擎
export { FormulaEngine } from './formula';

// 数据验证
export { DataValidator, ValidationType, ValidationOperator, ValidationErrorStyle } from './validation';

// 查找替换
export { FindReplaceManager } from './find-replace';

// 快捷键系统
export { KeyboardManager, getKeyboardManager, destroyKeyboardManager } from './keyboard';

// 国际化
export { I18nManager, getI18n, t } from './i18n';

// 筛选和排序
export { AdvancedFilter, AdvancedSorter, FilterSortManager, FilterType, LogicalOperator, SortDirection } from './filter';

// 条件格式
export { ConditionalFormatManager, ConditionalFormatType, IconSetType } from './conditional-format';

// 打印支持
export { PrintManager, PrintOrientation, PaperSize } from './print';

// 安全防护
export { SecurityManager, getSecurityManager, escapeHTML, sanitizeInput, XSSProtectionLevel } from './security';

// 导入验证
export { ImportValidator, ValidationLevel } from './validators/import-validator';

// 虚拟滚动
export { VirtualScrollManager } from './virtual-scroll';

// 数据透视表
export { PivotTableManager, AggregateFunction } from './pivot';

// 版本历史
export { HistoryManager, OperationType, CommentStatus as HistoryStatus } from './history';

// 评论批注
export { CommentManager, CommentStatus } from './comment';

// 协作
export { CollaborationManager, UserStatus, CollabOperationType, ConflictStrategy } from './collaboration';

// 迷你图
export { SparklineRenderer, SparklineManager, SparklineType } from './sparkline';

// 数据可视化
export { VisualizationManager, HeatmapRenderer, TrendAnalyzer, DistributionAnalyzer } from './visualization';

// 自定义渲染器
export { CustomRendererManager, CustomRendererType } from './renderers/custom-renderer';

// 图表
export { ChartManager } from './charts';

// 渲染优化
export { RenderOptimizer, CanvasRenderer, RenderMode } from './render-optimizer';

// 格式导出器
export { MarkdownExporter, XMLExporter, EnhancedImageExporter, FormatConverter } from './exporters/format-exporter';

// PDF 导出器
export { PDFExporter, PDFExportUtils } from './exporters/pdf-exporter';

// 类型导出
export type {
  // 核心类型
  CellData,
  CellStyle,
  BorderStyle,
  MergeCell,
  SheetData,
  RowConfig,
  ColumnConfig,
  FrozenConfig,
  FilterConfig,
  DataValidation,
  ConditionalFormat,

  // 配置选项
  ExcelViewerOptions,
  ExcelViewerHooks,
  LuckysheetConfig,
  PerformanceConfig,
  PerformanceMetric,
  VirtualScrollConfig,
  CollaborationConfig,
  PrintConfig,
  KeyboardShortcut,
  ChartConfig,
  SparklineConfig,

  // 功能类型
  SelectionRange,
  ExportOptions,
  SearchOptions,
  SearchResult,

  // 事件类型
  EventType,
  EventListener,
} from './types';

// 公式相关类型
export type {
  FormulaResult,
  FormulaDependency,
  CellReference,
} from './formula';

// 验证相关类型
export type {
  ValidationRule,
  ValidationResult,
} from './validation';

// 查找替换类型
export type {
  FindOptions,
  ReplaceOptions,
  FindResult,
  ReplaceResult,
} from './find-replace';

// 国际化类型
export type {
  SupportedLocale,
  TranslationMap,
  DateFormatConfig,
  NumberFormatConfig,
  LocaleConfig,
} from './i18n';

// 内存管理类型
export type {
  MemoryInfo,
} from './utils/memory';

// Worker 类型
export type {
  WorkerPoolOptions,
} from './workers/worker-pool';

// 筛选排序类型
export type {
  FilterCondition,
  FilterGroup,
  SortRule,
  FilterResult,
} from './filter';

// 条件格式类型
export type {
  ConditionalFormatRule,
  ConditionalFormatResult,
  DataBarConfig,
  ColorScaleConfig,
  ColorScalePoint,
  IconSetConfig,
} from './conditional-format';

// 打印类型
export type {
  PrintRange,
  PageSetup,
  PrintPreviewOptions,
} from './print';

// 安全类型
export type {
  SecurityConfig,
} from './security';

// 导入验证类型
export type {
  ImportValidationRule,
  ImportValidationResult,
  ImportPreview,
} from './validators/import-validator';

// 虚拟滚动类型
export type {
  ViewportInfo,
  ScrollState,
} from './virtual-scroll';

// 数据透视表类型
export type {
  PivotTableConfig,
  PivotTableResult,
} from './pivot';

// 历史类型
export type {
  HistoryRecord,
  VersionSnapshot,
  HistoryManagerConfig,
} from './history';

// 评论类型
export type {
  Comment,
  CommentReply,
  CommentFilterOptions,
} from './comment';

// 协作类型
export type {
  CollabUser,
  CollabOperation,
} from './collaboration';

// 迷你图类型
export type {
  SparklineDataPoint,
  SparklineRenderOptions,
} from './sparkline';

// 可视化类型
export type {
  HeatmapConfig,
  TrendAnalysis,
  DataDistribution,
} from './visualization';

// 自定义渲染器类型
export type {
  CustomRendererConfig,
  RichTextSegment,
} from './renderers/custom-renderer';

// 图表类型
export type {
  ChartData,
} from './charts';

// 渲染优化类型
export type {
  RenderTask,
  RenderBatch,
} from './render-optimizer';

// PDF 导出类型
export type {
  PDFExportOptions,
} from './exporters/pdf-exporter';

// 默认导出
import { ExcelViewer as DefaultExport } from './viewer';
export default DefaultExport;

