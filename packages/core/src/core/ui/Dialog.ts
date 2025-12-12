/**
 * 统一弹窗组件
 * 提供模态对话框、确认框、输入框等功能
 */

export interface DialogButton {
  text: string;
  type?: 'primary' | 'default' | 'danger';
  onClick?: () => void | boolean | Promise<void | boolean>;
}

export interface DialogOptions {
  /** 标题 */
  title: string;
  /** 内容（HTML 字符串或 HTMLElement） */
  content: string | HTMLElement;
  /** 宽度 */
  width?: number;
  /** 按钮配置 */
  buttons?: DialogButton[];
  /** 是否显示关闭按钮 */
  closable?: boolean;
  /** 点击遮罩是否关闭 */
  maskClosable?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 自定义类名 */
  className?: string;
}

export interface AlertOptions {
  title?: string;
  content: string;
  confirmText?: string;
  onConfirm?: () => void;
}

export interface ConfirmOptions {
  title?: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface PromptOptions {
  title?: string;
  content?: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: 'text' | 'number' | 'password';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: (value: string) => void;
  onCancel?: () => void;
}

export class Dialog {
  private overlay: HTMLElement | null = null;
  private dialog: HTMLElement | null = null;
  private options: Required<DialogOptions>;
  private static instances: Dialog[] = [];
  private static styleInjected = false;

  constructor(options: DialogOptions) {
    this.options = {
      title: options.title,
      content: options.content,
      width: options.width ?? 420,
      buttons: options.buttons ?? [],
      closable: options.closable ?? true,
      maskClosable: options.maskClosable ?? true,
      onClose: options.onClose ?? (() => { }),
      className: options.className ?? ''
    };

    Dialog.injectStyles();
    this.create();
  }

  private static injectStyles(): void {
    if (Dialog.styleInjected) return;
    Dialog.styleInjected = true;

    const style = document.createElement('style');
    style.id = 'excel-dialog-styles';
    style.textContent = `
      .excel-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
        animation: excel-dialog-fade-in 0.2s ease;
      }
      
      @keyframes excel-dialog-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes excel-dialog-scale-in {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      
      .excel-dialog {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        animation: excel-dialog-scale-in 0.2s ease;
      }
      
      .excel-dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
        flex-shrink: 0;
      }
      
      .excel-dialog-title {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }
      
      .excel-dialog-close {
        width: 28px;
        height: 28px;
        border: none;
        background: none;
        cursor: pointer;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
        transition: all 0.15s;
      }
      
      .excel-dialog-close:hover {
        background: #f3f4f6;
        color: #4b5563;
      }
      
      .excel-dialog-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
      }
      
      .excel-dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 20px;
        border-top: 1px solid #e5e7eb;
        flex-shrink: 0;
      }
      
      .excel-dialog-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
        border: 1px solid #d1d5db;
        background: #fff;
        color: #374151;
      }
      
      .excel-dialog-btn:hover {
        background: #f9fafb;
        border-color: #9ca3af;
      }
      
      .excel-dialog-btn-primary {
        background: #217346;
        border-color: #217346;
        color: #fff;
      }
      
      .excel-dialog-btn-primary:hover {
        background: #1a5c38;
        border-color: #1a5c38;
      }
      
      .excel-dialog-btn-danger {
        background: #ef4444;
        border-color: #ef4444;
        color: #fff;
      }
      
      .excel-dialog-btn-danger:hover {
        background: #dc2626;
        border-color: #dc2626;
      }

      /* Form Elements */
      .excel-dialog-form-item {
        margin-bottom: 16px;
      }
      
      .excel-dialog-form-item:last-child {
        margin-bottom: 0;
      }
      
      .excel-dialog-label {
        display: block;
        margin-bottom: 6px;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
      }
      
      .excel-dialog-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        color: #1f2937;
        transition: border-color 0.15s, box-shadow 0.15s;
        box-sizing: border-box;
      }
      
      .excel-dialog-input:focus {
        outline: none;
        border-color: #217346;
        box-shadow: 0 0 0 3px rgba(33, 115, 70, 0.1);
      }
      
      .excel-dialog-select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        color: #1f2937;
        background: #fff;
        cursor: pointer;
        box-sizing: border-box;
      }
      
      .excel-dialog-select:focus {
        outline: none;
        border-color: #217346;
        box-shadow: 0 0 0 3px rgba(33, 115, 70, 0.1);
      }
      
      .excel-dialog-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 14px;
        color: #374151;
      }
      
      .excel-dialog-checkbox input {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
      
      .excel-dialog-row {
        display: flex;
        gap: 12px;
      }
      
      .excel-dialog-col {
        flex: 1;
      }
      
      .excel-dialog-message {
        font-size: 14px;
        color: #4b5563;
        line-height: 1.6;
      }
    `;
    document.head.appendChild(style);
  }

  private create(): void {
    // Overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'excel-dialog-overlay';

    if (this.options.maskClosable) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }

    // Dialog
    this.dialog = document.createElement('div');
    this.dialog.className = `excel-dialog ${this.options.className}`;
    this.dialog.style.width = `${this.options.width}px`;

    // Header
    const header = document.createElement('div');
    header.className = 'excel-dialog-header';

