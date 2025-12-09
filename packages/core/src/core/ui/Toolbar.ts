/**
 * 工具栏组件
 * 提供类似腾讯文档的工具栏功能
 */

import { createIcon } from './Icons';

export interface ToolbarItem {
  /** 唯一标识 */
  id: string;
  /** 类型 */
  type: 'button' | 'dropdown' | 'separator' | 'color-picker' | 'font-size' | 'font-family';
  /** 图标 */
  icon?: string;
  /** 提示文字 */
  tooltip?: string;
  /** 快捷键提示 */
  shortcut?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否激活 */
  active?: boolean;
  /** 下拉选项 */
  options?: Array<{ value: string; label: string; icon?: string }>;
  /** 当前值 */
  value?: string;
}

export interface ToolbarOptions {
  /** 工具栏项 */
  items: ToolbarItem[];
  /** 点击回调 */
  onAction?: (id: string, value?: string) => void;
}

export class Toolbar {
  private container: HTMLElement;
  private toolbarElement: HTMLElement | null = null;
  private options: ToolbarOptions;
  private itemElements: Map<string, HTMLElement> = new Map();

  constructor(container: HTMLElement, options: ToolbarOptions) {
    this.container = container;
    this.options = options;
    this.init();
  }

  private init(): void {
    this.toolbarElement = document.createElement('div');
    this.toolbarElement.className = 'spreadsheet-toolbar';
    this.toolbarElement.style.cssText = `
      display: flex;
      align-items: center;
      padding: 4px 8px;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      gap: 4px;
      flex-wrap: nowrap;
      overflow-x: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      user-select: none;
    `;

    this.renderItems();
    this.container.appendChild(this.toolbarElement);
  }

  private renderItems(): void {
    if (!this.toolbarElement) return;

    this.toolbarElement.innerHTML = '';
    this.itemElements.clear();

    for (const item of this.options.items) {
      const element = this.createItem(item);
      if (element) {
        this.toolbarElement.appendChild(element);
        this.itemElements.set(item.id, element);
      }
    }
  }

  private createItem(item: ToolbarItem): HTMLElement | null {
    switch (item.type) {
      case 'button':
        return this.createButton(item);
      case 'dropdown':
        return this.createDropdown(item);
      case 'separator':
        return this.createSeparator();
      case 'color-picker':
        return this.createColorPicker(item);
      case 'font-size':
        return this.createFontSizeSelector(item);
      case 'font-family':
        return this.createFontFamilySelector(item);
      default:
        return null;
    }
  }

