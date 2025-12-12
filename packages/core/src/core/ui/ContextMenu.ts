/**
 * 右键菜单组件
 */

import { createIcon } from './Icons';

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
      zIndex: 99999,
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
    // 检查菜单是否存在且点击不在菜单内
    if (this.menuElement && !this.menuElement.contains(e.target as Node)) {
      this.hide();
    }
  }

  private handleDocumentContextMenu(_e: MouseEvent): void {
    // 右键点击时关闭现有菜单（如果菜单已经可见，说明这是新的右键点击）
    // 但如果菜单刚刚创建（showPending），则不关闭
    if (this.menuElement && this.visible) {
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
    this.visible = false; // 标记为待显示状态
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

    // 延迟设置 visible，避免被同一次事件的 document contextmenu 处理器关闭
    setTimeout(() => {
      this.visible = true;
    }, 0);
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
  private createMenuItem(item: MenuItem, parentMenu?: HTMLElement): HTMLElement {
    const menuItem = document.createElement('div');
    menuItem.className = 'spreadsheet-context-menu-item';
    menuItem.style.cssText = `
      display: flex;
      align-items: center;
      padding: 8px 16px;
      cursor: ${item.disabled ? 'not-allowed' : 'pointer'};
      color: ${item.disabled ? '#999' : '#333'};
      transition: background 0.15s;
      position: relative;
    `;

    // 图标占位（保持对齐）
    const iconSlot = document.createElement('span');
    iconSlot.className = 'menu-item-icon';
    iconSlot.innerHTML = item.icon || '';
    iconSlot.style.cssText = `
      width: 20px;
      height: 16px;
      margin-right: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
    `;
    menuItem.appendChild(iconSlot);

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
    const hasChildren = item.children && item.children.length > 0;
    if (hasChildren) {
      const arrow = document.createElement('span');
      arrow.textContent = '▸';
      arrow.style.cssText = `
        font-size: 12px;
        color: #666;
        margin-left: 8px;
      `;
      menuItem.appendChild(arrow);
    }

    let subMenu: HTMLElement | null = null;
    let hideTimeout: ReturnType<typeof setTimeout> | null = null;

    // 事件处理
    if (!item.disabled) {
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.background = '#e8f0fe';

        // 显示子菜单
        if (hasChildren && item.children) {
          if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
          }

          if (!subMenu) {
            subMenu = this.createSubMenu(item.children, menuItem);
            document.body.appendChild(subMenu);
          }
          subMenu.style.display = 'block';
        }
      });

      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.background = '';

        // 延迟隐藏子菜单
        if (subMenu) {
          hideTimeout = setTimeout(() => {
            if (subMenu) {
              subMenu.style.display = 'none';
            }
          }, 100);
        }
      });

      // 如果没有子菜单，点击执行操作
      if (!hasChildren) {
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
    }

    return menuItem;
  }

  /**
   * 创建子菜单
   */
  private createSubMenu(items: MenuItem[], parentItem: HTMLElement): HTMLElement {
    const subMenu = document.createElement('div');
    subMenu.className = 'spreadsheet-context-submenu';
    subMenu.style.cssText = `
      position: fixed;
      min-width: ${this.options.width}px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 4px 0;
      z-index: ${(this.options.zIndex ?? 1000) + 1};
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // 定位子菜单
    const rect = parentItem.getBoundingClientRect();
    let left = rect.right - 4;
    let top = rect.top;

    // 检查是否超出视口
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 先添加到 DOM 获取尺寸
    subMenu.style.visibility = 'hidden';
    document.body.appendChild(subMenu);
    const subMenuRect = subMenu.getBoundingClientRect();
    subMenu.remove();
    subMenu.style.visibility = '';

    if (left + subMenuRect.width > viewportWidth) {
      left = rect.left - subMenuRect.width + 4;
    }
    if (top + subMenuRect.height > viewportHeight) {
      top = viewportHeight - subMenuRect.height - 10;
    }

    subMenu.style.left = `${Math.max(0, left)}px`;
    subMenu.style.top = `${Math.max(0, top)}px`;

    // 添加菜单项
    for (const item of items) {
      if (item.hidden) continue;

      const menuItem = this.createMenuItem(item, subMenu);
      subMenu.appendChild(menuItem);

      if (item.divider) {
        const divider = document.createElement('div');
        divider.style.cssText = `
          height: 1px;
          background: #e0e0e0;
          margin: 4px 0;
        `;
        subMenu.appendChild(divider);
      }
    }

    // 鼠标进入子菜单时保持显示
    subMenu.addEventListener('mouseenter', () => {
      subMenu.style.display = 'block';
    });

    subMenu.addEventListener('mouseleave', () => {
      subMenu.style.display = 'none';
    });

    return subMenu;
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
 * 创建默认的电子表格右键菜单项（腾讯文档风格）
 */
export function createDefaultContextMenuItems(): MenuItem[] {
  return [
    // 剪贴板操作
    {
      id: 'cut',
      label: '剪切',
      icon: createIcon('scissors'),
      shortcut: 'Ctrl+X'
    },
    {
      id: 'copy',
      label: '复制',
      icon: createIcon('copy'),
      shortcut: 'Ctrl+C'
    },
    {
      id: 'paste',
      label: '粘贴',
      icon: createIcon('clipboard'),
      shortcut: 'Ctrl+V'
    },
    {
      id: 'pasteSpecial',
      label: '选择性粘贴',
      icon: createIcon('clipboard-list'),
      shortcut: 'Ctrl+Shift+V',
      children: [
        { id: 'pasteValues', label: '仅粘贴值' },
        { id: 'pasteFormulas', label: '仅粘贴公式' },
        { id: 'pasteFormats', label: '仅粘贴格式' },
        { id: 'pasteColumnWidth', label: '粘贴列宽' },
        { id: 'pasteTranspose', label: '转置粘贴' }
      ],
      divider: true
    },

    // 插入操作
    {
      id: 'insert',
      label: '插入',
      icon: createIcon('plus'),
      children: [
        { id: 'insertRowAbove', label: '在上方插入 1 行' },
        { id: 'insertRowBelow', label: '在下方插入 1 行' },
        { id: 'insertRowsAbove', label: '在上方插入多行...' },
        { id: 'insertRowsBelow', label: '在下方插入多行...' },
        { id: 'insertColLeft', label: '在左侧插入 1 列' },
        { id: 'insertColRight', label: '在右侧插入 1 列' },
        { id: 'insertColsLeft', label: '在左侧插入多列...' },
        { id: 'insertColsRight', label: '在右侧插入多列...' },
        { id: 'divider1', label: '', divider: true },
        { id: 'insertCells', label: '插入单元格...' }
      ]
    },
    {
      id: 'delete',
      label: '删除',
      icon: createIcon('trash'),
      children: [
        { id: 'deleteRow', label: '删除行' },
        { id: 'deleteCol', label: '删除列' },
        { id: 'deleteCells', label: '删除单元格...' }
      ],
      divider: true
    },

    // 清除操作
    {
      id: 'clear',
      label: '清除',
      icon: createIcon('eraser'),
      children: [
        { id: 'clearContents', label: '清除内容', shortcut: 'Delete' },
        { id: 'clearFormats', label: '清除格式' },
        { id: 'clearComments', label: '清除批注' },
        { id: 'clearHyperlinks', label: '清除超链接' },
        { id: 'clearAll', label: '全部清除' }
      ],
      divider: true
    },

    // 格式操作
    {
      id: 'formatCells',
      label: '设置单元格格式',
      icon: createIcon('settings'),
      shortcut: 'Ctrl+1'
    },
    {
      id: 'rowHeight',
      label: '行高...',
      icon: createIcon('move-vertical')
    },
    {
      id: 'colWidth',
      label: '列宽...',
      icon: createIcon('move-horizontal')
    },
    {
      id: 'hideRow',
      label: '隐藏行',
      icon: createIcon('eye-off')
    },
    {
      id: 'hideCol',
      label: '隐藏列',
      icon: createIcon('eye-off')
    },
    {
      id: 'showHiddenRows',
      label: '显示隐藏的行',
      icon: createIcon('eye')
    },
    {
      id: 'showHiddenCols',
      label: '显示隐藏的列',
      icon: createIcon('eye'),
      divider: true
    },

    // 合并单元格
    {
      id: 'merge',
      label: '合并单元格',
      icon: createIcon('merge'),
      children: [
        { id: 'mergeAll', label: '合并所有单元格' },
        { id: 'mergeHorizontal', label: '横向合并' },
        { id: 'mergeVertical', label: '纵向合并' },
        { id: 'unmergeCells', label: '取消合并' }
      ],
      divider: true
    },

    // 排序和筛选
    {
      id: 'sort',
      label: '排序',
      icon: createIcon('sort-asc'),
      children: [
        { id: 'sortAsc', label: '升序排列 A→Z', icon: createIcon('sort-asc') },
        { id: 'sortDesc', label: '降序排列 Z→A', icon: createIcon('sort-desc') },
        { id: 'customSort', label: '自定义排序...' }
      ]
    },
    {
      id: 'filter',
      label: '筛选',
      icon: createIcon('filter'),
      children: [
        { id: 'addFilter', label: '添加筛选' },
        { id: 'clearFilter', label: '清除筛选' },
        { id: 'reapplyFilter', label: '重新应用筛选' }
      ],
      divider: true
    },

    // 数据操作
    {
      id: 'insertComment',
      label: '插入批注',
      icon: createIcon('message-square')
    },
    {
      id: 'insertLink',
      label: '插入链接',
      icon: createIcon('link'),
      shortcut: 'Ctrl+K'
    },
    {
      id: 'insertImage',
      label: '插入图片',
      icon: createIcon('image')
    },
    {
      id: 'insertChart',
      label: '插入图表',
      icon: createIcon('bar-chart'),
      divider: true
    },

    // 数据验证
    {
      id: 'dataValidation',
      label: '数据验证',
      icon: createIcon('check-square'),
      children: [
        { id: 'addValidation', label: '设置数据验证...' },
        { id: 'clearValidation', label: '清除数据验证' },
        { id: 'circleInvalid', label: '圈释无效数据' }
      ]
    },
    {
      id: 'conditionalFormat',
      label: '条件格式',
      icon: createIcon('palette'),
      children: [
        { id: 'highlightCells', label: '突出显示单元格规则' },
        { id: 'topBottom', label: '项目选取规则' },
        { id: 'dataBars', label: '数据条' },
        { id: 'colorScales', label: '色阶' },
        { id: 'iconSets', label: '图标集' },
        { id: 'newRule', label: '新建规则...' },
        { id: 'clearRules', label: '清除规则' },
        { id: 'manageRules', label: '管理规则...' }
      ]
    }
  ];
}
