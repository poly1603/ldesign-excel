/**
 * Excel 查看器主类
 * @description 提供完整的 Excel 文档查看功能
 */
import type {
  Workbook,
  Sheet,
  Cell,
  RenderOptions,
  ExcelViewerOptions,
  EventType,
  EventData,
  LoadEvent,
  LoadErrorEvent,
  SheetChangeEvent,
  CellClickEvent,
  SelectionChangeEvent,
  ScrollEvent,
  ZoomEvent,
  CellRange,
  CellAddress,
  ToolbarConfig
} from './types';
import { DEFAULT_RENDER_OPTIONS, RENDER_THEMES } from './types';
import { ExcelParser } from './parser/ExcelParser';
import { SheetRenderer } from './renderer/SheetRenderer';
import { DomRenderer } from './renderer/DomRenderer';
import { EventEmitter, type EventListener } from './events/EventEmitter';

/**
 * 渲染模式
 */
export type RenderMode = 'canvas' | 'dom';

/**
 * 默认工具栏配置
 */
const DEFAULT_TOOLBAR_CONFIG: Required<ToolbarConfig> = {
  visible: true,
  showSheetTabs: true,
  showZoom: true,
  showFullscreen: true,
  showExport: true,
  showPrint: true,
  showSearch: true,
  customButtons: []
};

/**
 * Excel 查看器
 */
export class ExcelViewer {
  private container: HTMLElement;
  private options: ExcelViewerOptions;
  private renderOptions: Required<RenderOptions>;
  private toolbarConfig: Required<ToolbarConfig>;

  private workbook: Workbook | null = null;
  private currentSheetIndex: number = 0;

  private parser: ExcelParser;
  private renderer: SheetRenderer | null = null;
  private domRenderer: DomRenderer | null = null;
  private renderMode: RenderMode = 'dom';
  private emitter: EventEmitter;

  // DOM 元素
  private rootElement: HTMLElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private domViewerElement: HTMLElement | null = null;
  private toolbarElement: HTMLElement | null = null;
  private sheetTabsElement: HTMLElement | null = null;
  private scrollContainer: HTMLElement | null = null;
  private scrollContent: HTMLElement | null = null;

  // 状态
  private isLoading: boolean = false;
  private isFullscreen: boolean = false;
  private selection: CellRange | null = null;
  private activeCell: CellAddress | null = null;

  // 滚动状态
  private scrollLeft: number = 0;
  private scrollTop: number = 0;

  // 事件处理器引用
  private resizeObserver: ResizeObserver | null = null;
  private boundHandlers: Map<string, EventListener> = new Map();

  constructor(options: ExcelViewerOptions) {
    // 解析容器
    if (typeof options.container === 'string') {
      const el = document.querySelector(options.container);
      if (!el) {
        throw new Error(`找不到容器元素: ${options.container}`);
      }
      this.container = el as HTMLElement;
    } else {
      this.container = options.container;
    }

    this.options = options;
    this.renderOptions = {
      ...DEFAULT_RENDER_OPTIONS,
      ...options.renderOptions
    } as Required<RenderOptions>;
    this.toolbarConfig = {
      ...DEFAULT_TOOLBAR_CONFIG,
      ...options.toolbar
    };

    this.parser = new ExcelParser();
    this.emitter = new EventEmitter();

    // 注册事件回调
    if (options.on) {
      Object.entries(options.on).forEach(([type, callback]) => {
        if (callback) {
          this.on(type as EventType, callback);
        }
      });
    }

    this.initDOM();
    this.bindEvents();
  }

