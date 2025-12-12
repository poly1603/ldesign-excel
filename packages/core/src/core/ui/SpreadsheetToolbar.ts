/**
 * 电子表格工具栏组件
 * 提供完整的 WPS/腾讯文档风格工具栏，包含所有格式化和编辑功能
 */

import { createIcon } from './Icons';

export interface ToolbarAction {
  /** 操作 ID */
  id: string;
  /** 操作值 */
  value?: string;
}

export interface SpreadsheetToolbarOptions {
  /** 文件名 */
  fileName?: string;
  /** 工作表数量 */
  sheetCount?: number;
  /** 初始缩放比例 */
  zoom?: number;
  /** 是否只读模式 */
  readonly?: boolean;
  /** 是否显示文件操作栏 */
  showFileBar?: boolean;
  /** 操作回调 */
  onAction?: (action: ToolbarAction) => void;
  /** 缩放变化回调 */
  onZoomChange?: (zoom: number) => void;
  /** 打开文件回调 */
  onOpenFile?: () => void;
}

interface ToolbarGroup {
  id: string;
  items: ToolbarItemConfig[];
}

interface ToolbarItemConfig {
  id: string;
  type: 'button' | 'dropdown' | 'color-picker' | 'separator' | 'font-size' | 'font-family' | 'zoom';
  icon?: string;
  tooltip?: string;
  shortcut?: string;
  disabled?: boolean;
  active?: boolean;
  value?: string;
  options?: Array<{ value: string; label: string }>;
}

/**
 * 电子表格工具栏
 */
export class SpreadsheetToolbar {
  private container: HTMLElement;
  private options: Required<SpreadsheetToolbarOptions>;

  private headerBar: HTMLElement | null = null;
  private toolbar: HTMLElement | null = null;
  private itemStates: Map<string, { active: boolean; value?: string }> = new Map();
  private currentZoom: number = 100;

  constructor(container: HTMLElement, options: SpreadsheetToolbarOptions = {}) {
    this.container = container;
    this.options = {
      fileName: '未命名工作簿',
      sheetCount: 1,
      zoom: 100,
      readonly: false,
      showFileBar: true,
      onAction: () => { },
      onZoomChange: () => { },
      onOpenFile: () => { },
      ...options
    };
    this.currentZoom = this.options.zoom;

    this.init();
  }

  private init(): void {
    this.container.innerHTML = '';
    this.container.style.cssText = `
      display: flex;
      flex-direction: column;
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      user-select: none;
    `;

    // 创建文件操作栏（顶部标题栏）
    if (this.options.showFileBar) {
      this.headerBar = this.createHeaderBar();
      this.container.appendChild(this.headerBar);
    }

    // 创建格式工具栏
    this.toolbar = this.createToolbar();
    this.container.appendChild(this.toolbar);
  }

