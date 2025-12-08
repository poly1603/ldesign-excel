/**
 * Excel Viewer 核心类型定义
 * @description 提供完整的 Excel 文档结构类型支持
 */

// ============ 基础类型 ============

/**
 * 单元格值类型
 */
export type CellValueType = 'string' | 'number' | 'boolean' | 'date' | 'error' | 'formula' | 'richText' | 'empty';

/**
 * 单元格错误类型
 */
export type CellErrorType = '#NULL!' | '#DIV/0!' | '#VALUE!' | '#REF!' | '#NAME?' | '#NUM!' | '#N/A' | '#GETTING_DATA';

/**
 * 单元格地址
 */
export interface CellAddress {
  row: number;
  col: number;
}

/**
 * 单元格范围
 */
export interface CellRange {
  start: CellAddress;
  end: CellAddress;
}

/**
 * 颜色定义
 */
export interface Color {
  /** RGB 颜色值 (如 "FF0000") */
  rgb?: string;
  /** 主题颜色索引 */
  theme?: number;
  /** 色调调整 (-1 到 1) */
  tint?: number;
  /** 索引颜色 */
  indexed?: number;
  /** 自动颜色 */
  auto?: boolean;
}

/**
 * 渐变填充停止点
 */
export interface GradientStop {
  position: number;
  color: Color;
}

/**
 * 渐变填充类型
 */
export type GradientType = 'linear' | 'path';

// ============ 字体样式 ============

/**
 * 字体样式
 */
export interface FontStyle {
  /** 字体名称 */
  name?: string;
  /** 字体大小 (磅) */
  size?: number;
  /** 粗体 */
  bold?: boolean;
  /** 斜体 */
  italic?: boolean;
  /** 下划线类型 */
  underline?: 'none' | 'single' | 'double' | 'singleAccounting' | 'doubleAccounting';
  /** 删除线 */
  strikethrough?: boolean;
  /** 颜色 */
  color?: Color;
  /** 上标/下标 */
  vertAlign?: 'superscript' | 'subscript' | 'baseline';
  /** 字符集 */
  charset?: number;
  /** 字体系列 */
  family?: number;
  /** 字体方案 */
  scheme?: 'major' | 'minor' | 'none';
  /** 外边框 */
  outline?: boolean;
  /** 阴影 */
  shadow?: boolean;
  /** 删除线类型 */
  strike?: boolean;
}

// ============ 边框样式 ============

/**
 * 边框样式类型
 */
export type BorderStyleType =
  | 'none'
  | 'thin'
  | 'medium'
  | 'thick'
  | 'dashed'
  | 'dotted'
  | 'double'
  | 'hair'
  | 'mediumDashed'
  | 'dashDot'
  | 'mediumDashDot'
  | 'dashDotDot'
  | 'mediumDashDotDot'
  | 'slantDashDot';

/**
 * 单边边框
 */
export interface BorderSide {
  style?: BorderStyleType;
  color?: Color;
}

/**
 * 完整边框定义
 */
export interface Border {
  left?: BorderSide;
  right?: BorderSide;
  top?: BorderSide;
  bottom?: BorderSide;
  diagonal?: BorderSide;
  diagonalUp?: boolean;
  diagonalDown?: boolean;
}

// ============ 填充样式 ============

/**
 * 填充图案类型
 */
export type PatternType =
  | 'none'
  | 'solid'
  | 'mediumGray'
  | 'darkGray'
  | 'lightGray'
  | 'darkHorizontal'
  | 'darkVertical'
  | 'darkDown'
  | 'darkUp'
  | 'darkGrid'
  | 'darkTrellis'
  | 'lightHorizontal'
  | 'lightVertical'
  | 'lightDown'
  | 'lightUp'
  | 'lightGrid'
  | 'lightTrellis'
  | 'gray125'
  | 'gray0625';

/**
 * 填充样式
 */
export interface Fill {
  /** 填充类型 */
  type: 'pattern' | 'gradient';
  /** 图案类型 */
  pattern?: PatternType;
  /** 前景色 */
  fgColor?: Color;
  /** 背景色 */
  bgColor?: Color;
  /** 渐变类型 */
  gradientType?: GradientType;
  /** 渐变角度 */
  degree?: number;
  /** 渐变停止点 */
  stops?: GradientStop[];
}

// ============ 对齐样式 ============

/**
 * 水平对齐
 */
export type HorizontalAlignment =
  | 'general'
  | 'left'
  | 'center'
  | 'right'
  | 'fill'
  | 'justify'
  | 'centerContinuous'
  | 'distributed';

/**
 * 垂直对齐
 */
export type VerticalAlignment = 'top' | 'center' | 'bottom' | 'justify' | 'distributed';

/**
 * 文本方向
 */
export type ReadingOrder = 'context' | 'leftToRight' | 'rightToLeft';