  /**
   * 初始化 DOM 结构
   */
  private initDOM(): void {
    // 创建根元素
    this.rootElement = document.createElement('div');
    this.rootElement.className = 'excel-viewer';
    this.rootElement.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${this.getTheme().backgroundColor};
    `;

    // 创建工具栏
    if (this.toolbarConfig.visible) {
      this.toolbarElement = this.createToolbar();
      this.rootElement.appendChild(this.toolbarElement);
    }

    // 创建主视图容器
    const viewContainer = document.createElement('div');
    viewContainer.className = 'excel-viewer-main';
    viewContainer.style.cssText = `
      flex: 1;
      position: relative;
      overflow: hidden;
    `;

    // 创建滚动容器
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.className = 'excel-viewer-scroll';
    this.scrollContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: ${this.toolbarConfig.showSheetTabs ? '32px' : '0'};
      overflow: auto;
    `;

    if (this.renderMode === 'dom') {
      // DOM 渲染模式 - 直接使用 scrollContainer 作为渲染容器
      this.domViewerElement = this.scrollContainer;
    } else {
      // Canvas 渲染模式
      this.scrollContent = document.createElement('div');
      this.scrollContent.className = 'excel-viewer-scroll-content';
      this.scrollContent.style.cssText = `position: absolute; top: 0; left: 0;`;
      this.scrollContainer.appendChild(this.scrollContent);

      this.canvasElement = document.createElement('canvas');
      this.canvasElement.className = 'excel-viewer-canvas';
      this.canvasElement.style.cssText = `position: sticky; top: 0; left: 0; display: block;`;
      this.scrollContainer.appendChild(this.canvasElement);
    }

    viewContainer.appendChild(this.scrollContainer);

    // 创建工作表标签
    if (this.toolbarConfig.showSheetTabs) {
      this.sheetTabsElement = this.createSheetTabs();
      viewContainer.appendChild(this.sheetTabsElement);
    }

    this.rootElement.appendChild(viewContainer);
    this.container.appendChild(this.rootElement);

    // 初始化渲染器
    if (this.renderMode === 'dom' && this.domViewerElement) {
      this.domRenderer = new DomRenderer(this.domViewerElement, {
        defaultColWidth: this.renderOptions.defaultColWidth,
        defaultRowHeight: this.renderOptions.defaultRowHeight,
        defaultFont: this.renderOptions.defaultFont,
        defaultFontSize: this.renderOptions.defaultFontSize,
        zoom: this.renderOptions.zoom,
        showGridLines: this.renderOptions.showGridLines,
        showRowHeaders: this.renderOptions.showRowColHeaders,
        showColHeaders: this.renderOptions.showRowColHeaders
      });
    } else if (this.canvasElement) {
      this.renderer = new SheetRenderer(this.canvasElement, this.renderOptions);
    }
  }

  /**
   * 创建工具栏
   */
  private createToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'excel-viewer-toolbar';
    toolbar.style.cssText = `
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      gap: 8px;
      flex-shrink: 0;
    `;

    // 文件信息
    const fileInfo = document.createElement('div');
    fileInfo.className = 'excel-viewer-file-info';
    fileInfo.style.cssText = `flex: 1; font-size: 14px; color: #333;`;
    fileInfo.textContent = '未加载文件';
    toolbar.appendChild(fileInfo);

    // 缩放控制
    if (this.toolbarConfig.showZoom) {
      const zoomGroup = this.createZoomControls();
      toolbar.appendChild(zoomGroup);
    }

    // 全屏按钮
    if (this.toolbarConfig.showFullscreen) {
      const fullscreenBtn = this.createButton('⛶', '全屏', () => this.toggleFullscreen());
      toolbar.appendChild(fullscreenBtn);
    }

    // 导出按钮
    if (this.toolbarConfig.showExport) {
      const exportBtn = this.createButton('↓', '导出', () => this.showExportMenu());
      toolbar.appendChild(exportBtn);
    }

    // 打印按钮
    if (this.toolbarConfig.showPrint) {
      const printBtn = this.createButton('🖨', '打印', () => this.print());
      toolbar.appendChild(printBtn);
    }

    // 自定义按钮
    this.toolbarConfig.customButtons.forEach(btn => {
      const button = this.createButton(btn.icon || '●', btn.title || btn.text || '', btn.onClick);
      if (btn.text) {
        button.textContent = btn.text;
      }
      toolbar.appendChild(button);
    });

