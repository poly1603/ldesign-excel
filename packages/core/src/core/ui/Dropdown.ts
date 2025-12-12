/**
 * 统一下拉框/下拉菜单组件
 * 支持 select 下拉和 popup 菜单
 */

export interface DropdownItem {
  /** 唯一标识 */
  value: string | number;
  /** 显示文本 */
  label: string;
  /** 图标（可选） */
  icon?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 分隔线 */
  divider?: boolean;
  /** 子菜单 */
  children?: DropdownItem[];
  /** 自定义数据 */
  data?: any;
}

export interface DropdownOptions {
  /** 下拉项 */
  items: DropdownItem[];
  /** 默认选中值 */
  value?: string | number;
  /** 占位符 */
  placeholder?: string;
  /** 宽度 */
  width?: number | string;
  /** 最大高度 */
  maxHeight?: number;
  /** 是否可搜索 */
  searchable?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 选择回调 */
  onSelect?: (item: DropdownItem) => void;
  /** 值变化回调 */
  onChange?: (value: string | number, item: DropdownItem) => void;
}

export interface PopupMenuOptions {
  /** 菜单项 */
  items: DropdownItem[];
  /** 触发元素 */
  trigger?: HTMLElement;
  /** 显示位置 */
  position?: { x: number; y: number };
  /** 对齐方式 */
  align?: 'left' | 'right' | 'center';
  /** 选择回调 */
  onSelect?: (item: DropdownItem) => void;
}

export class Dropdown {
  private container: HTMLElement;
  private options: Required<Omit<DropdownOptions, 'onSelect' | 'onChange' | 'value'>> & Pick<DropdownOptions, 'onSelect' | 'onChange' | 'value'>;
  private button: HTMLButtonElement | null = null;
  private menu: HTMLElement | null = null;
  private selectedItem: DropdownItem | null = null;
  private isOpen = false;
  private static styleInjected = false;

  constructor(container: HTMLElement, options: DropdownOptions) {
    this.container = container;
    this.options = {
      items: options.items,
      value: options.value,
      placeholder: options.placeholder ?? '请选择',
      width: options.width ?? 'auto',
      maxHeight: options.maxHeight ?? 300,
      searchable: options.searchable ?? false,
      disabled: options.disabled ?? false,
      onSelect: options.onSelect,
      onChange: options.onChange
    };

    Dropdown.injectStyles();
    this.create();

    // 设置初始值
    if (this.options.value !== undefined) {
      const item = this.options.items.find(i => i.value === this.options.value);
      if (item) {
        this.selectedItem = item;
        this.updateButtonText();
      }
    }
  }

  private static injectStyles(): void {
    if (Dropdown.styleInjected) return;
    Dropdown.styleInjected = true;

    const style = document.createElement('style');
    style.id = 'excel-dropdown-styles';
    style.textContent = `
      .excel-dropdown {
        position: relative;
        display: inline-block;
        font-size: 14px;
      }
      
      .excel-dropdown-btn {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 6px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #fff;
        color: #374151;
        cursor: pointer;
        font-size: inherit;
        min-width: 80px;
        transition: all 0.15s;
        box-sizing: border-box;
      }
      
      .excel-dropdown-btn:hover:not(:disabled) {
        border-color: #9ca3af;
      }
      
      .excel-dropdown-btn:focus {
        outline: none;
        border-color: #217346;
        box-shadow: 0 0 0 3px rgba(33, 115, 70, 0.1);
      }
      
      .excel-dropdown-btn:disabled {
        background: #f3f4f6;
        color: #9ca3af;
        cursor: not-allowed;
      }
      
      .excel-dropdown-btn-text {
        flex: 1;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .excel-dropdown-btn-placeholder {
        color: #9ca3af;
      }
      
      .excel-dropdown-btn-icon {
        flex-shrink: 0;
        transition: transform 0.2s;
      }
      
      .excel-dropdown.open .excel-dropdown-btn-icon {
        transform: rotate(180deg);
      }
      
      .excel-dropdown-menu {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        min-width: 100%;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        z-index: 99999;
        overflow: hidden;
        animation: excel-dropdown-slide-down 0.15s ease;
      }
      
      @keyframes excel-dropdown-slide-down {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .excel-dropdown-search {
        padding: 8px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .excel-dropdown-search input {
        width: 100%;
        padding: 6px 10px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 13px;
        box-sizing: border-box;
      }
      
      .excel-dropdown-search input:focus {
        outline: none;
        border-color: #217346;
      }
      
      .excel-dropdown-list {
        max-height: 300px;
        overflow-y: auto;
        padding: 4px 0;
      }
      
      .excel-dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        cursor: pointer;
        transition: background 0.1s;
        color: #374151;
      }
      
      .excel-dropdown-item:hover:not(.disabled) {
        background: #f3f4f6;
      }
      
      .excel-dropdown-item.selected {
        background: #ecfdf5;
        color: #217346;
      }
      
      .excel-dropdown-item.disabled {
        color: #9ca3af;
        cursor: not-allowed;
      }
      
      .excel-dropdown-item-icon {
        flex-shrink: 0;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .excel-dropdown-item-text {
        flex: 1;
      }
      
      .excel-dropdown-item-check {
        flex-shrink: 0;
        color: #217346;
        opacity: 0;
      }
      
      .excel-dropdown-item.selected .excel-dropdown-item-check {
        opacity: 1;
      }
      
      .excel-dropdown-divider {
        height: 1px;
        background: #e5e7eb;
        margin: 4px 0;
      }
      
      .excel-dropdown-empty {
        padding: 16px;
        text-align: center;
        color: #9ca3af;
        font-size: 13px;
      }
      
      /* Popup Menu (floating) */
      .excel-popup-menu {
        position: fixed;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        z-index: 100000;
        padding: 4px 0;
        min-width: 160px;
        animation: excel-dropdown-slide-down 0.15s ease;
      }
      
      .excel-popup-menu .excel-dropdown-item {
        padding: 8px 16px;
      }
      
      .excel-popup-menu .excel-dropdown-item-shortcut {
        margin-left: auto;
        font-size: 12px;
        color: #9ca3af;
      }
      
      /* Submenu */
      .excel-dropdown-item.has-children::after {
        content: '';
        margin-left: auto;
        border: 4px solid transparent;
        border-left-color: #9ca3af;
      }
      
      .excel-submenu {
        position: absolute;
        left: 100%;
        top: 0;
        margin-left: 4px;
      }
    `;
    document.head.appendChild(style);
  }

