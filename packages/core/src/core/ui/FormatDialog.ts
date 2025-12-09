/**
 * 单元格格式设置对话框
 * 类似 Excel 的格式设置对话框
 */

export interface FormatDialogOptions {
  /** 确认回调 */
  onConfirm?: (format: CellFormat) => void;
  /** 取消回调 */
  onCancel?: () => void;
}

export interface CellFormat {
  /** 数字格式 */
  numberFormat?: string;
  /** 字体 */
  font?: {
    name?: string;
    size?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    color?: string;
  };
  /** 填充 */
  fill?: {
    color?: string;
    pattern?: string;
  };
  /** 边框 */
  border?: {
    top?: { style?: string; color?: string };
    right?: { style?: string; color?: string };
    bottom?: { style?: string; color?: string };
    left?: { style?: string; color?: string };
  };
  /** 对齐 */
  alignment?: {
    horizontal?: 'left' | 'center' | 'right' | 'justify';
    vertical?: 'top' | 'center' | 'bottom';
    wrapText?: boolean;
    textRotation?: number;
    indent?: number;
  };
}

export class FormatDialog {
  private overlay: HTMLElement | null = null;
  private dialog: HTMLElement | null = null;
  private options: FormatDialogOptions;
  private currentFormat: CellFormat = {};
  private activeTab = 'number';

  constructor(options: FormatDialogOptions = {}) {
    this.options = options;
  }

  /**
   * 显示对话框
   */
  show(initialFormat?: CellFormat): void {
    this.currentFormat = { ...initialFormat };
    this.createDialog();
  }

  /**
   * 隐藏对话框
   */
  hide(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    if (this.dialog) {
      this.dialog.remove();
      this.dialog = null;
    }
  }