/**
 * 对齐样式
 */
export interface Alignment {
  /** 水平对齐 */
  horizontal?: HorizontalAlignment;
  /** 垂直对齐 */
  vertical?: VerticalAlignment;
  /** 文本旋转角度 (-90 到 90) */
  textRotation?: number;
  /** 自动换行 */
  wrapText?: boolean;
  /** 缩小以适应 */
  shrinkToFit?: boolean;
  /** 缩进 */
  indent?: number;
  /** 两端对齐的最后一行 */
  justifyLastLine?: boolean;
  /** 文本方向 */
  readingOrder?: ReadingOrder;
}

// ============ 单元格样式 ============

/**
 * 保护设置
 */
export interface Protection {
  locked?: boolean;
  hidden?: boolean;
}

/**
 * 单元格完整样式
 */
export interface CellStyle {
  /** 数字格式代码 */
  numFmt?: string;
  /** 数字格式 ID */
  numFmtId?: number;
  /** 字体样式 */
  font?: FontStyle;
  /** 填充样式 */
  fill?: Fill;
  /** 边框样式 */
  border?: Border;
  /** 对齐样式 */
  alignment?: Alignment;
  /** 保护设置 */
  protection?: Protection;
  /** 是否引用日期系统 */
  quotePrefix?: boolean;
  /** 是否隐藏样式 */
  hidden?: boolean;
}

// ============ 富文本 ============

/**
 * 富文本片段
 */
export interface RichTextRun {
  text: string;
  font?: FontStyle;
}

/**
 * 富文本
 */
export type RichText = RichTextRun[];

// ============ 单元格 ============

/**
 * 单元格公式
 */
export interface CellFormula {
  /** 公式文本 */
  text: string;
  /** 公式类型 */
  type?: 'normal' | 'array' | 'dataTable' | 'shared';
  /** 共享公式引用 */
  ref?: string;
  /** 共享公式索引 */
  si?: number;
  /** 数组公式范围 */
  range?: string;
}

/**
 * 超链接定义
 */
export interface Hyperlink {
  /** 链接地址 */
  target: string;
  /** 链接类型 */
  type: 'url' | 'email' | 'internal' | 'file';
  /** 提示文本 */
  tooltip?: string;
  /** 显示文本 */
  display?: string;
  /** 定位位置 */
  location?: string;
}

/**
 * 单元格数据
 */
export interface Cell {
  /** 单元格地址 (如 "A1") */
  address: string;
  /** 行号 (0-based) */
  row: number;
  /** 列号 (0-based) */
  col: number;
  /** 原始值 */
  value: string | number | boolean | Date | RichText | null;
  /** 值类型 */
  type: CellValueType;
  /** 显示文本 */
  text: string;
  /** 格式化后的值 */
  formattedValue?: string;
  /** 公式 */
  formula?: CellFormula;
  /** 样式索引 */
  styleIndex?: number;
  /** 内联样式 */
  style?: CellStyle;
  /** 超链接 */
  hyperlink?: Hyperlink;
  /** 批注 */
  comment?: Comment;
  /** 错误类型 */
  error?: CellErrorType;
  /** 合并单元格信息 */
  merge?: CellRange;
  /** 是否是合并单元格的主单元格 */
  isMergeOrigin?: boolean;
  /** 是否被合并 */
  isMerged?: boolean;
}

// ============ 行列定义 ============

/**
 * 行定义
 */
export interface Row {
  /** 行号 (0-based) */
  index: number;
  /** 行高 (像素) */
  height: number;
  /** 是否隐藏 */
  hidden: boolean;
  /** 样式索引 */
  styleIndex?: number;
  /** 轮廓级别 */
  outlineLevel?: number;
  /** 是否折叠 */
  collapsed?: boolean;
  /** 自定义高度 */
  customHeight?: boolean;
  /** 是否粗体 */
  thickTop?: boolean;
  thickBot?: boolean;
}

/**
 * 列定义
 */
export interface Column {
  /** 列号 (0-based) */
  index: number;
  /** 列宽 (字符单位) */
  width: number;
  /** 列宽 (像素) */
  pixelWidth: number;
  /** 是否隐藏 */
  hidden: boolean;
  /** 样式索引 */
  styleIndex?: number;
  /** 轮廓级别 */
  outlineLevel?: number;
  /** 是否折叠 */
  collapsed?: boolean;
  /** 最佳适应 */
  bestFit?: boolean;
  /** 自定义宽度 */
  customWidth?: boolean;
}

// ============ 合并单元格 ============

/**
 * 合并单元格区域
 */
export interface MergeCell {
  /** 范围引用 (如 "A1:C3") */
  ref: string;
  /** 起始行 (0-based) */
  startRow: number;
  /** 起始列 (0-based) */
  startCol: number;
  /** 结束行 (0-based) */
  endRow: number;
  /** 结束列 (0-based) */
  endCol: number;
}