    return toolbar;
  }

  /**
   * 创建缩放控件
   */
  private createZoomControls(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'excel-viewer-zoom';
    group.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
    `;

    const zoomOut = this.createButton('−', '缩小', () => this.zoomOut());
    group.appendChild(zoomOut);

    const zoomLabel = document.createElement('span');
    zoomLabel.className = 'excel-viewer-zoom-label';
    zoomLabel.style.cssText = `
      min-width: 50px;
      text-align: center;
      font-size: 12px;
      color: #666;
    `;
    zoomLabel.textContent = `${Math.round(this.renderOptions.zoom * 100)}%`;
    group.appendChild(zoomLabel);

    const zoomIn = this.createButton('+', '放大', () => this.zoomIn());
    group.appendChild(zoomIn);

    return group;
  }

  /**
   * 创建按钮
   */
  private createButton(icon: string, title: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'excel-viewer-btn';
    button.title = title;
    button.textContent = icon;
    button.style.cssText = `
      width: 32px;
      height: 32px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    `;
    button.addEventListener('mouseenter', () => {
      button.style.background = '#e8e8e8';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'white';
    });
    button.addEventListener('click', onClick);
    return button;
  }

  /**
   * 创建工作表标签
   */
  private createSheetTabs(): HTMLElement {
    const tabs = document.createElement('div');
    tabs.className = 'excel-viewer-sheet-tabs';
    tabs.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 32px;
      display: flex;
      align-items: center;
      background: #f0f0f0;
      border-top: 1px solid #ccc;
      overflow-x: auto;
      padding: 0 8px;
      gap: 2px;
    `;
    return tabs;
  }

  /**
   * 更新工作表标签
   */
  private updateSheetTabs(): void {
    if (!this.sheetTabsElement || !this.workbook) return;

    this.sheetTabsElement.innerHTML = '';

    this.workbook.sheets.forEach((sheet, index) => {
      if (sheet.state === 'hidden' || sheet.state === 'veryHidden') return;

      const tab = document.createElement('button');
      tab.className = 'excel-viewer-sheet-tab';
      tab.textContent = sheet.name;
      tab.style.cssText = `
        padding: 4px 16px;
        border: 1px solid #ccc;
        border-bottom: none;
        border-radius: 4px 4px 0 0;
        background: ${index === this.currentSheetIndex ? 'white' : '#e8e8e8'};
        cursor: pointer;
        font-size: 12px;
        white-space: nowrap;
        margin-bottom: -1px;
      `;

      tab.addEventListener('click', () => this.switchSheet(index));
      this.sheetTabsElement!.appendChild(tab);
    });
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    if (!this.scrollContainer || !this.canvasElement) return;

    // 滚动事件
    const handleScroll = () => {
      this.scrollLeft = this.scrollContainer!.scrollLeft;
      this.scrollTop = this.scrollContainer!.scrollTop;
      this.updateViewport();
      this.render();

      this.emit<ScrollEvent>({
        type: 'scroll',
        timestamp: Date.now(),
        scrollLeft: this.scrollLeft,
        scrollTop: this.scrollTop,
        startRow: 0,
        startCol: 0
      });
    };
    this.scrollContainer.addEventListener('scroll', handleScroll);

    // 点击事件
    const handleClick = (e: MouseEvent) => {
      const cell = this.getCellAtPoint(e.offsetX, e.offsetY);
      if (cell) {
        this.handleCellClick(cell.row, cell.col, e);
      }
    };
    this.canvasElement.addEventListener('click', handleClick);

    // 双击事件
    const handleDblClick = (e: MouseEvent) => {
      const cell = this.getCellAtPoint(e.offsetX, e.offsetY);
      if (cell) {
        this.handleCellDoubleClick(cell.row, cell.col, e);
      }
    };
    this.canvasElement.addEventListener('dblclick', handleDblClick);

    // 右键事件
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const cell = this.getCellAtPoint(e.offsetX, e.offsetY);
      if (cell) {
        this.handleCellRightClick(cell.row, cell.col, e);
      }
    };
    this.canvasElement.addEventListener('contextmenu', handleContextMenu);

    // 尺寸变化
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(this.container);

    // 键盘事件
    const handleKeydown = (e: KeyboardEvent) => {
      this.handleKeydown(e);
    };
    this.rootElement?.addEventListener('keydown', handleKeydown);
    this.rootElement?.setAttribute('tabindex', '0');
  }

  /**
   * 获取当前主题
   */
  private getTheme() {
    const theme = this.renderOptions.theme;
    if (typeof theme === 'string') {
      return RENDER_THEMES[theme] || RENDER_THEMES.excel;
    }
    return theme;
  }

  /**
   * 加载文件
   */
  async loadFile(file: File): Promise<void> {
    await this.loadData(file);
  }

  /**
   * 加载 URL
   */
  async loadUrl(url: string): Promise<void> {
    this.isLoading = true;
    this.showLoading();

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`加载失败: ${response.statusText}`);
      }
      const data = await response.arrayBuffer();
      await this.loadData(data);
    } catch (error) {
      this.hideLoading();
      this.isLoading = false;
      throw error;
    }
  }

  /**
   * 加载数据
   */
  async loadData(data: ArrayBuffer | Uint8Array | Blob | File): Promise<void> {
    this.isLoading = true;
    this.showLoading();
    const startTime = Date.now();

    try {
      this.workbook = await this.parser.parse(data);
      this.currentSheetIndex = this.workbook.activeSheet;

      // 更新 UI
      this.updateSheetTabs();
      this.updateFileInfo();
      this.updateScrollSize();
      this.updateViewport();

      // 设置当前工作表
      const currentSheet = this.workbook.sheets[this.currentSheetIndex];
      if (currentSheet) {
        if (this.renderMode === 'dom' && this.domRenderer) {
          this.domRenderer.setSheet(currentSheet);
        } else if (this.renderer) {
          this.renderer.setSheet(currentSheet);
          // 使用 requestAnimationFrame 确保 DOM 布局完成后再渲染
          requestAnimationFrame(() => {
            this.updateViewport();
            this.render();
            requestAnimationFrame(() => {
              this.updateViewport();
              this.render();
            });
          });
        }
      }

      this.hideLoading();
      this.isLoading = false;

      const loadTime = Date.now() - startTime;
      this.emit<LoadEvent>({
        type: 'load',
        timestamp: Date.now(),
        workbook: this.workbook,
        loadTime
      });
    } catch (error) {
      this.hideLoading();
      this.isLoading = false;

      this.emit<LoadErrorEvent>({
        type: 'loadError',
        timestamp: Date.now(),
        error: error as Error,
        message: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * 更新文件信息
   */
  private updateFileInfo(): void {
    const fileInfo = this.toolbarElement?.querySelector('.excel-viewer-file-info');
    if (fileInfo && this.workbook) {
      const sheetCount = this.workbook.sheets.length;
      fileInfo.textContent = `${sheetCount} 个工作表`;
    }
  }

  /**
   * 更新滚动区域大小
   */
  private updateScrollSize(): void {
    // DOM 渲染器不需要手动设置滚动大小
    if (this.renderMode === 'dom') return;
    if (!this.scrollContent || !this.renderer) return;

    const totalWidth = this.renderer.getTotalWidth();
    const totalHeight = this.renderer.getTotalHeight();

    this.scrollContent.style.width = `${totalWidth}px`;
    this.scrollContent.style.height = `${totalHeight}px`;
  }

  /**
   * 更新视口
   */
  private updateViewport(): void {
    // DOM 渲染器不需要视口更新（自带滚动）
    if (this.renderMode === 'dom') return;
    if (!this.renderer) return;
    this.renderer.setViewport(this.scrollLeft, this.scrollTop);
  }

  /**
   * 渲染
   */
  render(): void {
    // DOM 渲染器的渲染在 setSheet 时已完成
    if (this.renderMode === 'dom') return;
    if (!this.renderer || !this.workbook) return;
    this.renderer.render();
  }

  /**
   * 切换工作表
   */
  switchSheet(index: number): void {
    if (!this.workbook || index < 0 || index >= this.workbook.sheets.length) return;
    if (index === this.currentSheetIndex) return;

    const previousIndex = this.currentSheetIndex;
    this.currentSheetIndex = index;
    const sheet = this.workbook.sheets[index];

    if (this.renderMode === 'dom' && this.domRenderer) {
      this.domRenderer.setSheet(sheet);
    } else if (this.renderer) {
      this.renderer.setSheet(sheet);
    }

    // 重置滚动位置
    this.scrollLeft = 0;
    this.scrollTop = 0;
    if (this.scrollContainer) {
      this.scrollContainer.scrollLeft = 0;
      this.scrollContainer.scrollTop = 0;
    }

    this.updateScrollSize();
    this.updateViewport();
    this.updateSheetTabs();
    this.render();

    this.emit<SheetChangeEvent>({
      type: 'sheetChange',
      timestamp: Date.now(),
      sheetIndex: index,
      sheetName: sheet.name,
      previousIndex
    });
  }

  /**
   * 获取当前工作表
   */
  getCurrentSheet(): Sheet | null {
    if (!this.workbook) return null;
    return this.workbook.sheets[this.currentSheetIndex] || null;
  }

  /**
   * 获取单元格
   */
  getCell(address: string): Cell | null {
    const sheet = this.getCurrentSheet();
    if (!sheet) return null;
    return sheet.cells.get(address) || null;
  }

  /**
   * 根据坐标获取单元格
   */
  private getCellAtPoint(x: number, y: number): { row: number; col: number } | null {
    if (!this.renderer) return null;
    return this.renderer.getCellAt(x, y);
  }

  /**
   * 处理单元格点击
   */
  private handleCellClick(row: number, col: number, event: MouseEvent): void {
    const sheet = this.getCurrentSheet();
    const address = this.formatAddress(row, col);
    const cell = sheet?.cells.get(address) || null;

    // 更新选区
    this.selection = { start: { row, col }, end: { row, col } };
    this.activeCell = { row, col };

    if (this.renderer) {
      this.renderer.setSelection(row, col, row, col);
      this.render();
    }

    this.emit<CellClickEvent>({
      type: 'cellClick',
      timestamp: Date.now(),
      cell,
      address,
      row,
      col,
      event
    });

    this.emit<SelectionChangeEvent>({
      type: 'selectionChange',
      timestamp: Date.now(),
      selection: [this.selection],
      activeCell: this.activeCell
    });
  }

  /**
   * 处理单元格双击
   */
  private handleCellDoubleClick(row: number, col: number, event: MouseEvent): void {
    const sheet = this.getCurrentSheet();
    const address = this.formatAddress(row, col);
    const cell = sheet?.cells.get(address) || null;

    // 处理超链接
    if (cell?.hyperlink) {
      window.open(cell.hyperlink.target, '_blank');
    }

    this.emit<CellClickEvent>({
      type: 'cellDoubleClick',
      timestamp: Date.now(),
      cell,
      address,
      row,
      col,
      event
    });
  }

  /**
   * 处理单元格右键
   */
  private handleCellRightClick(row: number, col: number, event: MouseEvent): void {
    const sheet = this.getCurrentSheet();
    const address = this.formatAddress(row, col);
    const cell = sheet?.cells.get(address) || null;

    this.emit<CellClickEvent>({
      type: 'cellRightClick',
      timestamp: Date.now(),
      cell,
      address,
      row,
      col,
      event
    });
  }

  /**
   * 处理键盘事件
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (!this.activeCell) return;

    let { row, col } = this.activeCell;
    let moved = false;

    switch (e.key) {
      case 'ArrowUp':
        if (row > 0) { row--; moved = true; }
        break;
      case 'ArrowDown':
        row++; moved = true;
        break;
      case 'ArrowLeft':
        if (col > 0) { col--; moved = true; }
        break;
      case 'ArrowRight':
        col++; moved = true;
        break;
      case 'Tab':
        e.preventDefault();
        col += e.shiftKey ? -1 : 1;
        if (col < 0) col = 0;
        moved = true;
        break;
      case 'Enter':
        row += e.shiftKey ? -1 : 1;
        if (row < 0) row = 0;
        moved = true;
        break;
      case 'c':
        if (e.ctrlKey || e.metaKey) {
          this.copySelection();
        }
        break;
    }

    if (moved) {
      e.preventDefault();
      this.handleCellClick(row, col, new MouseEvent('click'));
    }
  }

  /**
   * 处理尺寸变化
   */
  private handleResize(): void {
    // DOM 渲染器不需要处理尺寸变化
    if (this.renderMode === 'dom') return;

    if (!this.canvasElement || !this.renderer) return;

    const rect = this.scrollContainer?.getBoundingClientRect();
    if (rect) {
      this.canvasElement.style.width = `${rect.width}px`;
      this.canvasElement.style.height = `${rect.height}px`;
    }

    this.renderer.resizeCanvas();
    this.updateViewport();
    this.render();
  }

  /**
   * 格式化单元格地址
   */
  private formatAddress(row: number, col: number): string {
    let colStr = '';
    let c = col + 1;
    while (c > 0) {
      const remainder = (c - 1) % 26;
      colStr = String.fromCharCode(65 + remainder) + colStr;
      c = Math.floor((c - 1) / 26);
    }
    return `${colStr}${row + 1}`;
  }

  /**
   * 缩放
   */
  setZoom(zoom: number): void {
    zoom = Math.max(0.1, Math.min(4, zoom));
    const previousZoom = this.renderOptions.zoom;

    if (zoom === previousZoom) return;

    this.renderOptions.zoom = zoom;

    if (this.renderMode === 'dom' && this.domRenderer) {
      this.domRenderer.setZoom(zoom);
    } else if (this.renderer) {
      this.renderer.updateOptions({ zoom });
      this.updateScrollSize();
      this.updateViewport();
      this.render();
    }

    this.updateZoomLabel();

    this.emit<ZoomEvent>({
      type: 'zoom',
      timestamp: Date.now(),
      zoom,
      previousZoom
    });
  }

  /**
   * 放大
   */
  zoomIn(): void {
    const steps = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
    const current = this.renderOptions.zoom;
    const next = steps.find(s => s > current) || 4;
    this.setZoom(next);
  }

  /**
   * 缩小
   */
  zoomOut(): void {
    const steps = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
    const current = this.renderOptions.zoom;
    const prev = [...steps].reverse().find(s => s < current) || 0.25;
    this.setZoom(prev);
  }

  /**
   * 更新缩放标签
   */
  private updateZoomLabel(): void {
    const label = this.toolbarElement?.querySelector('.excel-viewer-zoom-label');
    if (label) {
      label.textContent = `${Math.round(this.renderOptions.zoom * 100)}%`;
    }
  }

  /**
   * 切换全屏
   */
  toggleFullscreen(): void {
    if (!this.rootElement) return;

    if (!this.isFullscreen) {
      if (this.rootElement.requestFullscreen) {
        this.rootElement.requestFullscreen();
      }
      this.isFullscreen = true;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      this.isFullscreen = false;
    }
  }

  /**
   * 显示导出菜单
   */
  private showExportMenu(): void {
    // TODO: 实现导出菜单
    console.log('导出菜单');
  }

  /**
   * 打印
   */
  print(): void {
    // TODO: 实现打印功能
    window.print();
  }

  /**
   * 复制选区
   */
  private copySelection(): void {
    if (!this.selection) return;

    const sheet = this.getCurrentSheet();
    if (!sheet) return;

    const { start, end } = this.selection;
    const rows: string[][] = [];

    for (let r = start.row; r <= end.row; r++) {
      const row: string[] = [];
      for (let c = start.col; c <= end.col; c++) {
        const address = this.formatAddress(r, c);
        const cell = sheet.cells.get(address);
        row.push(cell?.text || '');
      }
      rows.push(row);
    }

    const text = rows.map(row => row.join('\t')).join('\n');
    navigator.clipboard.writeText(text).catch(console.error);
  }

  /**
   * 显示加载
   */
  private showLoading(): void {
    if (!this.rootElement) return;

    const loading = document.createElement('div');
    loading.className = 'excel-viewer-loading';
    loading.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.9);
      z-index: 1000;
    `;
    loading.innerHTML = `
      <div style="text-align: center;">
        <div style="width: 40px; height: 40px; border: 3px solid #e0e0e0; border-top-color: #2196f3; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        <div style="margin-top: 12px; color: #666;">加载中...</div>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
    this.rootElement.appendChild(loading);
  }

  /**
   * 隐藏加载
   */
  private hideLoading(): void {
    const loading = this.rootElement?.querySelector('.excel-viewer-loading');
    if (loading) {
      loading.remove();
    }
  }

  /**
   * 订阅事件
   */
  on<T extends EventData>(type: T['type'], listener: EventListener<T>): () => void {
    return this.emitter.on(type, listener);
  }

  /**
   * 取消订阅
   */
  off<T extends EventData>(type: T['type'], listener: EventListener<T>): void {
    this.emitter.off(type, listener);
  }

  /**
   * 发送事件
   */
  private emit<T extends EventData>(data: T): void {
    this.emitter.emit(data);
  }

  /**
   * 获取工作簿
   */
  getWorkbook(): Workbook | null {
    return this.workbook;
  }

  /**
   * 销毁
   */
  destroy(): void {
    // 移除事件监听
    this.resizeObserver?.disconnect();
    this.emitter.removeAllListeners();

    // 移除 DOM
    if (this.rootElement) {
      this.rootElement.remove();
    }

    this.workbook = null;
    this.renderer = null;
  }
}
