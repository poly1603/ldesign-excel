# API 参考文档

## 目录

- [核心类](#核心类)
  - [ExcelViewer](#excelviewer)
  - [ExcelParser](#excelparser)
  - [ExcelRenderer](#excelrenderer)
  - [ExcelExporter](#excelexporter)
- [功能类](#功能类)
  - [FormulaEngine](#formulaengine)
  - [DataValidator](#datavalidator)
  - [FindReplaceManager](#findreplacemanager)
  - [KeyboardManager](#keyboardmanager)
  - [I18nManager](#i18nmanager)
- [工具类](#工具类)
  - [LRUCache](#lrucache)
  - [SparseMatrix](#sparsematrix)
  - [MemoryMonitor](#memorymonitor)
  - [WorkerPool](#workerpool)
- [类型定义](#类型定义)

---

## 核心类

### ExcelViewer

Excel 查看器主类,提供完整的 Excel 文件预览和编辑功能。

#### 构造函数

```typescript
constructor(options: ExcelViewerOptions)
```

**参数:**
- `options` - 配置选项

**示例:**
```typescript
const viewer = new ExcelViewer({
  container: '#excel-viewer',
  showToolbar: true,
  allowEdit: true,
  lang: 'zh-CN',
});
```

#### 方法

##### loadFile()

加载 Excel 文件。

```typescript
async loadFile(file: File | ArrayBuffer | string): Promise<void>
```

**参数:**
- `file` - 文件对象、ArrayBuffer 或 URL

**返回:** Promise<void>

**示例:**
```typescript
await viewer.loadFile(file);
```

##### getData()

获取所有工作表数据。

```typescript
getData(): SheetData[]
```

**返回:** 工作表数据数组

##### getCurrentSheetData()

获取当前工作表数据。

```typescript
getCurrentSheetData(): any
```

**返回:** 当前工作表数据

##### exportFile()

导出文件为指定格式。

```typescript
exportFile(options: ExportOptions): Blob
```

**参数:**
- `options` - 导出选项

**返回:** Blob 对象

**示例:**
```typescript
const blob = viewer.exportFile({
  format: 'xlsx',
  includeStyles: true,
  includeFormulas: true,
});
```

##### downloadFile()

下载导出的文件。

```typescript
downloadFile(options: ExportOptions): void
```

**参数:**
- `options` - 导出选项

**示例:**
```typescript
viewer.downloadFile({
  format: 'csv',
  filename: 'export.csv',
});
```

##### setCellValue()

设置单元格值。

```typescript
setCellValue(row: number, col: number, value: any): void
```

**参数:**
- `row` - 行索引(从 0 开始)
- `col` - 列索引(从 0 开始)
- `value` - 单元格值

##### getCellValue()

获取单元格值。

```typescript
getCellValue(row: number, col: number): any
```

**参数:**
- `row` - 行索引
- `col` - 列索引

**返回:** 单元格值

##### on()

监听事件。

```typescript
on(event: EventType, listener: EventListener): void
```

**参数:**
- `event` - 事件类型
- `listener` - 事件监听器

**示例:**
```typescript
viewer.on('cellChange', (data) => {
  console.log('单元格变化:', data);
});
```

##### off()

取消监听事件。

```typescript
off(event: EventType, listener: EventListener): void
```

##### destroy()

销毁实例,释放资源。

```typescript
destroy(): void
```

---

### ExcelParser

Excel 文件解析器,负责解析 Excel 文件。

#### 方法

##### loadFromFile()

从文件加载。

```typescript
async loadFromFile(file: File): Promise<SheetData[]>
```

##### loadFromArrayBuffer()

从 ArrayBuffer 加载。

```typescript
loadFromArrayBuffer(arrayBuffer: ArrayBuffer): SheetData[]
```

##### loadFromUrl()

从 URL 加载。

```typescript
async loadFromUrl(url: string): Promise<SheetData[]>
```

---

## 功能类

### FormulaEngine

公式计算引擎,支持 100+ Excel 函数。

#### 方法

##### calculate()

计算公式。

```typescript
calculate(formula: string, cellRef?: string): FormulaResult
```

**参数:**
- `formula` - 公式字符串(可以带或不带前导 =)
- `cellRef` - 可选的单元格引用

**返回:** 计算结果

**示例:**
```typescript
const engine = new FormulaEngine();
engine.setCellValue('A1', 10);
engine.setCellValue('A2', 20);

const result = engine.calculate('=SUM(A1:A2)');
console.log(result.value); // 30
```

##### registerFunction()

注册自定义函数。

```typescript
registerFunction(name: string, func: FormulaFunction): void
```

**参数:**
- `name` - 函数名(大写)
- `func` - 函数实现

**示例:**
```typescript
engine.registerFunction('DOUBLE', (num: number) => num * 2);
const result = engine.calculate('=DOUBLE(5)');
console.log(result.value); // 10
```

##### setCellValue()

设置单元格值。

```typescript
setCellValue(cellRef: string, value: any): void
```

**参数:**
- `cellRef` - 单元格引用(如 'A1')
- `value` - 值

#### 支持的函数

**数学函数:**
- SUM, AVERAGE, MAX, MIN, COUNT, COUNTA
- ABS, ROUND, ROUNDUP, ROUNDDOWN
- CEILING, FLOOR, INT, MOD
- POWER, SQRT, EXP, LN, LOG10
- PI, RAND, RANDBETWEEN

**逻辑函数:**
- IF, AND, OR, NOT
- TRUE, FALSE
- IFERROR, IFNA

**文本函数:**
- CONCATENATE, CONCAT
- LEFT, RIGHT, MID
- LEN, LOWER, UPPER, PROPER
- TRIM, SUBSTITUTE, REPLACE
- FIND, SEARCH, TEXT, VALUE

**日期时间函数:**
- TODAY, NOW, DATE, TIME
- YEAR, MONTH, DAY
- HOUR, MINUTE, SECOND
- WEEKDAY, DATEDIF

**查找引用函数:**
- VLOOKUP, HLOOKUP
- INDEX, MATCH, CHOOSE

**统计函数:**
- MEDIAN, MODE, STDEV, VAR

---

### DataValidator

数据验证器,支持多种验证规则。

#### 方法

##### addRule()

添加验证规则。

```typescript
addRule(cellRef: string, rule: ValidationRule): void
```

**参数:**
- `cellRef` - 单元格引用
- `rule` - 验证规则

**示例:**
```typescript
const validator = new DataValidator();

// 整数范围验证
validator.addRule('A1', {
  type: ValidationType.WHOLE_NUMBER,
  operator: ValidationOperator.BETWEEN,
  formula1: '1',
  formula2: '100',
  errorMessage: '请输入 1-100 之间的整数',
});

// 下拉列表
validator.addRule('B1', {
  type: ValidationType.LIST,
  list: ['选项1', '选项2', '选项3'],
  showDropdown: true,
});
```

##### validate()

验证值。

```typescript
validate(cellRef: string, value: any): ValidationResult
```

**参数:**
- `cellRef` - 单元格引用
- `value` - 要验证的值

**返回:** 验证结果

**示例:**
```typescript
const result = validator.validate('A1', 50);
if (!result.valid) {
  console.error(result.error);
}
```

#### 验证类型

- `ValidationType.ANY` - 任意值
- `ValidationType.WHOLE_NUMBER` - 整数
- `ValidationType.DECIMAL` - 小数
- `ValidationType.LIST` - 列表
- `ValidationType.DATE` - 日期
- `ValidationType.TIME` - 时间
- `ValidationType.TEXT_LENGTH` - 文本长度
- `ValidationType.CUSTOM` - 自定义公式

#### 验证操作符

- `ValidationOperator.BETWEEN` - 区间
- `ValidationOperator.NOT_BETWEEN` - 非区间
- `ValidationOperator.EQUAL` - 等于
- `ValidationOperator.NOT_EQUAL` - 不等于
- `ValidationOperator.GREATER_THAN` - 大于
- `ValidationOperator.LESS_THAN` - 小于
- `ValidationOperator.GREATER_THAN_OR_EQUAL` - 大于等于
- `ValidationOperator.LESS_THAN_OR_EQUAL` - 小于等于

---

### FindReplaceManager

查找替换管理器,支持正则表达式。

#### 方法

##### find()

查找文本。

```typescript
find(data: any[], options: FindOptions): FindResult[]
```

**参数:**
- `data` - 工作表数据
- `options` - 查找选项

**返回:** 查找结果数组

**示例:**
```typescript
const manager = new FindReplaceManager();

const results = manager.find(data, {
  keyword: 'hello',
  caseSensitive: false,
  useRegex: false,
  scope: 'all',
});

console.log(`找到 ${results.length} 个匹配项`);
```

##### replace()

替换文本。

```typescript
replace(
  data: any[], 
  options: ReplaceOptions,
  onCellChange?: (sheetIndex, row, col, oldValue, newValue) => void
): ReplaceResult
```

**参数:**
- `data` - 工作表数据
- `options` - 替换选项
- `onCellChange` - 可选的回调函数

**返回:** 替换结果

**示例:**
```typescript
const result = manager.replace(data, {
  keyword: 'hello',
  replaceText: 'world',
  replaceAll: true,
  useRegex: false,
}, (sheetIndex, row, col, oldValue, newValue) => {
  console.log(`替换: ${oldValue} -> ${newValue}`);
});

console.log(`共替换 ${result.count} 处`);
```

##### findNext()

查找下一个。

```typescript
findNext(): FindResult | null
```

##### findPrevious()

查找上一个。

```typescript
findPrevious(): FindResult | null
```

---

### KeyboardManager

快捷键管理器。

#### 方法

##### register()

注册快捷键。

```typescript
register(shortcut: KeyboardShortcut): void
```

**参数:**
- `shortcut` - 快捷键配置

**示例:**
```typescript
const keyboard = new KeyboardManager();

keyboard.register({
  key: 's',
  modifiers: { ctrl: true },
  handler: (event) => {
    console.log('保存');
    return false; // 阻止默认行为
  },
  description: '保存',
});
```

##### startListening()

开始监听键盘事件。

```typescript
startListening(element?: HTMLElement): void
```

##### stopListening()

停止监听键盘事件。

```typescript
stopListening(element?: HTMLElement): void
```

---

### I18nManager

国际化管理器。

#### 方法

##### t()

翻译文本。

```typescript
t(key: string, params?: Record<string, any>): string
```

**参数:**
- `key` - 翻译键(支持点号分隔)
- `params` - 可选的参数对象

**返回:** 翻译后的文本

**示例:**
```typescript
const i18n = new I18nManager('zh-CN');

const text = i18n.t('common.save');  // "保存"
const welcome = i18n.t('welcome', { name: 'John' }); // "欢迎, John"
```

##### setLocale()

设置语言。

```typescript
setLocale(locale: SupportedLocale): void
```

**参数:**
- `locale` - 语言代码

##### formatDate()

格式化日期。

```typescript
formatDate(date: Date, format?: string): string
```

**参数:**
- `date` - 日期对象
- `format` - 可选的格式字符串或预定义格式('short', 'medium', 'long', 'full')

**返回:** 格式化后的日期字符串

##### formatNumber()

格式化数字。

```typescript
formatNumber(num: number, decimals?: number): string
```

**参数:**
- `num` - 数字
- `decimals` - 小数位数(默认 2)

**返回:** 格式化后的数字字符串

##### formatCurrency()

格式化货币。

```typescript
formatCurrency(amount: number, decimals?: number): string
```

**参数:**
- `amount` - 金额
- `decimals` - 小数位数(默认 2)

**返回:** 格式化后的货币字符串

---

## 工具类

### LRUCache

最近最少使用缓存。

#### 构造函数

```typescript
constructor(capacity: number = 100)
```

#### 方法

```typescript
get(key: K): V | undefined
set(key: K, value: V): void
delete(key: K): boolean
has(key: K): boolean
clear(): void
size(): number
getHitRate(): number
getStats(): { hits, misses, hitRate, size }
```

**示例:**
```typescript
const cache = new LRUCache<string, any>(100);

cache.set('key1', { data: 'value1' });
const value = cache.get('key1');

const stats = cache.getStats();
console.log(`命中率: ${stats.hitRate * 100}%`);
```

---

### SparseMatrix

稀疏矩阵,用于优化大型但稀疏的数据存储。

#### 方法

```typescript
set(row: number, col: number, value: T): void
get(row: number, col: number): T | undefined
delete(row: number, col: number): boolean
has(row: number, col: number): boolean
getNonZeroCount(): number
getSparsity(): number
clear(): void
toArray(defaultValue: T): T[][]
forEach(callback: (value: T, row: number, col: number) => void): void
```

**示例:**
```typescript
const matrix = new SparseMatrix<number>();

matrix.set(1000, 1000, 42);
const value = matrix.get(1000, 1000); // 42

console.log(`稀疏度: ${matrix.getSparsity()}`); // 接近 1.0
```

---

### MemoryMonitor

内存监控器。

#### 构造函数

```typescript
constructor(options?: {
  checkInterval?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
})
```

#### 方法

```typescript
start(): void
stop(): void
check(): MemoryInfo | null
getMemoryInfo(): MemoryInfo | null
onMemoryChange(callback: (info: MemoryInfo) => void): void
offMemoryChange(callback: (info: MemoryInfo) => void): void
```

**示例:**
```typescript
const monitor = new MemoryMonitor({
  checkInterval: 5000,
  warningThreshold: 0.7,
  criticalThreshold: 0.9,
});

monitor.onMemoryChange((info) => {
  console.log(`内存使用: ${(info.usageRatio * 100).toFixed(2)}%`);
});

monitor.start();
```

---

### WorkerPool

Web Worker 池管理器。

#### 方法

```typescript
execute<T>(
  type: WorkerMessageType,
  payload: any,
  options?: {
    onProgress?: (progress: number, message: string) => void;
    timeout?: number;
  }
): Promise<T>

getStats(): {
  totalWorkers: number;
  busyWorkers: number;
  idleWorkers: number;
  queuedTasks: number;
}

destroy(): void
```

**示例:**
```typescript
const pool = new WorkerPool({ maxWorkers: 4 });

const result = await pool.execute(
  WorkerMessageType.PARSE_ARRAY_BUFFER,
  arrayBuffer,
  {
    onProgress: (progress, message) => {
      console.log(`${progress}%: ${message}`);
    },
    timeout: 60000,
  }
);

console.log(pool.getStats());
```

---

## 类型定义

### ExcelViewerOptions

```typescript
interface ExcelViewerOptions {
  container: string | HTMLElement;
  showToolbar?: boolean;
  showFormulaBar?: boolean;
  showSheetTabs?: boolean;
  allowEdit?: boolean;
  allowCopy?: boolean;
  allowPaste?: boolean;
  enableVirtualScroll?: boolean;
  virtualScrollThreshold?: number;
  lang?: 'zh-CN' | 'en-US';
  theme?: 'light' | 'dark';
  customStyle?: string;
  hooks?: ExcelViewerHooks;
  performance?: {
    useWebWorker?: boolean;
    chunkSize?: number;
    lazyLoad?: boolean;
  };
}
```

### ValidationRule

```typescript
interface ValidationRule {
  type: ValidationType;
  operator?: ValidationOperator;
  formula1?: string;
  formula2?: string;
  list?: string[];
  allowBlank?: boolean;
  showDropdown?: boolean;
  promptTitle?: string;
  promptMessage?: string;
  showPrompt?: boolean;
  errorTitle?: string;
  errorMessage?: string;
  showError?: boolean;
  errorStyle?: ValidationErrorStyle;
}
```

### FindOptions

```typescript
interface FindOptions {
  keyword: string;
  caseSensitive?: boolean;
  matchWholeWord?: boolean;
  useRegex?: boolean;
  scope?: 'current' | 'all' | 'selection';
  direction?: 'forward' | 'backward';
  wrap?: boolean;
  searchFormulas?: boolean;
  startPosition?: { row: number; col: number };
}
```

---

更多类型定义请参考源代码中的 `types.ts` 文件。