// ============ 批注 ============

/**
 * 批注
 */
export interface Comment {
  /** 作者 */
  author?: string;
  /** 批注内容 */
  text: string | RichText;
  /** 是否可见 */
  visible?: boolean;
  /** 位置 */
  anchor?: CommentAnchor;
}

/**
 * 批注锚点
 */
export interface CommentAnchor {
  from: { col: number; colOff: number; row: number; rowOff: number };
  to: { col: number; colOff: number; row: number; rowOff: number };
}

// ============ 条件格式 ============

/**
 * 条件格式规则类型
 */
export type ConditionalFormatType =
  | 'cellIs'
  | 'expression'
  | 'colorScale'
  | 'dataBar'
  | 'iconSet'
  | 'top10'
  | 'aboveAverage'
  | 'uniqueValues'
  | 'duplicateValues'
  | 'containsText'
  | 'notContainsText'
  | 'beginsWith'
  | 'endsWith'
  | 'containsBlanks'
  | 'notContainsBlanks'
  | 'containsErrors'
  | 'notContainsErrors'
  | 'timePeriod';

/**
 * 条件格式操作符
 */
export type ConditionalOperator =
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'equal'
  | 'notEqual'
  | 'greaterThanOrEqual'
  | 'greaterThan'
  | 'between'
  | 'notBetween';

/**
 * 数据条方向
 */
export type DataBarDirection = 'leftToRight' | 'rightToLeft' | 'context';

/**
 * 图标集类型
 */
export type IconSetType =
  | '3Arrows'
  | '3ArrowsGray'
  | '3Flags'
  | '3TrafficLights1'
  | '3TrafficLights2'
  | '3Signs'
  | '3Symbols'
  | '3Symbols2'
  | '4Arrows'
  | '4ArrowsGray'
  | '4RedToBlack'
  | '4Rating'
  | '4TrafficLights'
  | '5Arrows'
  | '5ArrowsGray'
  | '5Rating'
  | '5Quarters';

/**
 * 条件格式规则
 */
export interface ConditionalFormatRule {
  /** 规则类型 */
  type: ConditionalFormatType;
  /** 优先级 */
  priority: number;
  /** 应用范围 */
  ranges: string[];
  /** 操作符 */
  operator?: ConditionalOperator;
  /** 公式/值 */
  formula?: string[];
  /** 样式 */
  style?: CellStyle;
  /** 色阶 */
  colorScale?: {
    cfvo: Array<{ type: string; val?: string }>;
    color: Color[];
  };
  /** 数据条 */
  dataBar?: {
    minLength?: number;
    maxLength?: number;
    showValue?: boolean;
    gradient?: boolean;
    color: Color;
    borderColor?: Color;
    negativeFillColor?: Color;
    direction?: DataBarDirection;
  };
  /** 图标集 */
  iconSet?: {
    iconSet: IconSetType;
    showValue?: boolean;
    reverse?: boolean;
    cfvo: Array<{ type: string; val?: string; gte?: boolean }>;
  };
  /** 是否停止应用 */
  stopIfTrue?: boolean;
}

// ============ 数据验证 ============

/**
 * 数据验证类型
 */
export type DataValidationType =
  | 'none'
  | 'whole'
  | 'decimal'
  | 'list'
  | 'date'
  | 'time'
  | 'textLength'
  | 'custom';

/**
 * 数据验证操作符
 */
export type DataValidationOperator =
  | 'between'
  | 'notBetween'
  | 'equal'
  | 'notEqual'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual';

/**
 * 错误提示样式
 */
export type DataValidationErrorStyle = 'stop' | 'warning' | 'information';

/**
 * 数据验证规则
 */
export interface DataValidation {
  /** 验证类型 */
  type: DataValidationType;
  /** 操作符 */
  operator?: DataValidationOperator;
  /** 应用范围 */
  ranges: string[];
  /** 公式1 / 列表值 */
  formula1?: string;
  /** 公式2 (用于 between 等操作) */
  formula2?: string;
  /** 允许空值 */
  allowBlank?: boolean;
  /** 显示下拉箭头 */
  showDropDown?: boolean;
  /** 显示输入提示 */
  showInputMessage?: boolean;
  /** 显示错误提示 */
  showErrorMessage?: boolean;
  /** 输入提示标题 */
  promptTitle?: string;
  /** 输入提示内容 */
  prompt?: string;
  /** 错误提示标题 */
  errorTitle?: string;
  /** 错误提示内容 */
  error?: string;
  /** 错误提示样式 */
  errorStyle?: DataValidationErrorStyle;
}

// ============ 冻结窗格 ============

/**
 * 冻结窗格
 */