    const title = document.createElement('h3');
    title.className = 'excel-dialog-title';
    title.textContent = this.options.title;
    header.appendChild(title);

    if (this.options.closable) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'excel-dialog-close';
      closeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
      closeBtn.onclick = () => this.close();
      header.appendChild(closeBtn);
    }

    this.dialog.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'excel-dialog-body';
    if (typeof this.options.content === 'string') {
      body.innerHTML = this.options.content;
    } else {
      body.appendChild(this.options.content);
    }
    this.dialog.appendChild(body);

    // Footer (if buttons exist)
    if (this.options.buttons.length > 0) {
      const footer = document.createElement('div');
      footer.className = 'excel-dialog-footer';

      this.options.buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = `excel-dialog-btn ${btn.type === 'primary' ? 'excel-dialog-btn-primary' : ''} ${btn.type === 'danger' ? 'excel-dialog-btn-danger' : ''}`;
        button.textContent = btn.text;
        button.onclick = async () => {
          if (btn.onClick) {
            const result = await btn.onClick();
            if (result !== false) this.close();
          } else {
            this.close();
          }
        };
        footer.appendChild(button);
      });

      this.dialog.appendChild(footer);
    }

    this.overlay.appendChild(this.dialog);
    document.body.appendChild(this.overlay);
    Dialog.instances.push(this);

    // ESC key to close
    this.handleKeydown = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.handleKeydown);
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.options.closable) {
      this.close();
    }
  }

  /**
   * 关闭弹窗
   */
  close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.dialog = null;
    }
    document.removeEventListener('keydown', this.handleKeydown);
    Dialog.instances = Dialog.instances.filter(d => d !== this);
    this.options.onClose();
  }

  /**
   * 更新内容
   */
  updateContent(content: string | HTMLElement): void {
    const body = this.dialog?.querySelector('.excel-dialog-body');
    if (body) {
      if (typeof content === 'string') {
        body.innerHTML = content;
      } else {
        body.innerHTML = '';
        body.appendChild(content);
      }
    }
  }

  /**
   * 获取弹窗内的元素
   */
  getElement<T extends HTMLElement>(selector: string): T | null {
    return this.dialog?.querySelector(selector) ?? null;
  }

  // ==================== 静态快捷方法 ====================

  /**
   * 提示框
   */
  static alert(options: AlertOptions | string): Promise<void> {
    return new Promise(resolve => {
      const opts = typeof options === 'string' ? { content: options } : options;
      new Dialog({
        title: opts.title ?? '提示',
        content: `<p class="excel-dialog-message">${opts.content}</p>`,
        buttons: [
          {
            text: opts.confirmText ?? '确定',
            type: 'primary',
            onClick: () => {
              opts.onConfirm?.();
              resolve();
            }
          }
        ]
      });
    });
  }

  /**
   * 确认框
   */
  static confirm(options: ConfirmOptions | string): Promise<boolean> {
    return new Promise(resolve => {
      const opts = typeof options === 'string' ? { content: options } : options;
      new Dialog({
        title: opts.title ?? '确认',
        content: `<p class="excel-dialog-message">${opts.content}</p>`,
        buttons: [
          {
            text: opts.cancelText ?? '取消',
            onClick: () => {
              opts.onCancel?.();
              resolve(false);
            }
          },
          {
            text: opts.confirmText ?? '确定',
            type: 'primary',
            onClick: () => {
              opts.onConfirm?.();
              resolve(true);
            }
          }
        ]
      });
    });
  }

  /**
   * 输入框
   */
  static prompt(options: PromptOptions | string): Promise<string | null> {
    return new Promise(resolve => {
      const opts = typeof options === 'string' ? { content: options } : options;
      const inputId = `prompt-input-${Date.now()}`;

      const dialog = new Dialog({
        title: opts.title ?? '输入',
        content: `
          <div class="excel-dialog-form-item">
            ${opts.content ? `<label class="excel-dialog-label">${opts.content}</label>` : ''}
            <input 
              type="${opts.inputType ?? 'text'}" 
              id="${inputId}"
              class="excel-dialog-input" 
              placeholder="${opts.placeholder ?? ''}"
              value="${opts.defaultValue ?? ''}"
            >
          </div>
        `,
        buttons: [
          {
            text: opts.cancelText ?? '取消',
            onClick: () => {
              opts.onCancel?.();
              resolve(null);
            }
          },
          {
            text: opts.confirmText ?? '确定',
            type: 'primary',
            onClick: () => {
              const input = document.getElementById(inputId) as HTMLInputElement;
              const value = input?.value ?? '';
              opts.onConfirm?.(value);
              resolve(value);
            }
          }
        ]
      });

      // 聚焦输入框
      setTimeout(() => {
        const input = document.getElementById(inputId) as HTMLInputElement;
        input?.focus();
        input?.select();
      }, 100);
    });
  }

  /**
   * 关闭所有弹窗
   */
  static closeAll(): void {
    [...Dialog.instances].forEach(d => d.close());
  }
}

// 导出便捷函数
export const alert = Dialog.alert;
export const confirm = Dialog.confirm;
export const prompt = Dialog.prompt;