  private create(): void {
    this.container.innerHTML = '';
    this.container.className = 'excel-dropdown';

    // Button
    this.button = document.createElement('button');
    this.button.className = 'excel-dropdown-btn';
    this.button.disabled = this.options.disabled;
    this.button.style.width = typeof this.options.width === 'number' ? `${this.options.width}px` : this.options.width;

    this.button.innerHTML = `
      <span class="excel-dropdown-btn-text excel-dropdown-btn-placeholder">${this.options.placeholder}</span>
      <span class="excel-dropdown-btn-icon">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </span>
    `;

    this.button.onclick = () => this.toggle();
    this.container.appendChild(this.button);

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target as Node)) {
        this.close();
      }
    });
  }

  private createMenu(): HTMLElement {
    const menu = document.createElement('div');
    menu.className = 'excel-dropdown-menu';
    menu.style.maxHeight = `${this.options.maxHeight}px`;

    // Search
    if (this.options.searchable) {
      const search = document.createElement('div');
      search.className = 'excel-dropdown-search';
      search.innerHTML = '<input type="text" placeholder="搜索...">';
      const input = search.querySelector('input')!;
      input.oninput = () => this.filterItems(input.value);
      menu.appendChild(search);
    }

    // List
    const list = document.createElement('div');
    list.className = 'excel-dropdown-list';
    this.renderItems(list, this.options.items);
    menu.appendChild(list);

    return menu;
  }

  private renderItems(container: HTMLElement, items: DropdownItem[]): void {
    container.innerHTML = '';

    const visibleItems = items.filter(item => !item.hidden);

    if (visibleItems.length === 0) {
      container.innerHTML = '<div class="excel-dropdown-empty">无数据</div>';
      return;
    }

    visibleItems.forEach(item => {
      if (item.divider) {
        const divider = document.createElement('div');
        divider.className = 'excel-dropdown-divider';
        container.appendChild(divider);
        return;
      }

      const itemEl = document.createElement('div');
      itemEl.className = 'excel-dropdown-item';
      if (item.disabled) itemEl.classList.add('disabled');
      if (this.selectedItem?.value === item.value) itemEl.classList.add('selected');
      if (item.children && item.children.length > 0) itemEl.classList.add('has-children');

      itemEl.innerHTML = `
        ${item.icon ? `<span class="excel-dropdown-item-icon">${item.icon}</span>` : ''}
        <span class="excel-dropdown-item-text">${item.label}</span>
        <span class="excel-dropdown-item-check">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      `;

      if (!item.disabled) {
        itemEl.onclick = (e) => {
          e.stopPropagation();
          this.select(item);
        };
      }

      container.appendChild(itemEl);
    });
  }

  private filterItems(query: string): void {
    const list = this.menu?.querySelector('.excel-dropdown-list');
    if (!list) return;

    const filtered = this.options.items.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
    this.renderItems(list as HTMLElement, filtered);
  }

  private updateButtonText(): void {
    const textEl = this.button?.querySelector('.excel-dropdown-btn-text');
    if (textEl) {
      if (this.selectedItem) {
        textEl.textContent = this.selectedItem.label;
        textEl.classList.remove('excel-dropdown-btn-placeholder');
      } else {
        textEl.textContent = this.options.placeholder;
        textEl.classList.add('excel-dropdown-btn-placeholder');
      }
    }
  }

  /**
   * 打开下拉
   */
  open(): void {
    if (this.isOpen || this.options.disabled) return;

    this.menu = this.createMenu();
    this.container.appendChild(this.menu);
    this.container.classList.add('open');
    this.isOpen = true;

    // 聚焦搜索框
    if (this.options.searchable) {
      const input = this.menu.querySelector('input');
      input?.focus();
    }
  }

  /**
   * 关闭下拉
   */
  close(): void {
    if (!this.isOpen) return;

    this.menu?.remove();
    this.menu = null;
    this.container.classList.remove('open');
    this.isOpen = false;
  }

  /**
   * 切换
   */
  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * 选择项
   */
  select(item: DropdownItem): void {
    this.selectedItem = item;
    this.updateButtonText();
    this.close();
    this.options.onSelect?.(item);
    this.options.onChange?.(item.value, item);
  }

  /**
   * 设置值
   */
  setValue(value: string | number): void {
    const item = this.options.items.find(i => i.value === value);
    if (item) {
      this.selectedItem = item;
      this.updateButtonText();
    }
  }

  /**
   * 获取值
   */
  getValue(): string | number | undefined {
    return this.selectedItem?.value;
  }

  /**
   * 更新选项
   */
  updateItems(items: DropdownItem[]): void {
    this.options.items = items;
    if (this.isOpen) {
      const list = this.menu?.querySelector('.excel-dropdown-list');
      if (list) {
        this.renderItems(list as HTMLElement, items);
      }
    }
  }

  /**
   * 设置禁用状态
   */
  setDisabled(disabled: boolean): void {
    this.options.disabled = disabled;
    if (this.button && this.button instanceof HTMLButtonElement) {
      this.button.disabled = disabled;
    }
    if (disabled) this.close();
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.close();
    this.container.innerHTML = '';
  }

  // ==================== 静态方法：弹出菜单 ====================

  /**
   * 显示弹出菜单
   */
  static showMenu(options: PopupMenuOptions): () => void {
    Dropdown.injectStyles();

    const menu = document.createElement('div');
    menu.className = 'excel-popup-menu';

    // 渲染菜单项
    const renderMenuItems = (container: HTMLElement, items: DropdownItem[]) => {
      items.filter(i => !i.hidden).forEach(item => {
        if (item.divider) {
          const divider = document.createElement('div');
          divider.className = 'excel-dropdown-divider';
          container.appendChild(divider);
          return;
        }

        const itemEl = document.createElement('div');
        itemEl.className = 'excel-dropdown-item';
        if (item.disabled) itemEl.classList.add('disabled');
        if (item.children && item.children.length > 0) itemEl.classList.add('has-children');

        itemEl.innerHTML = `
          ${item.icon ? `<span class="excel-dropdown-item-icon">${item.icon}</span>` : ''}
          <span class="excel-dropdown-item-text">${item.label}</span>
        `;

        if (!item.disabled && !item.children) {
          itemEl.onclick = (e) => {
            e.stopPropagation();
            close();
            options.onSelect?.(item);
          };
        }

        // 子菜单
        if (item.children && item.children.length > 0) {
          itemEl.onmouseenter = () => {
            // 移除其他子菜单
            container.querySelectorAll('.excel-submenu').forEach(m => m.remove());

            const submenu = document.createElement('div');
            submenu.className = 'excel-popup-menu excel-submenu';
            renderMenuItems(submenu, item.children!);
            itemEl.appendChild(submenu);
          };
        }

        container.appendChild(itemEl);
      });
    };

    renderMenuItems(menu, options.items);

    // 定位
    if (options.position) {
      menu.style.left = `${options.position.x}px`;
      menu.style.top = `${options.position.y}px`;
    } else if (options.trigger) {
      const rect = options.trigger.getBoundingClientRect();
      menu.style.left = `${rect.left}px`;
      menu.style.top = `${rect.bottom + 4}px`;
    }

    document.body.appendChild(menu);

    // 调整位置确保在视口内
    const menuRect = menu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth) {
      menu.style.left = `${window.innerWidth - menuRect.width - 8}px`;
    }
    if (menuRect.bottom > window.innerHeight) {
      menu.style.top = `${window.innerHeight - menuRect.height - 8}px`;
    }

    // 关闭函数
    const close = () => {
      menu.remove();
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('contextmenu', handleOutsideClick);
    };

    // 点击外部关闭
    const handleOutsideClick = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        close();
      }
    };

    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('contextmenu', handleOutsideClick);
    }, 0);

    return close;
  }
}

// 导出便捷函数
export const showMenu = Dropdown.showMenu;