export interface FreezePane {
  /** 冻结行数 */
  rows: number;
  /** 冻结列数 */
  cols: number;
  /** 顶部左侧单元格 */
  topLeftCell?: string;
  /** 活动窗格 */
  activePane?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  /** 状态 */
  state?: 'frozen' | 'frozenSplit' | 'split';
}

// ============ 自动筛选 ============

/**
 * 筛选条件
 */
export interface FilterCriteria {
  /** 筛选类型 */
  type: 'value' | 'custom' | 'dynamic' | 'color' | 'icon' | 'top10';
  /** 值筛选 */
  values?: string[];
  /** 自定义筛选 */
  customFilters?: Array<{
    operator?: 'equal' | 'notEqual' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual';
    val: string;
  }>;
  /** 动态筛选类型 */
  dynamicType?: string;
  /** Top10 设置 */
  top10?: {
    top?: boolean;
    percent?: boolean;
    val?: number;
  };
}

/**
 * 自动筛选
 */
export interface AutoFilter {
  /** 筛选范围 */
  ref: string;
  /** 列筛选条件 */
  columns?: Map<number, FilterCriteria>;
}

// ============ 图表 ============

/**
 * 图表类型
 */
export type ChartType =
  | 'bar'
  | 'column'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'scatter'
  | 'bubble'
  | 'radar'
  | 'stock'
  | 'surface'
  | 'combo';

/**
 * 图表系列
 */
export interface ChartSeries {
  name?: string;
  categories?: string;
  values: string;
  fill?: Color;
  line?: { color?: Color; width?: number };
}

/**
 * 图表定义
 */
export interface Chart {
  /** 图表类型 */
  type: ChartType;
  /** 标题 */
  title?: string;
  /** 系列数据 */
  series: ChartSeries[];
  /** 图例位置 */
  legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
  /** 锚点位置 */
  anchor?: {
    from: { col: number; colOff: number; row: number; rowOff: number };
    to: { col: number; colOff: number; row: number; rowOff: number };
  };
  /** 样式 */
  style?: number;
}

// ============ 图片 ============

/**
 * 图片类型
 */
export type ImageType = 'png' | 'jpeg' | 'gif' | 'bmp' | 'tiff' | 'emf' | 'wmf';

/**
 * 图片定位类型
 */
export type ImagePositionType = 'oneCell' | 'twoCell' | 'absolute';

/**
 * 图片定义
 */
export interface Image {
  /** 图片 ID */
  id: string;
  /** 图片类型 */
  type: ImageType;
  /** 图片数据 (Base64) */
  data: string;
  /** 文件名 */
  filename?: string;
  /** 描述 */
  description?: string;
  /** 宽度 (像素) */
  width: number;
  /** 高度 (像素) */
  height: number;
  /** 定位类型 */
  positionType: ImagePositionType;
  /** 锚点 */
  anchor: {
    from: { col: number; colOff: number; row: number; rowOff: number };
    to?: { col: number; colOff: number; row: number; rowOff: number };
  };
  /** 旋转角度 */
  rotation?: number;
  /** 翻转 */
  flipH?: boolean;
  flipV?: boolean;
}

// ============ 数据透视表 ============

/**
 * 数据透视表字段
 */
export interface PivotField {
  name: string;
  axis?: 'row' | 'col' | 'page' | 'data';
  compact?: boolean;
  outline?: boolean;
  subtotalTop?: boolean;
  showAll?: boolean;
}

/**
 * 数据透视表定义
 */
export interface PivotTable {
  name: string;
  source: string;
  location: string;
  fields: PivotField[];
  rowFields?: number[];
  colFields?: number[];
  dataFields?: Array<{
    field: number;
    subtotal?: 'sum' | 'count' | 'average' | 'max' | 'min' | 'product' | 'countNums' | 'stdDev' | 'stdDevp' | 'var' | 'varp';
    name?: string;
  }>;
  pageFields?: number[];
  style?: string;
}

// ============ 表格 ============

/**
 * 表格样式
 */
export interface TableStyleInfo {
  name?: string;
  showFirstColumn?: boolean;
  showLastColumn?: boolean;
  showRowStripes?: boolean;
  showColumnStripes?: boolean;
}

/**
 * 表格列
 */
export interface TableColumn {
  id: number;
  name: string;
  totalsRowLabel?: string;
  totalsRowFunction?: 'average' | 'count' | 'countNums' | 'max' | 'min' | 'stdDev' | 'sum' | 'var' | 'custom';
  totalsRowFormula?: string;
}

/**
 * 表格定义
 */
export interface Table {
  id: number;
  name: string;
  displayName: string;
  ref: string;
  headerRowCount?: number;
  totalsRowCount?: number;
  totalsRowShown?: boolean;
  columns: TableColumn[];
  autoFilter?: AutoFilter;
  sortState?: SortState;
  styleInfo?: TableStyleInfo;
}

/**
 * 排序状态
 */