  private createButton(item: ToolbarItem): HTMLElement {
    const button = document.createElement('button');
    button.className = 'toolbar-button';
    button.title = item.tooltip ? `${item.tooltip}${item.shortcut ? ` (${item.shortcut})` : ''}` : '';
    button.disabled = item.disabled || false;
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 4px;
      background: ${item.active ? '#e8f0fe' : 'transparent'};
      cursor: ${item.disabled ? 'not-allowed' : 'pointer'};
      color: ${item.disabled ? '#999' : '#333'};
      transition: background 0.15s;
      padding: 4px;
    `;

    // 使用 span 包裹图标确保正确渲染
    const iconWrapper = document.createElement('span');
    iconWrapper.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 18px; height: 18px;';
    iconWrapper.innerHTML = item.icon || '';
    button.appendChild(iconWrapper);

    if (!item.disabled) {
      button.addEventListener('mouseenter', () => {
        button.style.background = '#e8e8e8';
      });
      button.addEventListener('mouseleave', () => {
        button.style.background = item.active ? '#e8f0fe' : 'transparent';
      });
      button.addEventListener('click', () => {
        this.options.onAction?.(item.id);
      });
    }

    return button;
  }

  private createDropdown(item: ToolbarItem): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'toolbar-dropdown';
    wrapper.style.cssText = `
      position: relative;
      display: inline-flex;
    `;

    const button = document.createElement('button');
    button.className = 'toolbar-dropdown-button';
    button.title = item.tooltip || '';
    button.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
    `;

    const label = document.createElement('span');
    label.textContent = item.value || item.options?.[0]?.label || '';
    button.appendChild(label);

    const arrow = document.createElement('span');
    arrow.textContent = '▾';
    arrow.style.fontSize = '10px';
    button.appendChild(arrow);

    const dropdown = document.createElement('div');
    dropdown.className = 'toolbar-dropdown-menu';
    dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      min-width: 120px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 4px 0;
      z-index: 1000;
      display: none;
    `;

    if (item.options) {
      for (const option of item.options) {
        const optionEl = document.createElement('div');
        optionEl.className = 'toolbar-dropdown-option';
        optionEl.style.cssText = `
          padding: 8px 12px;
          cursor: pointer;
          transition: background 0.15s;
        `;
        optionEl.textContent = option.label;

        optionEl.addEventListener('mouseenter', () => {
          optionEl.style.background = '#f5f5f5';
        });
        optionEl.addEventListener('mouseleave', () => {
          optionEl.style.background = '';
        });
        optionEl.addEventListener('click', () => {
          label.textContent = option.label;
          dropdown.style.display = 'none';
          this.options.onAction?.(item.id, option.value);
        });

        dropdown.appendChild(optionEl);
      }
    }

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });

    wrapper.appendChild(button);
    wrapper.appendChild(dropdown);

    return wrapper;
  }

  private createSeparator(): HTMLElement {
    const separator = document.createElement('div');
    separator.className = 'toolbar-separator';
    separator.style.cssText = `
      width: 1px;
      height: 24px;
      background: #e0e0e0;
      margin: 0 4px;
    `;
    return separator;
  }

  private createColorPicker(item: ToolbarItem): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'toolbar-color-picker';
    wrapper.style.cssText = `
      position: relative;
      display: inline-flex;
    `;

    const button = document.createElement('button');
    button.className = 'toolbar-color-button';
    button.title = item.tooltip || '';
    button.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
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
    colorBar.style.cssText = `
      width: 16px;
      height: 3px;
      background: ${item.value || '#000'};
      margin-top: 2px;
    `;
    button.appendChild(colorBar);

    const colorPalette = this.createColorPalette(item.id, colorBar);

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = colorPalette.style.display === 'grid';
      colorPalette.style.display = isVisible ? 'none' : 'grid';
    });

    document.addEventListener('click', () => {
      colorPalette.style.display = 'none';
    });

    wrapper.appendChild(button);
    wrapper.appendChild(colorPalette);

    return wrapper;
  }

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
      z-index: 1000;
    `;

    const colors = [
      '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
      '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
      '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
      '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
      '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
      '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
    ];

    for (const color of colors) {
      const swatch = document.createElement('div');
      swatch.style.cssText = `
        width: 18px;
        height: 18px;
        background: ${color};
        border: 1px solid #e0e0e0;
        border-radius: 2px;
        cursor: pointer;
      `;

      swatch.addEventListener('click', () => {
        colorBar.style.background = color;
        palette.style.display = 'none';
        this.options.onAction?.(itemId, color);
      });

      palette.appendChild(swatch);
    }

    return palette;
  }

  private createFontSizeSelector(item: ToolbarItem): HTMLElement {
    const sizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'];
    return this.createDropdown({
      ...item,
      type: 'dropdown',
      options: sizes.map(s => ({ value: s, label: s }))
    });
  }

  private createFontFamilySelector(item: ToolbarItem): HTMLElement {
    const fonts = [
      { value: '微软雅黑', label: '微软雅黑' },
      { value: '宋体', label: '宋体' },
      { value: '黑体', label: '黑体' },
      { value: '楷体', label: '楷体' },
      { value: 'Arial', label: 'Arial' },
      { value: 'Times New Roman', label: 'Times New Roman' },
      { value: 'Calibri', label: 'Calibri' },
    ];
    return this.createDropdown({
      ...item,
      type: 'dropdown',
      options: fonts
    });
  }

