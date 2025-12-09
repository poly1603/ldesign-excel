/**
 * 右键菜单组件
 */

export interface MenuItem {
  /** 菜单项 ID */
  id: string;
  /** 显示文本 */
  label: string;
  /** 图标（可选） */
  icon?: string;
  /** 快捷键提示 */
  shortcut?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 分隔线（在此项之后） */
  divider?: boolean;
  /** 子菜单 */
  children?: MenuItem[];
  /** 点击回调 */
  onClick?: () => void;
}

export interface ContextMenuOptions {
  /** 菜单项 */
  items: MenuItem[];
  /** 菜单宽度 */
  width?: number;
  /** z-index */
  zIndex?: number;
}

export class ContextMenu {
  private container: HTMLElement;
  private menuElement: HTMLElement | null = null;
  private options: ContextMenuOptions;
  private visible = false;
  private onItemClick?: (item: MenuItem) => void;

  constructor(container: HTMLElement, options: ContextMenuOptions) {
    this.container = container;
    this.options = {
      width: 200,
      zIndex: 1000,
      ...options
    };

    this.init();
  }

  private init(): void {
    // 点击其他区域关闭菜单
    document.addEventListener('click', this.handleDocumentClick.bind(this));
    document.addEventListener('contextmenu', this.handleDocumentContextMenu.bind(this));
    window.addEventListener('blur', this.hide.bind(this));
    window.addEventListener('resize', this.hide.bind(this));
  }

  private handleDocumentClick(e: MouseEvent): void {
    if (this.visible && this.menuElement && !this.menuElement.contains(e.target as Node)) {
      this.hide();
    }
  }

  private handleDocumentContextMenu(e: MouseEvent): void {
    if (this.visible && this.menuElement && !this.menuElement.contains(e.target as Node)) {
      this.hide();
    }
  }

  /**
   * 显示菜单
   */
  show(x: number, y: number, onItemClick?: (item: MenuItem) => void): void {
    this.onItemClick = onItemClick;
    this.hide();

    this.menuElement = this.createMenuElement();
    document.body.appendChild(this.menuElement);

    // 调整位置确保菜单在可视区域内
    const rect = this.menuElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = x;
    let top = y;

    if (x + rect.width > viewportWidth) {
      left = viewportWidth - rect.width - 10;
    }
    if (y + rect.height > viewportHeight) {
      top = viewportHeight - rect.height - 10;
    }

    this.menuElement.style.left = `${Math.max(0, left)}px`;
    this.menuElement.style.top = `${Math.max(0, top)}px`;

    this.visible = true;
  }

  /**
   * 隐藏菜单
   */
  hide(): void {
    if (this.menuElement) {
      this.menuElement.remove();
      this.menuElement = null;
    }
    this.visible = false;
  }

  /**
   * 更新菜单项
   */
  updateItems(items: MenuItem[]): void {
    this.options.items = items;
  }

