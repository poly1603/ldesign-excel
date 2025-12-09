/**
 * 公式栏组件
 * 显示当前单元格地址和内容，支持编辑公式
 */

export interface FormulaBarOptions {
  /** 值变化回调 */
  onValueChange?: (value: string) => void;
  /** 确认回调 */
  onConfirm?: (value: string) => void;
  /** 取消回调 */
  onCancel?: () => void;
}

export class FormulaBar {
  private container: HTMLElement;
  private barElement: HTMLElement | null = null;
  private addressInput: HTMLInputElement | null = null;
  private formulaInput: HTMLInputElement | null = null;
  private options: FormulaBarOptions;

  constructor(container: HTMLElement, options: FormulaBarOptions = {}) {
    this.container = container;
    this.options = options;
    this.init();
  }

  private init(): void {
    this.barElement = document.createElement('div');
    this.barElement.className = 'spreadsheet-formula-bar';
    this.barElement.style.cssText = `
      display: flex;
      align-items: center;
      padding: 4px 8px;
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      gap: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
    `;

    // 单元格地址
    this.addressInput = document.createElement('input');
    this.addressInput.className = 'formula-bar-address';
    this.addressInput.style.cssText = `
      width: 80px;
      padding: 4px 8px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      text-align: center;
      background: #f8f9fa;
    `;
    this.addressInput.readOnly = true;
    this.addressInput.value = 'A1';

    // 函数按钮
    const fxButton = document.createElement('button');
    fxButton.className = 'formula-bar-fx';
    fxButton.textContent = 'fx';
    fxButton.title = '插入函数';
    fxButton.style.cssText = `
      padding: 4px 8px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      background: #f8f9fa;
      cursor: pointer;
      font-style: italic;
      font-weight: 500;
    `;
    fxButton.addEventListener('click', () => {
      this.showFunctionDialog();
    });

    // 公式输入框
    this.formulaInput = document.createElement('input');
    this.formulaInput.className = 'formula-bar-input';
    this.formulaInput.style.cssText = `
      flex: 1;
      padding: 4px 8px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      font-size: 13px;
      font-family: Consolas, Monaco, monospace;
    `;
    this.formulaInput.placeholder = '输入值或公式...';

    // 事件处理
    this.formulaInput.addEventListener('input', () => {
      this.options.onValueChange?.(this.formulaInput!.value);
    });

    this.formulaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.options.onConfirm?.(this.formulaInput!.value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.options.onCancel?.();
      }
    });

    this.barElement.appendChild(this.addressInput);
    this.barElement.appendChild(fxButton);
    this.barElement.appendChild(this.formulaInput);

    // 插入到工具栏之后
    const toolbar = this.container.querySelector('.spreadsheet-toolbar');
    if (toolbar && toolbar.nextSibling) {
      this.container.insertBefore(this.barElement, toolbar.nextSibling);
    } else if (toolbar) {
      toolbar.after(this.barElement);
    } else {
      this.container.insertBefore(this.barElement, this.container.firstChild);
    }
  }

  /**
   * 设置当前单元格地址
   */
  setAddress(address: string): void {
    if (this.addressInput) {
      this.addressInput.value = address;
    }
  }

  /**
   * 设置公式/值
   */
  setValue(value: string): void {
    if (this.formulaInput) {
      this.formulaInput.value = value;
    }
  }

  /**
   * 获取当前值
   */
  getValue(): string {
    return this.formulaInput?.value || '';
  }

  /**
   * 聚焦输入框
   */
  focus(): void {
    this.formulaInput?.focus();
  }

  /**
   * 显示函数对话框
   */
  private showFunctionDialog(): void {
    // 创建函数选择对话框
    const dialog = document.createElement('div');
    dialog.className = 'function-dialog';
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      max-height: 500px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      z-index: 2000;
      overflow: hidden;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      font-weight: 500;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <span>插入函数</span>
      <button style="border: none; background: none; cursor: pointer; font-size: 18px;">×</button>
    `;
    header.querySelector('button')?.addEventListener('click', () => {
      dialog.remove();
      overlay.remove();
    });

    const content = document.createElement('div');
    content.style.cssText = `
      padding: 16px;
      max-height: 400px;
      overflow-y: auto;
    `;

    // 常用函数列表
    const functions = [
      { name: 'SUM', desc: '求和', syntax: 'SUM(数值1, [数值2], ...)' },
      { name: 'AVERAGE', desc: '平均值', syntax: 'AVERAGE(数值1, [数值2], ...)' },
      { name: 'COUNT', desc: '计数', syntax: 'COUNT(值1, [值2], ...)' },
      { name: 'MAX', desc: '最大值', syntax: 'MAX(数值1, [数值2], ...)' },
      { name: 'MIN', desc: '最小值', syntax: 'MIN(数值1, [数值2], ...)' },
      { name: 'IF', desc: '条件判断', syntax: 'IF(条件, 真值, 假值)' },
      { name: 'VLOOKUP', desc: '垂直查找', syntax: 'VLOOKUP(查找值, 范围, 列号, [匹配类型])' },
      { name: 'HLOOKUP', desc: '水平查找', syntax: 'HLOOKUP(查找值, 范围, 行号, [匹配类型])' },
      { name: 'CONCATENATE', desc: '文本连接', syntax: 'CONCATENATE(文本1, [文本2], ...)' },
      { name: 'LEFT', desc: '左截取', syntax: 'LEFT(文本, 字符数)' },
      { name: 'RIGHT', desc: '右截取', syntax: 'RIGHT(文本, 字符数)' },
      { name: 'MID', desc: '中间截取', syntax: 'MID(文本, 起始位置, 字符数)' },
      { name: 'LEN', desc: '文本长度', syntax: 'LEN(文本)' },
      { name: 'ROUND', desc: '四舍五入', syntax: 'ROUND(数值, 小数位数)' },
      { name: 'TODAY', desc: '今天日期', syntax: 'TODAY()' },
      { name: 'NOW', desc: '当前时间', syntax: 'NOW()' },
    ];

    for (const fn of functions) {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 12px;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background 0.15s;
      `;
      item.innerHTML = `
        <div style="font-weight: 500; color: #1a73e8;">${fn.name}</div>
        <div style="font-size: 12px; color: #666; margin-top: 4px;">${fn.desc}</div>
        <div style="font-size: 11px; color: #999; margin-top: 2px; font-family: monospace;">${fn.syntax}</div>
      `;

      item.addEventListener('mouseenter', () => {
        item.style.background = '#f5f5f5';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = '';
      });
      item.addEventListener('click', () => {
        if (this.formulaInput) {
          this.formulaInput.value = `=${fn.name}()`;
          this.formulaInput.focus();
          // 光标放在括号中间
          const pos = this.formulaInput.value.length - 1;
          this.formulaInput.setSelectionRange(pos, pos);
        }
        dialog.remove();
        overlay.remove();
      });

      content.appendChild(item);
    }

    dialog.appendChild(header);
    dialog.appendChild(content);

    // 遮罩层
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 1999;
    `;
    overlay.addEventListener('click', () => {
      dialog.remove();
      overlay.remove();
    });

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.barElement) {
      this.barElement.remove();
      this.barElement = null;
    }
  }
}