export interface SortState {
  ref: string;
  caseSensitive?: boolean;
  sortConditions: Array<{
    ref: string;
    descending?: boolean;
    sortBy?: 'value' | 'cellColor' | 'fontColor' | 'icon';
  }>;
}

// ============ 打印设置 ============

/**
 * 页面方向
 */
export type PageOrientation = 'portrait' | 'landscape';

/**
 * 纸张大小
 */
export type PaperSize =
  | 'letter'
  | 'legal'
  | 'executive'
  | 'a3'
  | 'a4'
  | 'a5'
  | 'b4'
  | 'b5'
  | 'folio'
  | 'quarto'
  | 'tabloid';

/**
 * 页面边距
 */
export interface PageMargins {
  left: number;
  right: number;
  top: number;
  bottom: number;
  header: number;
  footer: number;
}

/**
 * 打印设置
 */
export interface PrintOptions {
  /** 页面方向 */
  orientation?: PageOrientation;
  /** 纸张大小 */
  paperSize?: PaperSize;
  /** 缩放比例 */
  scale?: number;
  /** 适合页宽 */
  fitToWidth?: number;
  /** 适合页高 */
  fitToHeight?: number;
  /** 页边距 */
  margins?: PageMargins;
  /** 打印区域 */
  printArea?: string;
  /** 打印标题行 */
  printTitlesRow?: string;
  /** 打印标题列 */
  printTitlesColumn?: string;
  /** 黑白打印 */
  blackAndWhite?: boolean;
  /** 草稿模式 */
  draft?: boolean;
  /** 打印网格线 */
  gridLines?: boolean;
  /** 打印行列标题 */
  headings?: boolean;
  /** 水平居中 */
  horizontalCentered?: boolean;
  /** 垂直居中 */
  verticalCentered?: boolean;
  /** 页面顺序 */
  pageOrder?: 'downThenOver' | 'overThenDown';
  /** 页眉 */
  header?: HeaderFooter;
  /** 页脚 */
  footer?: HeaderFooter;
}

/**
 * 页眉页脚
 */
export interface HeaderFooter {
  oddHeader?: string;
  oddFooter?: string;
  evenHeader?: string;
  evenFooter?: string;
  firstHeader?: string;
  firstFooter?: string;
  differentOddEven?: boolean;
  differentFirst?: boolean;
}

// ============ 工作表视图 ============

/**
 * 工作表视图设置
 */
export interface SheetView {
  /** 是否活动 */
  tabSelected?: boolean;
  /** 显示网格线 */
  showGridLines?: boolean;
  /** 显示行列标题 */
  showRowColHeaders?: boolean;
  /** 显示零值 */
  showZeros?: boolean;
  /** 从右到左 */
  rightToLeft?: boolean;
  /** 显示公式 */
  showFormulas?: boolean;
  /** 显示轮廓符号 */
  showOutlineSymbols?: boolean;
  /** 默认网格颜色 */
  defaultGridColor?: boolean;
  /** 视图类型 */
  view?: 'normal' | 'pageBreakPreview' | 'pageLayout';
  /** 缩放比例 */
  zoomScale?: number;
  /** 普通视图缩放 */
  zoomScaleNormal?: number;
  /** 分页预览缩放 */
  zoomScalePageLayoutView?: number;
  /** 工作簿视图 ID */
  workbookViewId?: number;
  /** 活动单元格 */
  activeCell?: string;
  /** 选区 */
  selection?: Array<{
    pane?: string;
    activeCell?: string;
    activeCellId?: number;
    sqref?: string;
  }>;
}

// ============ 工作表保护 ============

/**
 * 工作表保护设置
 */
export interface SheetProtection {
  password?: string;
  sheet?: boolean;
  objects?: boolean;
  scenarios?: boolean;
  formatCells?: boolean;
  formatColumns?: boolean;
  formatRows?: boolean;
  insertColumns?: boolean;
  insertRows?: boolean;
  insertHyperlinks?: boolean;
  deleteColumns?: boolean;
  deleteRows?: boolean;
  selectLockedCells?: boolean;
  sort?: boolean;
  autoFilter?: boolean;
  pivotTables?: boolean;
  selectUnlockedCells?: boolean;
}

// ============ 工作表 ============

/**
 * 工作表类型
 */
export type SheetType = 'worksheet' | 'chartsheet' | 'dialogsheet' | 'macrosheet';

/**
 * 工作表状态
 */
export type SheetState = 'visible' | 'hidden' | 'veryHidden';

/**
 * 工作表定义
 */