  /**
   * 创建菜单元素
   */
  private createMenuElement(): HTMLElement {
    const menu = document.createElement('div');
    menu.className = 'spreadsheet-context-menu';
    menu.style.cssText = `
      position: fixed;
      min-width: ${this.options.width}px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 4px 0;
      z-index: ${this.options.zIndex};
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    for (const item of this.options.items) {
      if (item.hidden) continue;

      const menuItem = this.createMenuItem(item);
      menu.appendChild(menuItem);

      if (item.divider) {
        const divider = document.createElement('div');
        divider.style.cssText = `
          height: 1px;
          background: #e0e0e0;
          margin: 4px 0;
        `;
        menu.appendChild(divider);
      }
    }

    return menu;
  }

  /**
   * 创建菜单项元素
   */
  private createMenuItem(item: MenuItem): HTMLElement {
    const menuItem = document.createElement('div');
    menuItem.className = 'spreadsheet-context-menu-item';
    menuItem.style.cssText = `
      display: flex;
      align-items: center;
      padding: 8px 16px;
      cursor: ${item.disabled ? 'not-allowed' : 'pointer'};
      color: ${item.disabled ? '#999' : '#333'};
      transition: background 0.15s;
    `;

    // 图标
    if (item.icon) {
      const icon = document.createElement('span');
      icon.className = 'menu-item-icon';
      icon.textContent = item.icon;
      icon.style.cssText = `
        width: 20px;
        margin-right: 8px;
        text-align: center;
      `;
      menuItem.appendChild(icon);
    }

    // 文本
    const label = document.createElement('span');
    label.className = 'menu-item-label';
    label.textContent = item.label;
    label.style.cssText = `
      flex: 1;
    `;
    menuItem.appendChild(label);

    // 快捷键
    if (item.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.className = 'menu-item-shortcut';
      shortcut.textContent = item.shortcut;
      shortcut.style.cssText = `
        color: #999;
        font-size: 12px;
        margin-left: 16px;
      `;
      menuItem.appendChild(shortcut);
    }

    // 子菜单箭头
    if (item.children && item.children.length > 0) {
      const arrow = document.createElement('span');
      arrow.textContent = '▶';
      arrow.style.cssText = `
        font-size: 10px;
        color: #666;
        margin-left: 8px;
      `;
      menuItem.appendChild(arrow);
    }

    // 事件处理
    if (!item.disabled) {
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.background = '#f5f5f5';
      });
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.background = '';
      });
      menuItem.addEventListener('click', (e) => {
        e.stopPropagation();
        if (item.onClick) {
          item.onClick();
        }
        if (this.onItemClick) {
          this.onItemClick(item);
        }
        this.hide();
      });
    }

    return menuItem;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.hide();
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
    document.removeEventListener('contextmenu', this.handleDocumentContextMenu.bind(this));
    window.removeEventListener('blur', this.hide.bind(this));
    window.removeEventListener('resize', this.hide.bind(this));
  }
}

/**
 * 创建默认的电子表格右键菜单项
 */
export function createDefaultContextMenuItems(): MenuItem[] {
  return [
    {
      id: 'cut',
      label: '剪切',
      icon: '✂️',
      shortcut: 'Ctrl+X'
    },
    {
      id: 'copy',
      label: '复制',
      icon: '📋',
      shortcut: 'Ctrl+C'
    },
    {
      id: 'paste',
      label: '粘贴',
      icon: '📄',
      shortcut: 'Ctrl+V',
      divider: true
    },
    {
      id: 'pasteSpecial',
      label: '选择性粘贴',
      shortcut: 'Ctrl+Shift+V',
      children: [
        { id: 'pasteValues', label: '仅粘贴值' },
        { id: 'pasteFormulas', label: '仅粘贴公式' },
        { id: 'pasteFormats', label: '仅粘贴格式' }
      ],
      divider: true
    },
    {
      id: 'insertRowAbove',
      label: '在上方插入行',
      icon: '➕'
    },
    {
      id: 'insertRowBelow',
      label: '在下方插入行',
      icon: '➕'
    },
    {
      id: 'insertColLeft',
      label: '在左侧插入列',
      icon: '➕'
    },
    {
      id: 'insertColRight',
      label: '在右侧插入列',
      icon: '➕',
      divider: true
    },
    {
      id: 'deleteRow',
      label: '删除行',
      icon: '🗑️'
    },
    {
      id: 'deleteCol',
      label: '删除列',
      icon: '🗑️',
      divider: true
    },
    {
      id: 'clearContents',
      label: '清除内容',
      shortcut: 'Delete'
    },
    {
      id: 'clearFormats',
      label: '清除格式'
    },
    {
      id: 'clearAll',
      label: '清除全部',
      divider: true
    },
    {
      id: 'formatCells',
      label: '设置单元格格式',
      icon: '⚙️',
      shortcut: 'Ctrl+1'
    },
    {
      id: 'mergeCells',
      label: '合并单元格'
    },
    {
      id: 'unmergeCells',
      label: '取消合并'
    }
  ];
}