  /**
   * 创建顶部文件操作栏
   */
  private createHeaderBar(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'spreadsheet-header-bar';
    header.style.cssText = `
      display: flex;
      align-items: center;
      padding: 6px 12px;
      background: linear-gradient(180deg, #f8f9fa 0%, #f0f1f2 100%);
      border-bottom: 1px solid #e0e0e0;
      gap: 12px;
      min-height: 40px;
    `;

    // Logo/图标
    const logo = document.createElement('div');
    logo.className = 'header-logo';
    logo.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" fill="#217346"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">XL</text>
      </svg>
    `;
    logo.style.cssText = 'display: flex; align-items: center;';
    header.appendChild(logo);

    // 文件名和工作表信息
    const fileInfo = document.createElement('div');
    fileInfo.className = 'header-file-info';
    fileInfo.style.cssText = `
      display: flex;
      flex-direction: column;
      flex: 1;
    `;

    const fileName = document.createElement('div');
    fileName.className = 'header-file-name';
    fileName.textContent = this.options.fileName;
    fileName.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      color: #333;
      cursor: pointer;
    `;
    fileName.title = '点击重命名';

    const sheetInfo = document.createElement('div');
    sheetInfo.className = 'header-sheet-info';
    sheetInfo.textContent = `${this.options.sheetCount} 个工作表`;
    sheetInfo.style.cssText = `
      font-size: 11px;
      color: #666;
    `;

    fileInfo.appendChild(fileName);
    fileInfo.appendChild(sheetInfo);
    header.appendChild(fileInfo);

    // 打开文件按钮
    const openBtn = this.createHeaderButton('打开文件', 'folder-open', () => {
      this.options.onOpenFile?.();
    });
    header.appendChild(openBtn);

    // 缩放控制
    const zoomControl = this.createZoomControl();
    header.appendChild(zoomControl);

    // 其他操作按钮
    const actionsGroup = document.createElement('div');
    actionsGroup.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
    `;

    actionsGroup.appendChild(this.createHeaderButton('分享', 'share', () => this.emitAction('share')));
    actionsGroup.appendChild(this.createHeaderButton('打印', 'printer', () => this.emitAction('print')));
    actionsGroup.appendChild(this.createHeaderButton('全屏', 'maximize', () => this.emitAction('fullscreen')));

    header.appendChild(actionsGroup);

    return header;
  }

  /**
   * 创建顶部栏按钮
   */
  private createHeaderButton(text: string, iconName: string, onClick: () => void): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'header-button';
    btn.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border: 1px solid #d0d0d0;
      border-radius: 4px;
      background: #fff;
      font-size: 13px;
      color: #333;
      cursor: pointer;
      transition: all 0.15s;
    `;
    btn.innerHTML = `${createIcon(iconName, 16)}<span>${text}</span>`;

    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#f0f0f0';
      btn.style.borderColor = '#bbb';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = '#fff';
      btn.style.borderColor = '#d0d0d0';
    });
    btn.addEventListener('click', onClick);

    return btn;
  }

  /**
   * 创建缩放控制
   */
  private createZoomControl(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'zoom-control';
    wrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      border-left: 1px solid #e0e0e0;
      border-right: 1px solid #e0e0e0;
    `;

    // 缩小按钮
    const zoomOut = document.createElement('button');
    zoomOut.innerHTML = createIcon('minus', 14);
    zoomOut.title = '缩小';
    zoomOut.style.cssText = this.getSmallButtonStyle();
    zoomOut.addEventListener('click', () => this.handleZoom('out'));
    wrapper.appendChild(zoomOut);

    // 缩放值显示
    const zoomLabel = document.createElement('span');
    zoomLabel.className = 'zoom-label';
    zoomLabel.textContent = `${this.currentZoom}%`;
    zoomLabel.style.cssText = `
      min-width: 45px;
      text-align: center;
      font-size: 12px;
      color: #333;
      cursor: pointer;
    `;
    zoomLabel.title = '点击选择缩放比例';
    zoomLabel.addEventListener('click', (e) => this.showZoomMenu(e, zoomLabel));
    wrapper.appendChild(zoomLabel);

    // 放大按钮
    const zoomIn = document.createElement('button');
    zoomIn.innerHTML = createIcon('plus', 14);
    zoomIn.title = '放大';
    zoomIn.style.cssText = this.getSmallButtonStyle();
    zoomIn.addEventListener('click', () => this.handleZoom('in'));
    wrapper.appendChild(zoomIn);

    return wrapper;
  }

  /**
   * 处理缩放
   */
  private handleZoom(direction: 'in' | 'out'): void {
    const steps = [25, 50, 75, 100, 125, 150, 200, 300, 400];
    const currentIndex = steps.findIndex(s => s >= this.currentZoom);

    let newZoom: number;
    if (direction === 'in') {
      newZoom = steps[Math.min(currentIndex + 1, steps.length - 1)] ?? 400;
    } else {
      newZoom = steps[Math.max(currentIndex - 1, 0)] ?? 25;
    }

    this.setZoom(newZoom);
  }

  /**
   * 显示缩放菜单
   */
  private showZoomMenu(e: MouseEvent, anchor: HTMLElement): void {
    e.stopPropagation();

    const menu = document.createElement('div');
    menu.className = 'zoom-menu';
    menu.style.cssText = `
      position: absolute;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 4px 0;
      z-index: 10000;
      min-width: 80px;
    `;

    const zoomLevels = [25, 50, 75, 100, 125, 150, 200, 300, 400];
    zoomLevels.forEach(level => {
      const item = document.createElement('div');
      item.textContent = `${level}%`;
      item.style.cssText = `
        padding: 6px 16px;
        cursor: pointer;
        font-size: 13px;
        ${level === this.currentZoom ? 'background: #e8f0fe; color: #1a73e8;' : ''}
      `;
      item.addEventListener('mouseenter', () => {
        item.style.background = '#f5f5f5';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = level === this.currentZoom ? '#e8f0fe' : '';
      });
      item.addEventListener('click', () => {
        this.setZoom(level);
        menu.remove();
      });
      menu.appendChild(item);
    });

    // 定位菜单
    const rect = anchor.getBoundingClientRect();
    menu.style.left = `${rect.left}px`;
    menu.style.top = `${rect.bottom + 4}px`;
    document.body.appendChild(menu);

    // 点击外部关闭
    const closeMenu = (ev: MouseEvent) => {
      if (!menu.contains(ev.target as Node)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  }

  /**
   * 设置缩放
   */
  setZoom(zoom: number): void {
    this.currentZoom = zoom;
    const label = this.container.querySelector('.zoom-label');
    if (label) {
      label.textContent = `${zoom}%`;
    }
    this.options.onZoomChange?.(zoom / 100);
  }

  /**
   * 创建格式工具栏
   */
  private createToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'spreadsheet-toolbar';
    toolbar.style.cssText = `
      display: flex;
      align-items: center;
      padding: 4px 8px;
      background: #f8f9fa;
      gap: 2px;
      flex-wrap: nowrap;
      overflow-x: auto;
      min-height: 36px;
    `;

    // 工具栏组
    const groups = this.getToolbarGroups();

    groups.forEach((group, groupIndex) => {
      group.items.forEach(item => {
        const element = this.createToolbarItem(item);
        if (element) {
          toolbar.appendChild(element);
        }
      });

      // 组间分隔符
      if (groupIndex < groups.length - 1) {
        toolbar.appendChild(this.createSeparator());
      }
    });

    return toolbar;
  }

  /**
   * 获取工具栏组配置
   */
  private getToolbarGroups(): ToolbarGroup[] {
    const icon = (name: string) => createIcon(name, 16);

    return [
      // 撤销重做
      {
        id: 'history',
        items: [
          { id: 'undo', type: 'button', icon: icon('undo'), tooltip: '撤销', shortcut: 'Ctrl+Z' },
          { id: 'redo', type: 'button', icon: icon('redo'), tooltip: '重做', shortcut: 'Ctrl+Y' },
        ]
      },
      // 字体
      {
        id: 'font',
        items: [
          { id: 'fontFamily', type: 'font-family', value: '微软雅黑', tooltip: '字体' },
          { id: 'fontSize', type: 'font-size', value: '12', tooltip: '字号' },
        ]
      },
      // 文字格式
      {
        id: 'format',
        items: [
          { id: 'bold', type: 'button', icon: icon('bold'), tooltip: '加粗', shortcut: 'Ctrl+B' },
          { id: 'italic', type: 'button', icon: icon('italic'), tooltip: '斜体', shortcut: 'Ctrl+I' },
          { id: 'underline', type: 'button', icon: icon('underline'), tooltip: '下划线', shortcut: 'Ctrl+U' },
          { id: 'strikethrough', type: 'button', icon: icon('strikethrough'), tooltip: '删除线' },
        ]
      },
      // 颜色
      {
        id: 'color',
        items: [
          { id: 'textColor', type: 'color-picker', icon: icon('type'), tooltip: '文字颜色', value: '#000000' },
          { id: 'fillColor', type: 'color-picker', icon: icon('paint-bucket'), tooltip: '填充颜色', value: '#ffffff' },
        ]
      },
      // 对齐
      {
        id: 'align',
        items: [
          { id: 'alignLeft', type: 'button', icon: icon('align-left'), tooltip: '左对齐' },
          { id: 'alignCenter', type: 'button', icon: icon('align-center'), tooltip: '居中对齐' },
          { id: 'alignRight', type: 'button', icon: icon('align-right'), tooltip: '右对齐' },
          { id: 'alignTop', type: 'button', icon: icon('align-start-vertical'), tooltip: '顶端对齐' },
          { id: 'alignMiddle', type: 'button', icon: icon('align-center-vertical'), tooltip: '垂直居中' },
          { id: 'alignBottom', type: 'button', icon: icon('align-end-vertical'), tooltip: '底端对齐' },
        ]
      },
      // 边框和合并
      {
        id: 'cell',
        items: [
          { id: 'border', type: 'button', icon: icon('grid'), tooltip: '边框' },
          { id: 'merge', type: 'button', icon: icon('merge'), tooltip: '合并单元格' },
          { id: 'wrapText', type: 'button', icon: icon('wrap-text'), tooltip: '自动换行' },
        ]
      },
      // 数字格式
      {
        id: 'number',
        items: [
          { id: 'formatNumber', type: 'button', icon: icon('hash'), tooltip: '数字格式' },
          { id: 'formatPercent', type: 'button', icon: icon('percent'), tooltip: '百分比' },
          { id: 'formatCurrency', type: 'button', icon: icon('dollar-sign'), tooltip: '货币格式' },
          { id: 'formatDate', type: 'button', icon: icon('calendar'), tooltip: '日期格式' },
          { id: 'increaseDecimal', type: 'button', icon: icon('plus-square'), tooltip: '增加小数位' },
          { id: 'decreaseDecimal', type: 'button', icon: icon('minus-square'), tooltip: '减少小数位' },
        ]
      },
      // 插入
      {
        id: 'insert',
        items: [
          { id: 'insertLink', type: 'button', icon: icon('link'), tooltip: '插入链接', shortcut: 'Ctrl+K' },
          { id: 'insertImage', type: 'button', icon: icon('image'), tooltip: '插入图片' },
          { id: 'insertChart', type: 'button', icon: icon('bar-chart'), tooltip: '插入图表' },
          { id: 'insertComment', type: 'button', icon: icon('message-square'), tooltip: '插入批注' },
        ]
      },
      // 数据
      {
        id: 'data',
        items: [
          { id: 'filter', type: 'button', icon: icon('filter'), tooltip: '筛选' },
          { id: 'sort', type: 'button', icon: icon('sort-asc'), tooltip: '排序' },
          { id: 'conditionalFormat', type: 'button', icon: icon('palette'), tooltip: '条件格式' },
          { id: 'dataValidation', type: 'button', icon: icon('check-square'), tooltip: '数据验证' },
        ]
      },
    ];
  }

  /**
   * 创建工具栏项
   */
  private createToolbarItem(item: ToolbarItemConfig): HTMLElement | null {
    switch (item.type) {
      case 'button':
        return this.createButton(item);
      case 'color-picker':
        return this.createColorPicker(item);
      case 'font-size':
        return this.createFontSizeSelector(item);
      case 'font-family':
        return this.createFontFamilySelector(item);
      case 'separator':
        return this.createSeparator();
      default:
        return null;
    }
  }

  /**
   * 创建按钮
   */
  private createButton(item: ToolbarItemConfig): HTMLElement {
    const button = document.createElement('button');
    button.className = 'toolbar-button';
    button.dataset.id = item.id;
    button.title = item.tooltip ? `${item.tooltip}${item.shortcut ? ` (${item.shortcut})` : ''}` : '';
    button.style.cssText = this.getButtonStyle(item.active);

    const iconWrapper = document.createElement('span');
    iconWrapper.style.cssText = 'display: flex; align-items: center; justify-content: center;';
    iconWrapper.innerHTML = item.icon || '';
    button.appendChild(iconWrapper);

    // 初始化状态
    this.itemStates.set(item.id, { active: item.active || false });

    button.addEventListener('mouseenter', () => {
      if (!item.disabled) {
        button.style.background = '#e8e8e8';
      }
    });
    button.addEventListener('mouseleave', () => {
      const state = this.itemStates.get(item.id);
      button.style.background = state?.active ? '#e8f0fe' : 'transparent';
    });
    button.addEventListener('click', () => {
      if (item.disabled) return;

      // 切换状态
      const state = this.itemStates.get(item.id);
      if (state) {
        state.active = !state.active;
        button.style.background = state.active ? '#e8f0fe' : 'transparent';
      }

      this.emitAction(item.id);
    });

    return button;
  }

  /**
   * 创建颜色选择器
   */
  private createColorPicker(item: ToolbarItemConfig): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'toolbar-color-picker';
    wrapper.style.cssText = 'position: relative; display: inline-flex;';

    const button = document.createElement('button');
    button.className = 'toolbar-color-button';
    button.title = item.tooltip || '';
    button.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 28px;
      border: none;
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      padding: 2px;
    `;

    const icon = document.createElement('span');
    icon.innerHTML = item.icon || 'A';
    icon.style.cssText = 'display: flex; align-items: center; justify-content: center;';
    button.appendChild(icon);

    const colorBar = document.createElement('div');
    colorBar.className = 'color-bar';
    colorBar.style.cssText = `
      width: 16px;
      height: 3px;
      background: ${item.value || '#000'};
      margin-top: 1px;
    `;
    button.appendChild(colorBar);

    // 创建颜色面板
    const palette = this.createColorPalette(item.id, colorBar);

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = palette.style.display === 'grid';
      this.closeAllDropdowns();
      if (!isVisible) {
        palette.style.display = 'grid';
      }
    });

    wrapper.appendChild(button);
    wrapper.appendChild(palette);

    return wrapper;
  }

  /**
   * 创建颜色面板
   */
  private createColorPalette(itemId: string, colorBar: HTMLElement): HTMLElement {
    const palette = document.createElement('div');
    palette.className = 'color-palette';
    palette.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      display: none;
      grid-template-columns: repeat(10, 1fr);
      gap: 2px;
      padding: 8px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
    `;

    const colors = [
      '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
      '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
      '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
      '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
      '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
      '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
    ];

    colors.forEach(color => {
      const swatch = document.createElement('div');
      swatch.style.cssText = `
        width: 18px;
        height: 18px;
        background: ${color};
        border: 1px solid #e0e0e0;
        border-radius: 2px;
        cursor: pointer;
      `;
      swatch.addEventListener('click', (e) => {
        e.stopPropagation();
        colorBar.style.background = color;
        palette.style.display = 'none';
        this.emitAction(itemId, color);
      });
      swatch.addEventListener('mouseenter', () => {
        swatch.style.transform = 'scale(1.1)';
        swatch.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      });
      swatch.addEventListener('mouseleave', () => {
        swatch.style.transform = '';
        swatch.style.boxShadow = '';
      });
      palette.appendChild(swatch);
    });

    // 无填充/自定义颜色选项
    const noFill = document.createElement('div');
    noFill.style.cssText = `
      grid-column: span 5;
      padding: 6px;
      text-align: center;
      cursor: pointer;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e0e0e0;
      margin-top: 4px;
    `;
    noFill.textContent = '无填充';
    noFill.addEventListener('click', (e) => {
      e.stopPropagation();
      colorBar.style.background = 'transparent';
      palette.style.display = 'none';
      this.emitAction(itemId, 'transparent');
    });
    palette.appendChild(noFill);

    const customColor = document.createElement('div');
    customColor.style.cssText = `
      grid-column: span 5;
      padding: 6px;
      text-align: center;
      cursor: pointer;
      font-size: 12px;
      color: #1a73e8;
      border-top: 1px solid #e0e0e0;
      margin-top: 4px;
    `;
    customColor.textContent = '更多颜色...';
    customColor.addEventListener('click', (e) => {
      e.stopPropagation();
      const input = document.createElement('input');
      input.type = 'color';
      input.value = colorBar.style.background || '#000000';
      input.onchange = () => {
        colorBar.style.background = input.value;
        palette.style.display = 'none';
        this.emitAction(itemId, input.value);
      };
      input.click();
    });
    palette.appendChild(customColor);

    return palette;
  }

  /**
   * 创建字号选择器
   */
  private createFontSizeSelector(item: ToolbarItemConfig): HTMLElement {
    const sizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'];
    return this.createDropdown(item, sizes.map(s => ({ value: s, label: s })));
  }

  /**
   * 创建字体选择器
   */
  private createFontFamilySelector(item: ToolbarItemConfig): HTMLElement {
    const fonts = [
      { value: '微软雅黑', label: '微软雅黑' },
      { value: '宋体', label: '宋体' },
      { value: '黑体', label: '黑体' },
      { value: '楷体', label: '楷体' },
      { value: '仿宋', label: '仿宋' },
      { value: 'Arial', label: 'Arial' },
      { value: 'Times New Roman', label: 'Times New Roman' },
      { value: 'Calibri', label: 'Calibri' },
      { value: 'Verdana', label: 'Verdana' },
    ];
    return this.createDropdown(item, fonts, 120);
  }

  /**
   * 创建下拉选择器
   */
  private createDropdown(item: ToolbarItemConfig, options: Array<{ value: string; label: string }>, minWidth = 50): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'toolbar-dropdown';
    wrapper.style.cssText = 'position: relative; display: inline-flex;';

    const button = document.createElement('button');
    button.className = 'toolbar-dropdown-button';
    button.title = item.tooltip || '';
    button.style.cssText = `
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 4px 6px;
      min-width: ${minWidth}px;
      border: 1px solid transparent;
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 12px;
      color: #333;
    `;

    const label = document.createElement('span');
    label.textContent = item.value || options[0]?.label || '';
    label.style.flex = '1';
    label.style.textAlign = 'left';
    button.appendChild(label);

    const arrow = document.createElement('span');
    arrow.innerHTML = '▾';
    arrow.style.fontSize = '10px';
    arrow.style.color = '#666';
    button.appendChild(arrow);

    // 创建下拉菜单
    const dropdown = document.createElement('div');
    dropdown.className = 'toolbar-dropdown-menu';
    dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      min-width: ${minWidth + 20}px;
      max-height: 300px;
      overflow-y: auto;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 4px 0;
      z-index: 10000;
      display: none;
    `;

    options.forEach(option => {
      const optionEl = document.createElement('div');
      optionEl.className = 'dropdown-option';
      optionEl.textContent = option.label;
      optionEl.dataset.value = option.value;
      optionEl.style.cssText = `
        padding: 6px 12px;
        cursor: pointer;
        font-size: 13px;
        ${item.id === 'fontFamily' ? `font-family: "${option.value}";` : ''}
      `;

      optionEl.addEventListener('mouseenter', () => {
        optionEl.style.background = '#f5f5f5';
      });
      optionEl.addEventListener('mouseleave', () => {
        optionEl.style.background = '';
      });
      optionEl.addEventListener('click', (e) => {
        e.stopPropagation();
        label.textContent = option.label;
        dropdown.style.display = 'none';
        this.emitAction(item.id, option.value);
      });

      dropdown.appendChild(optionEl);
    });

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = dropdown.style.display === 'block';
      this.closeAllDropdowns();
      if (!isVisible) {
        dropdown.style.display = 'block';
      }
    });

    button.addEventListener('mouseenter', () => {
      button.style.borderColor = '#d0d0d0';
      button.style.background = '#f5f5f5';
    });
    button.addEventListener('mouseleave', () => {
      button.style.borderColor = 'transparent';
      button.style.background = 'transparent';
    });

    wrapper.appendChild(button);
    wrapper.appendChild(dropdown);

    return wrapper;
  }

  /**
   * 创建分隔符
   */
  private createSeparator(): HTMLElement {
    const separator = document.createElement('div');
    separator.className = 'toolbar-separator';
    separator.style.cssText = `
      width: 1px;
      height: 20px;
      background: #e0e0e0;
      margin: 0 4px;
    `;
    return separator;
  }

  /**
   * 关闭所有下拉菜单
   */
  private closeAllDropdowns(): void {
    this.container.querySelectorAll('.toolbar-dropdown-menu, .color-palette').forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
  }

  /**
   * 发送操作事件
   */
  private emitAction(id: string, value?: string): void {
    this.options.onAction?.({ id, value });
  }

  /**
   * 获取按钮样式
   */
  private getButtonStyle(active?: boolean): string {
    return `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 4px;
      background: ${active ? '#e8f0fe' : 'transparent'};
      cursor: pointer;
      color: #333;
      transition: background 0.15s;
      padding: 0;
    `;
  }

  /**
   * 获取小按钮样式
   */
  private getSmallButtonStyle(): string {
    return `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      color: #666;
    `;
  }

  /**
   * 更新文件名
   */
  setFileName(name: string): void {
    this.options.fileName = name;
    const fileNameEl = this.container.querySelector('.header-file-name');
    if (fileNameEl) {
      fileNameEl.textContent = name;
    }
  }

  /**
   * 更新工作表数量
   */
  setSheetCount(count: number): void {
    this.options.sheetCount = count;
    const sheetInfoEl = this.container.querySelector('.header-sheet-info');
    if (sheetInfoEl) {
      sheetInfoEl.textContent = `${count} 个工作表`;
    }
  }

  /**
   * 更新工具栏项状态
   */
  setItemState(id: string, active: boolean, value?: string): void {
    const state = this.itemStates.get(id);
    if (state) {
      state.active = active;
      if (value !== undefined) {
        state.value = value;
      }
    }

    const button = this.container.querySelector(`[data-id="${id}"]`) as HTMLElement;
    if (button) {
      button.style.background = active ? '#e8f0fe' : 'transparent';
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.container.innerHTML = '';
    this.itemStates.clear();
  }
}

// 全局点击关闭下拉菜单
document.addEventListener('click', () => {
  document.querySelectorAll('.toolbar-dropdown-menu, .color-palette, .zoom-menu').forEach(el => {
    (el as HTMLElement).style.display = 'none';
  });
});