export interface Sheet {
  /** 工作表 ID */
  id: string;
  /** 工作表名称 */
  name: string;
  /** 工作表类型 */
  type: SheetType;
  /** 可见状态 */
  state: SheetState;
  /** 工作表索引 (0-based) */
  index: number;
  /** 标签颜色 */
  tabColor?: Color;
  /** 行数据 */
  rows: Map<number, Row>;
  /** 列数据 */
  columns: Map<number, Column>;
  /** 单元格数据 */
  cells: Map<string, Cell>;
  /** 合并单元格 */
  mergeCells: MergeCell[];
  /** 冻结窗格 */
  freezePane?: FreezePane;
  /** 自动筛选 */
  autoFilter?: AutoFilter;
  /** 数据验证 */
  dataValidations: DataValidation[];
  /** 条件格式 */
  conditionalFormats: ConditionalFormatRule[];
  /** 超链接 */
  hyperlinks: Map<string, Hyperlink>;
  /** 批注 */
  comments: Map<string, Comment>;
  /** 图片 */
  images: Image[];
  /** 图表 */
  charts: Chart[];
  /** 表格 */
  tables: Table[];
  /** 数据透视表 */
  pivotTables: PivotTable[];
  /** 视图设置 */
  views: SheetView[];
  /** 打印设置 */
  printOptions?: PrintOptions;
  /** 保护设置 */
  protection?: SheetProtection;
  /** 轮廓属性 */
  outlineProperties?: {
    summaryBelow?: boolean;
    summaryRight?: boolean;
  };
  /** 维度 */
  dimension?: {
    start: CellAddress;
    end: CellAddress;
    ref: string;
  };
  /** 默认行高 */
  defaultRowHeight?: number;
  /** 默认列宽 */
  defaultColWidth?: number;
}

// ============ 命名范围 ============

/**
 * 定义名称
 */
export interface DefinedName {
  name: string;
  ref: string;
  scope?: string;
  comment?: string;
  hidden?: boolean;
}

// ============ 样式表 ============

/**
 * 数字格式
 */
export interface NumberFormat {
  id: number;
  formatCode: string;
}

/**
 * 样式表
 */
export interface Stylesheet {
  numFmts: NumberFormat[];
  fonts: FontStyle[];
  fills: Fill[];
  borders: Border[];
  cellXfs: CellStyle[];
  cellStyleXfs: CellStyle[];
  cellStyles: Array<{
    name: string;
    xfId: number;
    builtinId?: number;
  }>;
}

// ============ 工作簿属性 ============

/**
 * 工作簿属性
 */
export interface WorkbookProperties {
  date1904?: boolean;
  defaultThemeVersion?: number;
  filterPrivacy?: boolean;
}

/**
 * 文档属性
 */
export interface DocumentProperties {
  title?: string;
  subject?: string;
  creator?: string;
  keywords?: string;
  description?: string;
  lastModifiedBy?: string;
  revision?: string;
  created?: Date;
  modified?: Date;
  category?: string;
  contentStatus?: string;
  company?: string;
  manager?: string;
  application?: string;
  appVersion?: string;
}

// ============ 主题 ============

/**
 * 主题颜色
 */
export interface ThemeColors {
  dk1: string;
  lt1: string;
  dk2: string;
  lt2: string;
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  accent5: string;
  accent6: string;
  hlink: string;
  folHlink: string;
}

/**
 * 主题字体
 */
export interface ThemeFonts {
  major: { latin: string; ea: string; cs: string };
  minor: { latin: string; ea: string; cs: string };
}

/**
 * 主题定义
 */
export interface Theme {
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
}

// ============ 工作簿 ============

/**
 * Excel 工作簿
 */
export interface Workbook {
  /** 工作表列表 */
  sheets: Sheet[];
  /** 活动工作表索引 */
  activeSheet: number;
  /** 样式表 */
  styles: Stylesheet;
  /** 定义名称 */
  definedNames: DefinedName[];
  /** 主题 */
  theme?: Theme;
  /** 文档属性 */
  properties: DocumentProperties;
  /** 工作簿属性 */
  workbookProperties: WorkbookProperties;
  /** 共享字符串 */
  sharedStrings: Array<string | RichText>;
}

// ============ 渲染选项 ============

/**
 * 渲染主题
 */
export interface RenderTheme {
  /** 主题名称 */
  name: string;
  /** 背景色 */
  backgroundColor: string;
  /** 网格线颜色 */
  gridLineColor: string;
  /** 选区颜色 */
  selectionColor: string;
  /** 选区边框颜色 */
  selectionBorderColor: string;
  /** 冻结线颜色 */
  freezeLineColor: string;
  /** 标题背景色 */
  headerBackgroundColor: string;
  /** 标题文字颜色 */
  headerTextColor: string;
  /** 标题边框颜色 */
  headerBorderColor: string;
  /** 默认文字颜色 */
  defaultTextColor: string;
  /** 滚动条颜色 */
  scrollbarColor: string;
  /** 滚动条轨道颜色 */
  scrollbarTrackColor: string;
}

/**
 * 预定义渲染主题
 */