  /**
   * 更新工具栏项状态
   */
  updateItem(id: string, updates: Partial<ToolbarItem>): void {
    const item = this.options.items.find(i => i.id === id);
    if (item) {
      Object.assign(item, updates);
      this.renderItems();
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.toolbarElement) {
      this.toolbarElement.remove();
      this.toolbarElement = null;
    }
    this.itemElements.clear();
  }
}

/**
 * 创建默认工具栏项
 */
export function createDefaultToolbarItems(): ToolbarItem[] {
  const icon = (name: string) => createIcon(name, 18);

  return [
    // 撤销/重做
    { id: 'undo', type: 'button', icon: icon('undo'), tooltip: '撤销', shortcut: 'Ctrl+Z' },
    { id: 'redo', type: 'button', icon: icon('redo'), tooltip: '重做', shortcut: 'Ctrl+Y' },
    { id: 'sep1', type: 'separator' },

    // 字体
    { id: 'fontFamily', type: 'font-family', value: '微软雅黑', tooltip: '字体' },
    { id: 'fontSize', type: 'font-size', value: '12', tooltip: '字号' },
    { id: 'sep2', type: 'separator' },

    // 格式
    { id: 'bold', type: 'button', icon: icon('bold'), tooltip: '加粗', shortcut: 'Ctrl+B' },
    { id: 'italic', type: 'button', icon: icon('italic'), tooltip: '斜体', shortcut: 'Ctrl+I' },
    { id: 'underline', type: 'button', icon: icon('underline'), tooltip: '下划线', shortcut: 'Ctrl+U' },
    { id: 'strikethrough', type: 'button', icon: icon('strikethrough'), tooltip: '删除线' },
    { id: 'sep3', type: 'separator' },

    // 颜色
    { id: 'textColor', type: 'color-picker', icon: icon('type'), tooltip: '文字颜色', value: '#000000' },
    { id: 'fillColor', type: 'color-picker', icon: icon('paint-bucket'), tooltip: '填充颜色', value: '#ffffff' },
    { id: 'sep4', type: 'separator' },

    // 对齐
    { id: 'alignLeft', type: 'button', icon: icon('align-left'), tooltip: '左对齐' },
    { id: 'alignCenter', type: 'button', icon: icon('align-center'), tooltip: '居中' },
    { id: 'alignRight', type: 'button', icon: icon('align-right'), tooltip: '右对齐' },
    { id: 'sep5', type: 'separator' },

    // 边框
    { id: 'border', type: 'button', icon: icon('grid'), tooltip: '边框' },
    { id: 'merge', type: 'button', icon: icon('merge'), tooltip: '合并单元格' },
    { id: 'sep6', type: 'separator' },

    // 数字格式
    { id: 'formatNumber', type: 'button', icon: icon('percent'), tooltip: '百分比格式' },
    { id: 'formatCurrency', type: 'button', icon: icon('dollar-sign'), tooltip: '货币格式' },
    { id: 'formatDate', type: 'button', icon: icon('calendar'), tooltip: '日期格式' },
    { id: 'sep7', type: 'separator' },

    // 插入
    { id: 'insertLink', type: 'button', icon: icon('link'), tooltip: '插入链接', shortcut: 'Ctrl+K' },
    { id: 'insertImage', type: 'button', icon: icon('image'), tooltip: '插入图片' },
    { id: 'insertChart', type: 'button', icon: icon('bar-chart'), tooltip: '插入图表' },
    { id: 'insertComment', type: 'button', icon: icon('message-square'), tooltip: '插入批注' },
    { id: 'sep8', type: 'separator' },

    // 筛选排序
    { id: 'filter', type: 'button', icon: icon('filter'), tooltip: '筛选' },
    { id: 'sort', type: 'button', icon: icon('sort-asc'), tooltip: '排序' },
  ];
}