  private createDialog(): void {
    // 遮罩层
    this.overlay = document.createElement('div');
    this.overlay.className = 'format-dialog-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 2000;
    `;
    this.overlay.addEventListener('click', () => {
      this.options.onCancel?.();
      this.hide();
    });

    // 对话框
    this.dialog = document.createElement('div');
    this.dialog.className = 'format-dialog';
    this.dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 500px;
      max-height: 80vh;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      z-index: 2001;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
    `;
    this.dialog.addEventListener('click', (e) => e.stopPropagation());

    // 标题栏
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px 20px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 16px;
      font-weight: 500;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <span>设置单元格格式</span>
      <button class="close-btn" style="border: none; background: none; cursor: pointer; font-size: 20px; color: #666;">×</button>
    `;
    header.querySelector('.close-btn')?.addEventListener('click', () => {
      this.options.onCancel?.();
      this.hide();
    });

    // 标签页
    const tabs = document.createElement('div');
    tabs.style.cssText = `
      display: flex;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    `;

    const tabItems = [
      { id: 'number', label: '数字' },
      { id: 'alignment', label: '对齐' },
      { id: 'font', label: '字体' },
      { id: 'border', label: '边框' },
      { id: 'fill', label: '填充' },
    ];

    for (const tab of tabItems) {
      const tabEl = document.createElement('button');
      tabEl.className = 'format-tab';
      tabEl.dataset.tab = tab.id;
      tabEl.textContent = tab.label;
      tabEl.style.cssText = `
        padding: 12px 20px;
        border: none;
        background: ${this.activeTab === tab.id ? '#fff' : 'transparent'};
        cursor: pointer;
        font-size: 13px;
        border-bottom: ${this.activeTab === tab.id ? '2px solid #1a73e8' : '2px solid transparent'};
        color: ${this.activeTab === tab.id ? '#1a73e8' : '#333'};
        transition: all 0.15s;
      `;

      tabEl.addEventListener('click', () => {
        this.activeTab = tab.id;
        this.updateTabContent();
        // 更新标签样式
        tabs.querySelectorAll('.format-tab').forEach((t: any) => {
          t.style.background = t.dataset.tab === tab.id ? '#fff' : 'transparent';
          t.style.borderBottom = t.dataset.tab === tab.id ? '2px solid #1a73e8' : '2px solid transparent';
          t.style.color = t.dataset.tab === tab.id ? '#1a73e8' : '#333';
        });
      });

      tabs.appendChild(tabEl);
    }

    // 内容区
    const content = document.createElement('div');
    content.className = 'format-content';
    content.style.cssText = `
      padding: 20px;
      min-height: 300px;
      max-height: 400px;
      overflow-y: auto;
    `;

    // 按钮区
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 16px 20px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    `;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.style.cssText = `
      padding: 8px 20px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      font-size: 13px;
    `;
    cancelBtn.addEventListener('click', () => {
      this.options.onCancel?.();
      this.hide();
    });

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '确定';
    confirmBtn.style.cssText = `
      padding: 8px 20px;
      border: none;
      border-radius: 4px;
      background: #1a73e8;
      color: #fff;
      cursor: pointer;
      font-size: 13px;
    `;
    confirmBtn.addEventListener('click', () => {
      this.options.onConfirm?.(this.currentFormat);
      this.hide();
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    this.dialog.appendChild(header);
    this.dialog.appendChild(tabs);
    this.dialog.appendChild(content);
    this.dialog.appendChild(footer);

    document.body.appendChild(this.overlay);
    document.body.appendChild(this.dialog);

    this.updateTabContent();
  }

  private updateTabContent(): void {
    const content = this.dialog?.querySelector('.format-content');
    if (!content) return;

    content.innerHTML = '';

    switch (this.activeTab) {
      case 'number':
        this.renderNumberTab(content as HTMLElement);
        break;
      case 'alignment':
        this.renderAlignmentTab(content as HTMLElement);
        break;
      case 'font':
        this.renderFontTab(content as HTMLElement);
        break;
      case 'border':
        this.renderBorderTab(content as HTMLElement);
        break;
      case 'fill':
        this.renderFillTab(content as HTMLElement);
        break;
    }
  }

  private renderNumberTab(container: HTMLElement): void {
    const formats = [
      { id: 'general', label: '常规', format: '' },
      { id: 'number', label: '数值', format: '#,##0.00' },
      { id: 'currency', label: '货币', format: '¥#,##0.00' },
      { id: 'accounting', label: '会计专用', format: '¥#,##0.00_);(¥#,##0.00)' },
      { id: 'date', label: '日期', format: 'yyyy/m/d' },
      { id: 'time', label: '时间', format: 'h:mm:ss' },
      { id: 'percentage', label: '百分比', format: '0.00%' },
      { id: 'fraction', label: '分数', format: '# ?/?' },
      { id: 'scientific', label: '科学记数', format: '0.00E+00' },
      { id: 'text', label: '文本', format: '@' },
    ];

    const list = document.createElement('div');
    list.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;

    for (const fmt of formats) {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 10px 12px;
        border-radius: 4px;
        cursor: pointer;
        background: ${this.currentFormat.numberFormat === fmt.format ? '#e8f0fe' : ''};
        transition: background 0.15s;
      `;
      item.textContent = fmt.label;

      item.addEventListener('mouseenter', () => {
        if (this.currentFormat.numberFormat !== fmt.format) {
          item.style.background = '#f5f5f5';
        }
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = this.currentFormat.numberFormat === fmt.format ? '#e8f0fe' : '';
      });
      item.addEventListener('click', () => {
        this.currentFormat.numberFormat = fmt.format;
        this.updateTabContent();
      });

      list.appendChild(item);
    }

    container.appendChild(list);
  }

  private renderAlignmentTab(container: HTMLElement): void {
    // 水平对齐
    const hGroup = this.createFormGroup('水平对齐');
    const hOptions = [
      { value: 'left', label: '左对齐' },
      { value: 'center', label: '居中' },
      { value: 'right', label: '右对齐' },
      { value: 'justify', label: '两端对齐' },
    ];
    const hSelect = this.createSelect(hOptions, this.currentFormat.alignment?.horizontal || 'left');
    hSelect.addEventListener('change', (e) => {
      if (!this.currentFormat.alignment) this.currentFormat.alignment = {};
      this.currentFormat.alignment.horizontal = (e.target as HTMLSelectElement).value as any;
    });
    hGroup.appendChild(hSelect);
    container.appendChild(hGroup);

    // 垂直对齐
    const vGroup = this.createFormGroup('垂直对齐');
    const vOptions = [
      { value: 'top', label: '顶端对齐' },
      { value: 'center', label: '居中' },
      { value: 'bottom', label: '底端对齐' },
    ];
    const vSelect = this.createSelect(vOptions, this.currentFormat.alignment?.vertical || 'center');
    vSelect.addEventListener('change', (e) => {
      if (!this.currentFormat.alignment) this.currentFormat.alignment = {};
      this.currentFormat.alignment.vertical = (e.target as HTMLSelectElement).value as any;
    });
    vGroup.appendChild(vSelect);
    container.appendChild(vGroup);

    // 自动换行
    const wrapGroup = this.createFormGroup('');
    const wrapCheckbox = this.createCheckbox('自动换行', this.currentFormat.alignment?.wrapText || false);
    wrapCheckbox.addEventListener('change', (e) => {
      if (!this.currentFormat.alignment) this.currentFormat.alignment = {};
      this.currentFormat.alignment.wrapText = (e.target as HTMLInputElement).checked;
    });
    wrapGroup.appendChild(wrapCheckbox);
    container.appendChild(wrapGroup);
  }

  private renderFontTab(container: HTMLElement): void {
    // 字体
    const fontGroup = this.createFormGroup('字体');
    const fonts = ['微软雅黑', '宋体', '黑体', '楷体', 'Arial', 'Times New Roman', 'Calibri'];
    const fontSelect = this.createSelect(
      fonts.map(f => ({ value: f, label: f })),
      this.currentFormat.font?.name || '微软雅黑'
    );
    fontSelect.addEventListener('change', (e) => {
      if (!this.currentFormat.font) this.currentFormat.font = {};
      this.currentFormat.font.name = (e.target as HTMLSelectElement).value;
    });
    fontGroup.appendChild(fontSelect);
    container.appendChild(fontGroup);

    // 字号
    const sizeGroup = this.createFormGroup('字号');
    const sizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'];
    const sizeSelect = this.createSelect(
      sizes.map(s => ({ value: s, label: s })),
      String(this.currentFormat.font?.size || '12')
    );
    sizeSelect.addEventListener('change', (e) => {
      if (!this.currentFormat.font) this.currentFormat.font = {};
      this.currentFormat.font.size = parseInt((e.target as HTMLSelectElement).value);
    });
    sizeGroup.appendChild(sizeSelect);
    container.appendChild(sizeGroup);

    // 样式
    const styleGroup = this.createFormGroup('样式');
    const styleContainer = document.createElement('div');
    styleContainer.style.cssText = 'display: flex; gap: 16px;';

    const boldCb = this.createCheckbox('加粗', this.currentFormat.font?.bold || false);
    boldCb.addEventListener('change', (e) => {
      if (!this.currentFormat.font) this.currentFormat.font = {};
      this.currentFormat.font.bold = (e.target as HTMLInputElement).checked;
    });

    const italicCb = this.createCheckbox('斜体', this.currentFormat.font?.italic || false);
    italicCb.addEventListener('change', (e) => {
      if (!this.currentFormat.font) this.currentFormat.font = {};
      this.currentFormat.font.italic = (e.target as HTMLInputElement).checked;
    });

    const underlineCb = this.createCheckbox('下划线', this.currentFormat.font?.underline || false);
    underlineCb.addEventListener('change', (e) => {
      if (!this.currentFormat.font) this.currentFormat.font = {};
      this.currentFormat.font.underline = (e.target as HTMLInputElement).checked;
    });

    styleContainer.appendChild(boldCb);
    styleContainer.appendChild(italicCb);
    styleContainer.appendChild(underlineCb);
    styleGroup.appendChild(styleContainer);
    container.appendChild(styleGroup);

    // 颜色
    const colorGroup = this.createFormGroup('颜色');
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = this.currentFormat.font?.color || '#000000';
    colorInput.style.cssText = 'width: 60px; height: 32px; border: 1px solid #e0e0e0; border-radius: 4px; cursor: pointer;';
    colorInput.addEventListener('change', (e) => {
      if (!this.currentFormat.font) this.currentFormat.font = {};
      this.currentFormat.font.color = (e.target as HTMLInputElement).value;
    });
    colorGroup.appendChild(colorInput);
    container.appendChild(colorGroup);
  }

  private renderBorderTab(container: HTMLElement): void {
    const info = document.createElement('div');
    info.style.cssText = 'color: #666; margin-bottom: 16px;';
    info.textContent = '选择边框样式和颜色';
    container.appendChild(info);

    const borderStyles = ['none', 'thin', 'medium', 'thick', 'dashed', 'dotted'];
    const sides = ['top', 'right', 'bottom', 'left'];

    for (const side of sides) {
      const group = this.createFormGroup(side === 'top' ? '上边框' : side === 'right' ? '右边框' : side === 'bottom' ? '下边框' : '左边框');

      const row = document.createElement('div');
      row.style.cssText = 'display: flex; gap: 12px; align-items: center;';

      const styleSelect = this.createSelect(
        borderStyles.map(s => ({ value: s, label: s === 'none' ? '无' : s })),
        (this.currentFormat.border as any)?.[side]?.style || 'none'
      );
      styleSelect.style.width = '100px';
      styleSelect.addEventListener('change', (e) => {
        if (!this.currentFormat.border) this.currentFormat.border = {};
        (this.currentFormat.border as any)[side] = {
          ...(this.currentFormat.border as any)[side],
          style: (e.target as HTMLSelectElement).value
        };
      });

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = (this.currentFormat.border as any)?.[side]?.color || '#000000';
      colorInput.style.cssText = 'width: 40px; height: 28px; border: 1px solid #e0e0e0; border-radius: 4px;';
      colorInput.addEventListener('change', (e) => {
        if (!this.currentFormat.border) this.currentFormat.border = {};
        (this.currentFormat.border as any)[side] = {
          ...(this.currentFormat.border as any)[side],
          color: (e.target as HTMLInputElement).value
        };
      });

      row.appendChild(styleSelect);
      row.appendChild(colorInput);
      group.appendChild(row);
      container.appendChild(group);
    }
  }

  private renderFillTab(container: HTMLElement): void {
    const colorGroup = this.createFormGroup('背景颜色');

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = this.currentFormat.fill?.color || '#ffffff';
    colorInput.style.cssText = 'width: 60px; height: 32px; border: 1px solid #e0e0e0; border-radius: 4px; cursor: pointer;';
    colorInput.addEventListener('change', (e) => {
      if (!this.currentFormat.fill) this.currentFormat.fill = {};
      this.currentFormat.fill.color = (e.target as HTMLInputElement).value;
    });
    colorGroup.appendChild(colorInput);
    container.appendChild(colorGroup);

    // 预设颜色
    const presetGroup = this.createFormGroup('预设颜色');
    const presetColors = [
      '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da',
      '#fff3cd', '#ffeeba', '#ffecb5', '#ffe69c', '#ffda6a',
      '#d4edda', '#c3e6cb', '#b1dfbb', '#a3d9a5', '#8fd19e',
      '#cce5ff', '#b8daff', '#9fcdff', '#80bdff', '#66b0ff',
      '#f8d7da', '#f5c6cb', '#f1b0b7', '#e7969e', '#dc6c7c',
    ];

    const presetContainer = document.createElement('div');
    presetContainer.style.cssText = 'display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px;';

    for (const color of presetColors) {
      const swatch = document.createElement('div');
      swatch.style.cssText = `
        width: 24px;
        height: 24px;
        background: ${color};
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        cursor: pointer;
      `;
      swatch.addEventListener('click', () => {
        if (!this.currentFormat.fill) this.currentFormat.fill = {};
        this.currentFormat.fill.color = color;
        colorInput.value = color;
      });
      presetContainer.appendChild(swatch);
    }

    presetGroup.appendChild(presetContainer);
    container.appendChild(presetGroup);
  }

  private createFormGroup(label: string): HTMLElement {
    const group = document.createElement('div');
    group.style.cssText = 'margin-bottom: 16px;';

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      labelEl.style.cssText = 'display: block; margin-bottom: 8px; font-weight: 500; color: #333;';
      group.appendChild(labelEl);
    }

    return group;
  }

  private createSelect(options: Array<{ value: string; label: string }>, value: string): HTMLSelectElement {
    const select = document.createElement('select');
    select.style.cssText = `
      padding: 8px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      font-size: 13px;
      min-width: 150px;
      cursor: pointer;
    `;

    for (const opt of options) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      option.selected = opt.value === value;
      select.appendChild(option);
    }

    return select;
  }

  private createCheckbox(label: string, checked: boolean): HTMLLabelElement {
    const wrapper = document.createElement('label');
    wrapper.style.cssText = 'display: flex; align-items: center; gap: 8px; cursor: pointer;';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;
    checkbox.style.cssText = 'width: 16px; height: 16px; cursor: pointer;';

    const text = document.createElement('span');
    text.textContent = label;

    wrapper.appendChild(checkbox);
    wrapper.appendChild(text);

    return wrapper;
  }
}