export const RENDER_THEMES: Record<string, RenderTheme> = {
  light: {
    name: 'light',
    backgroundColor: '#ffffff',
    gridLineColor: '#e0e0e0',
    selectionColor: 'rgba(33, 150, 243, 0.1)',
    selectionBorderColor: '#2196f3',
    freezeLineColor: '#1565c0',
    headerBackgroundColor: '#f5f5f5',
    headerTextColor: '#333333',
    headerBorderColor: '#cccccc',
    defaultTextColor: '#000000',
    scrollbarColor: '#c1c1c1',
    scrollbarTrackColor: '#f1f1f1'
  },
  dark: {
    name: 'dark',
    backgroundColor: '#1e1e1e',
    gridLineColor: '#3a3a3a',
    selectionColor: 'rgba(100, 181, 246, 0.2)',
    selectionBorderColor: '#64b5f6',
    freezeLineColor: '#42a5f5',
    headerBackgroundColor: '#2d2d2d',
    headerTextColor: '#e0e0e0',
    headerBorderColor: '#4a4a4a',
    defaultTextColor: '#e0e0e0',
    scrollbarColor: '#555555',
    scrollbarTrackColor: '#2d2d2d'
  },
  excel: {
    name: 'excel',
    backgroundColor: '#ffffff',
    gridLineColor: '#d4d4d4',
    selectionColor: 'rgba(0, 120, 215, 0.1)',
    selectionBorderColor: '#0078d7',
    freezeLineColor: '#538135',
    headerBackgroundColor: '#f0f0f0',
    headerTextColor: '#000000',
    headerBorderColor: '#b0b0b0',
    defaultTextColor: '#000000',
    scrollbarColor: '#a0a0a0',
    scrollbarTrackColor: '#e8e8e8'
  }
};

/**
 * 渲染选项
 */
export interface RenderOptions {
  /** 渲染主题 */
  theme?: RenderTheme | string;
  /** 是否显示网格线 */
  showGridLines?: boolean;
  /** 是否显示行列标题 */
  showRowColHeaders?: boolean;
  /** 是否显示零值 */
  showZeros?: boolean;
  /** 是否显示公式 */
  showFormulas?: boolean;
  /** 缩放比例 (0.1 - 4) */
  zoom?: number;
  /** 默认字体 */
  defaultFont?: string;
  /** 默认字号 */
  defaultFontSize?: number;
  /** 默认行高 */
  defaultRowHeight?: number;
  /** 默认列宽 */
  defaultColWidth?: number;
  /** 最小列宽 */
  minColWidth?: number;
  /** 最大列宽 */
  maxColWidth?: number;
  /** 最小行高 */
  minRowHeight?: number;
  /** 最大行高 */
  maxRowHeight?: number;
  /** 行标题宽度 */
  rowHeaderWidth?: number;
  /** 列标题高度 */
  colHeaderHeight?: number;
  /** 启用虚拟滚动 */
  virtualScroll?: boolean;
  /** 过度渲染行数 */
  overscanRowCount?: number;
  /** 过度渲染列数 */
  overscanColCount?: number;
  /** 单元格内边距 */
  cellPadding?: number;
}

/**
 * 默认渲染选项
 */
export const DEFAULT_RENDER_OPTIONS: Required<RenderOptions> = {
  theme: RENDER_THEMES.excel,
  showGridLines: true,
  showRowColHeaders: true,
  showZeros: true,
  showFormulas: false,
  zoom: 1,
  defaultFont: 'Calibri, Arial, sans-serif',
  defaultFontSize: 12,
  defaultRowHeight: 20,
  defaultColWidth: 64,
  minColWidth: 20,
  maxColWidth: 2000,
  minRowHeight: 10,
  maxRowHeight: 500,
  rowHeaderWidth: 50,
  colHeaderHeight: 25,
  virtualScroll: true,
  overscanRowCount: 5,
  overscanColCount: 2,
  cellPadding: 4
};

// ============ 事件类型 ============

/**
 * 事件类型
 */
export type EventType =
  | 'load'
  | 'loadError'
  | 'sheetChange'
  | 'cellClick'
  | 'cellDoubleClick'
  | 'cellRightClick'
  | 'cellHover'
  | 'selectionChange'
  | 'scroll'
  | 'zoom'
  | 'resize'
  | 'linkClick'
  | 'contextMenu';

/**
 * 事件基础数据
 */
export interface BaseEventData {
  type: EventType;
  timestamp: number;
}

/**
 * 加载完成事件
 */
export interface LoadEvent extends BaseEventData {
  type: 'load';
  workbook: Workbook;
  loadTime: number;
}

/**
 * 加载错误事件
 */
export interface LoadErrorEvent extends BaseEventData {
  type: 'loadError';
  error: Error;
  message: string;
}

/**
 * 工作表切换事件
 */
export interface SheetChangeEvent extends BaseEventData {
  type: 'sheetChange';
  sheetIndex: number;
  sheetName: string;
  previousIndex: number;
}

/**
 * 单元格点击事件
 */
export interface CellClickEvent extends BaseEventData {
  type: 'cellClick' | 'cellDoubleClick' | 'cellRightClick';
  cell: Cell | null;
  address: string;
  row: number;
  col: number;
  event: MouseEvent;
}

/**
 * 单元格悬停事件
 */
export interface CellHoverEvent extends BaseEventData {
  type: 'cellHover';
  cell: Cell | null;
  address: string;
  row: number;
  col: number;
}

/**
 * 选区变化事件
 */
export interface SelectionChangeEvent extends BaseEventData {
  type: 'selectionChange';
  selection: CellRange[];
  activeCell: CellAddress | null;
}

/**
 * 滚动事件
 */
export interface ScrollEvent extends BaseEventData {
  type: 'scroll';
  scrollLeft: number;
  scrollTop: number;
  startRow: number;
  startCol: number;
}

/**
 * 缩放事件
 */
export interface ZoomEvent extends BaseEventData {
  type: 'zoom';
  zoom: number;
  previousZoom: number;
}

/**
 * 链接点击事件
 */
export interface LinkClickEvent extends BaseEventData {
  type: 'linkClick';
  hyperlink: Hyperlink;
  cell: Cell;
  event: MouseEvent;
}

/**
 * 右键菜单事件
 */
export interface ContextMenuEvent extends BaseEventData {
  type: 'contextMenu';
  cell: Cell | null;
  address: string;
  row: number;
  col: number;
  x: number;
  y: number;
  event: MouseEvent;
}

/**
 * 所有事件数据联合类型
 */
export type EventData =
  | LoadEvent
  | LoadErrorEvent
  | SheetChangeEvent
  | CellClickEvent
  | CellHoverEvent
  | SelectionChangeEvent
  | ScrollEvent
  | ZoomEvent
  | LinkClickEvent
  | ContextMenuEvent;

// ============ 导出选项 ============

/**
 * 导出格式
 */
export type ExportFormat = 'xlsx' | 'csv' | 'html' | 'json' | 'pdf' | 'png' | 'svg';

/**
 * CSV 导出选项
 */
export interface CsvExportOptions {
  delimiter?: string;
  lineEnding?: '\r\n' | '\n';
  includeHeaders?: boolean;
  encoding?: 'utf-8' | 'utf-16' | 'gbk';
  bom?: boolean;
}

/**
 * HTML 导出选项
 */
export interface HtmlExportOptions {
  includeStyles?: boolean;
  inlineStyles?: boolean;
  className?: string;
}

/**
 * 图片导出选项
 */
export interface ImageExportOptions {
  scale?: number;
  backgroundColor?: string;
  quality?: number;
}

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 导出格式 */
  format: ExportFormat;
  /** 工作表索引 (默认当前工作表) */
  sheetIndex?: number;
  /** 范围 (默认全部) */
  range?: string;
  /** 文件名 */
  filename?: string;
  /** CSV 选项 */
  csv?: CsvExportOptions;
  /** HTML 选项 */
  html?: HtmlExportOptions;
  /** 图片选项 */
  image?: ImageExportOptions;
}

// ============ 查看器选项 ============

/**
 * 工具栏配置
 */
export interface ToolbarConfig {
  /** 是否显示工具栏 */
  visible?: boolean;
  /** 是否显示工作表标签 */
  showSheetTabs?: boolean;
  /** 是否显示缩放控件 */
  showZoom?: boolean;
  /** 是否显示全屏按钮 */
  showFullscreen?: boolean;
  /** 是否显示导出按钮 */
  showExport?: boolean;
  /** 是否显示打印按钮 */
  showPrint?: boolean;
  /** 是否显示搜索 */
  showSearch?: boolean;
  /** 自定义按钮 */
  customButtons?: Array<{
    id: string;
    icon?: string;
    text?: string;
    title?: string;
    onClick: () => void;
  }>;
}

/**
 * Excel 查看器选项
 */
export interface ExcelViewerOptions {
  /** 容器元素或选择器 */
  container: HTMLElement | string;
  /** 渲染选项 */
  renderOptions?: RenderOptions;
  /** 工具栏配置 */
  toolbar?: ToolbarConfig;
  /** 是否只读 */
  readonly?: boolean;
  /** 是否启用选择 */
  enableSelection?: boolean;
  /** 是否启用上下文菜单 */
  enableContextMenu?: boolean;
  /** 是否启用列/行调整大小 */
  enableResize?: boolean;
  /** 是否启用复制 */
  enableCopy?: boolean;
  /** 语言 */
  locale?: string;
  /** 本地化文本 */
  localeTexts?: Record<string, string>;
  /** 事件回调 */
  on?: Partial<Record<EventType, (data: EventData) => void>>;
}
