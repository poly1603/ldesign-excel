/**
 * 单元格右键菜单组件
 * 提供完整的电子表格右键菜单功能
 */

import { createIcon } from './Icons';

export interface CellContextMenuAction {
  /** 操作 ID */
  id: string;
  /** 操作参数 */
  params?: Record<string, unknown>;
}

export interface CellInfo {
  /** 行索引 */
  row: number;
  /** 列索引 */
  col: number;
  /** 单元格地址 */
  address: string;
  /** 单元格值 */
  value?: string;
  /** 是否有选区 */
  hasSelection?: boolean;
  /** 选区范围 */
  selectionBounds?: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  };
}

export interface CellContextMenuOptions {
  /** 操作回调 */
  onAction?: (action: CellContextMenuAction, cellInfo: CellInfo) => void;
  /** 是否只读 */
  readonly?: boolean;
  /** 自定义菜单项 */
  customItems?: ContextMenuItem[];
}

export interface ContextMenuItem {
  /** 菜单项 ID */
  id: string;
  /** 显示文本 */
  label: string;
  /** 图标 */
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
  children?: ContextMenuItem[];
  /** 点击回调 */
  onClick?: (cellInfo: CellInfo) => void;
}

/**
 * 单元格右键菜单
 */
export class CellContextMenu {
  private options: Required<CellContextMenuOptions>;
  private menuElement: HTMLElement | null = null;
  private subMenus: HTMLElement[] = [];
  private currentCellInfo: CellInfo | null = null;

  constructor(options: CellContextMenuOptions = {}) {
    this.options = {
      onAction: () => { },
      readonly: false,
      customItems: [],
      ...options
    };

    this.init();
  }

  private init(): void {
    // 全局点击关闭菜单
    document.addEventListener('click', this.handleDocumentClick.bind(this));
    document.addEventListener('contextmenu', this.handleDocumentContextMenu.bind(this));
    window.addEventListener('blur', () => this.hide());
    window.addEventListener('resize', () => this.hide());
    window.addEventListener('scroll', () => this.hide(), true);
  }

  private handleDocumentClick(e: MouseEvent): void {
    if (this.menuElement && !this.menuElement.contains(e.target as Node)) {
      this.hide();
    }
  }

  private handleDocumentContextMenu(_e: MouseEvent): void {
    // 右键时关闭现有菜单
    if (this.menuElement) {
      this.hide();
    }
  }

  /**
   * 显示菜单
   */
  show(x: number, y: number, cellInfo: CellInfo): void {
    this.currentCellInfo = cellInfo;
    this.hide();

    const items = this.getMenuItems(cellInfo);
    this.menuElement = this.createMenu(items);
    document.body.appendChild(this.menuElement);

    // 调整位置确保在可视区域内
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
  }

  /**
   * 隐藏菜单
   */
  hide(): void {
    if (this.menuElement) {
      this.menuElement.remove();
      this.menuElement = null;
    }
    this.subMenus.forEach(sub => sub.remove());
    this.subMenus = [];
    this.currentCellInfo = null;
  }

  /**
   * 获取菜单项
   */
  private getMenuItems(cellInfo: CellInfo): ContextMenuItem[] {
    const icon = (name: string) => createIcon(name, 16);
    const readonly = this.options.readonly;
    const bounds = cellInfo.selectionBounds;
    const isMultiCell = bounds && (bounds.endRow > bounds.startRow || bounds.endCol > bounds.startCol);

    const items: ContextMenuItem[] = [
      // 剪贴板操作
      {
        id: 'cut',
        label: '剪切',
        icon: icon('scissors'),
        shortcut: 'Ctrl+X',
        disabled: readonly
      },
      {
        id: 'copy',
        label: '复制',
        icon: icon('copy'),
        shortcut: 'Ctrl+C'
      },
      {
        id: 'paste',
        label: '粘贴',
        icon: icon('clipboard'),
        shortcut: 'Ctrl+V',
        disabled: readonly
      },
      {
        id: 'pasteSpecial',
        label: '选择性粘贴',
        icon: icon('clipboard-list'),
        shortcut: 'Ctrl+Shift+V',
        disabled: readonly,
        children: [
          { id: 'pasteValues', label: '仅粘贴值', disabled: readonly },
          { id: 'pasteFormulas', label: '仅粘贴公式', disabled: readonly },
          { id: 'pasteFormats', label: '仅粘贴格式', disabled: readonly },
          { id: 'pasteColumnWidth', label: '粘贴列宽', disabled: readonly },
          { id: 'pasteTranspose', label: '转置粘贴', disabled: readonly }
        ],
        divider: true
      },

      // 插入操作
      {
        id: 'insert',
        label: '插入',
        icon: icon('plus'),
        disabled: readonly,
        children: [
          { id: 'insertRowAbove', label: '在上方插入 1 行', disabled: readonly },
          { id: 'insertRowBelow', label: '在下方插入 1 行', disabled: readonly },
          { id: 'insertRowsAbove', label: '在上方插入多行...', disabled: readonly },
          { id: 'insertRowsBelow', label: '在下方插入多行...', disabled: readonly },
          { id: 'divider1', label: '', divider: true },
          { id: 'insertColLeft', label: '在左侧插入 1 列', disabled: readonly },
          { id: 'insertColRight', label: '在右侧插入 1 列', disabled: readonly },
          { id: 'insertColsLeft', label: '在左侧插入多列...', disabled: readonly },
          { id: 'insertColsRight', label: '在右侧插入多列...', disabled: readonly },
          { id: 'divider2', label: '', divider: true },
          { id: 'insertCells', label: '插入单元格...', disabled: readonly }
        ]
      },
      {
        id: 'delete',
        label: '删除',
        icon: icon('trash'),
        disabled: readonly,
        children: [
          { id: 'deleteRow', label: '删除行', disabled: readonly },
          { id: 'deleteCol', label: '删除列', disabled: readonly },
          { id: 'deleteCells', label: '删除单元格...', disabled: readonly }
        ],
        divider: true
      },

      // 清除操作
      {
        id: 'clear',
        label: '清除',
        icon: icon('eraser'),
        disabled: readonly,
        children: [
          { id: 'clearContents', label: '清除内容', shortcut: 'Delete', disabled: readonly },
          { id: 'clearFormats', label: '清除格式', disabled: readonly },
          { id: 'clearComments', label: '清除批注', disabled: readonly },
          { id: 'clearHyperlinks', label: '清除超链接', disabled: readonly },
          { id: 'clearAll', label: '全部清除', disabled: readonly }
        ],
        divider: true
      },

      // 格式操作
      {
        id: 'formatCells',
        label: '设置单元格格式',
        icon: icon('settings'),
        shortcut: 'Ctrl+1',
        disabled: readonly
      },
      {
        id: 'rowHeight',
        label: '行高...',
        icon: icon('move-vertical'),
        disabled: readonly
      },
      {
        id: 'colWidth',
        label: '列宽...',
        icon: icon('move-horizontal'),
        disabled: readonly
      },
      {
        id: 'hideRow',
        label: '隐藏行',
        icon: icon('eye-off'),
        disabled: readonly
      },
      {
        id: 'hideCol',
        label: '隐藏列',
        icon: icon('eye-off'),
        disabled: readonly
      },
      {
        id: 'showHiddenRows',
        label: '显示隐藏的行',
        icon: icon('eye'),
        disabled: readonly
      },
      {
        id: 'showHiddenCols',
        label: '显示隐藏的列',
        icon: icon('eye'),
        disabled: readonly,
        divider: true
      },

      // 合并单元格
      {
        id: 'merge',
        label: '合并单元格',
        icon: icon('merge'),
        disabled: readonly || !isMultiCell,
        children: [
          { id: 'mergeAll', label: '合并所有单元格', disabled: readonly || !isMultiCell },
          { id: 'mergeHorizontal', label: '横向合并', disabled: readonly || !isMultiCell },
          { id: 'mergeVertical', label: '纵向合并', disabled: readonly || !isMultiCell },
          { id: 'unmergeCells', label: '取消合并', disabled: readonly }
        ],
        divider: true
      },

      // 排序和筛选
      {
        id: 'sort',
        label: '排序',
        icon: icon('sort-asc'),
        disabled: readonly,
        children: [
          { id: 'sortAsc', label: '升序排列 A→Z', icon: icon('sort-asc'), disabled: readonly },
          { id: 'sortDesc', label: '降序排列 Z→A', icon: icon('sort-desc'), disabled: readonly },
          { id: 'customSort', label: '自定义排序...', disabled: readonly }
        ]
      },
      {
        id: 'filter',
        label: '筛选',
        icon: icon('filter'),
        disabled: readonly,
        children: [
          { id: 'addFilter', label: '添加筛选', disabled: readonly },
          { id: 'clearFilter', label: '清除筛选', disabled: readonly },
          { id: 'reapplyFilter', label: '重新应用筛选', disabled: readonly }
        ],
        divider: true
      },

      // 数据操作
      {
        id: 'insertComment',
        label: '插入批注',
        icon: icon('message-square'),
        disabled: readonly
      },
      {
        id: 'insertLink',
        label: '插入链接',
        icon: icon('link'),
        shortcut: 'Ctrl+K',
        disabled: readonly
      },
      {
        id: 'insertImage',
        label: '插入图片',
        icon: icon('image'),
        disabled: readonly
      },
      {
        id: 'insertChart',
        label: '插入图表',
        icon: icon('bar-chart'),
        disabled: readonly,
        divider: true
      },

      // 数据验证和条件格式
      {
        id: 'dataValidation',
        label: '数据验证',
        icon: icon('check-square'),
        disabled: readonly,
        children: [
          { id: 'addValidation', label: '设置数据验证...', disabled: readonly },
          { id: 'clearValidation', label: '清除数据验证', disabled: readonly },
          { id: 'circleInvalid', label: '圈释无效数据', disabled: readonly }
        ]
      },
      {
        id: 'conditionalFormat',
        label: '条件格式',
        icon: icon('palette'),
        disabled: readonly,
        children: [
          { id: 'highlightCells', label: '突出显示单元格规则', disabled: readonly },
          { id: 'topBottom', label: '项目选取规则', disabled: readonly },
          { id: 'dataBars', label: '数据条', disabled: readonly },
          { id: 'colorScales', label: '色阶', disabled: readonly },
          { id: 'iconSets', label: '图标集', disabled: readonly },
          { id: 'newRule', label: '新建规则...', disabled: readonly },
          { id: 'clearRules', label: '清除规则', disabled: readonly },
          { id: 'manageRules', label: '管理规则...', disabled: readonly }
        ]
      }
    ];

    // 添加自定义菜单项
    if (this.options.customItems.length > 0) {
      items.push({ id: 'customDivider', label: '', divider: true });
      items.push(...this.options.customItems);
    }

    return items.filter(item => !item.hidden);
  }

  /**
   * 创建菜单元素
   */
  private createMenu(items: ContextMenuItem[]): HTMLElement {
    const menu = document.createElement('div');
    menu.className = 'cell-context-menu';
    menu.style.cssText = `
      position: fixed;
      min-width: 200px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      padding: 6px 0;
      z-index: 99999;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    items.forEach(item => {
      if (item.hidden) return;

      const menuItem = this.createMenuItem(item);
      menu.appendChild(menuItem);

      if (item.divider) {
        const divider = document.createElement('div');
        divider.className = 'menu-divider';
        divider.style.cssText = `
          height: 1px;
          background: #e8e8e8;
          margin: 6px 0;
        `;
        menu.appendChild(divider);
      }
    });

    return menu;
  }

  /**
   * 创建菜单项元素
   */
  private createMenuItem(item: ContextMenuItem): HTMLElement {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    menuItem.dataset.id = item.id;
    menuItem.style.cssText = `
      display: flex;
      align-items: center;
      padding: 8px 16px;
      cursor: ${item.disabled ? 'not-allowed' : 'pointer'};
      color: ${item.disabled ? '#bbb' : '#333'};
      transition: background 0.1s;
      position: relative;
    `;

    // 图标
    const iconSlot = document.createElement('span');
    iconSlot.className = 'menu-item-icon';
    iconSlot.innerHTML = item.icon || '';
    iconSlot.style.cssText = `
      width: 20px;
      height: 16px;
      margin-right: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${item.disabled ? '#ccc' : '#666'};
    `;
    menuItem.appendChild(iconSlot);

    // 文本
    const label = document.createElement('span');
    label.className = 'menu-item-label';
    label.textContent = item.label;
    label.style.cssText = 'flex: 1;';
    menuItem.appendChild(label);

    // 快捷键
    if (item.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.className = 'menu-item-shortcut';
      shortcut.textContent = item.shortcut;
      shortcut.style.cssText = `
        color: #999;
        font-size: 12px;
        margin-left: 20px;
      `;
      menuItem.appendChild(shortcut);
    }

    // 子菜单箭头
    const hasChildren = item.children && item.children.length > 0;
    if (hasChildren) {
      const arrow = document.createElement('span');
      arrow.className = 'menu-item-arrow';
      arrow.textContent = '▸';
      arrow.style.cssText = `
        font-size: 10px;
        color: #999;
        margin-left: 8px;
      `;
      menuItem.appendChild(arrow);
    }

    // 事件处理
    let subMenu: HTMLElement | null = null;
    let hideTimeout: ReturnType<typeof setTimeout> | null = null;

    if (!item.disabled) {
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.background = '#f5f7fa';

        // 显示子菜单
        if (hasChildren && item.children) {
          if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
          }

          if (!subMenu) {
            subMenu = this.createSubMenu(item.children, menuItem);
            this.subMenus.push(subMenu);
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
          }, 150);
        }
      });

      // 点击执行操作
      if (!hasChildren) {
        menuItem.addEventListener('click', (e) => {
          e.stopPropagation();

          if (item.onClick && this.currentCellInfo) {
            item.onClick(this.currentCellInfo);
          }

          this.options.onAction?.({ id: item.id }, this.currentCellInfo!);
          this.hide();
        });
      }
    }

    return menuItem;
  }

  /**
   * 创建子菜单
   */
  private createSubMenu(items: ContextMenuItem[], parentItem: HTMLElement): HTMLElement {
    const subMenu = document.createElement('div');
    subMenu.className = 'cell-context-submenu';
    subMenu.style.cssText = `
      position: fixed;
      min-width: 180px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      padding: 6px 0;
      z-index: 100000;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: none;
    `;

    // 定位
    const rect = parentItem.getBoundingClientRect();
    let left = rect.right - 4;
    let top = rect.top;

    // 检查是否超出视口
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 先添加获取尺寸
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
    items.forEach(item => {
      if (item.hidden) return;

      // 跳过纯分隔项
      if (item.id.startsWith('divider')) {
        const divider = document.createElement('div');
        divider.className = 'menu-divider';
        divider.style.cssText = `
          height: 1px;
          background: #e8e8e8;
          margin: 6px 0;
        `;
        subMenu.appendChild(divider);
        return;
      }

      const menuItem = this.createMenuItem(item);
      subMenu.appendChild(menuItem);

      if (item.divider) {
        const divider = document.createElement('div');
        divider.className = 'menu-divider';
        divider.style.cssText = `
          height: 1px;
          background: #e8e8e8;
          margin: 6px 0;
        `;
        subMenu.appendChild(divider);
      }
    });

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
   * 设置只读模式
   */
  setReadonly(readonly: boolean): void {
    this.options.readonly = readonly;
  }

  /**
   * 添加自定义菜单项
   */
  addCustomItem(item: ContextMenuItem): void {
    this.options.customItems.push(item);
  }

  /**
   * 移除自定义菜单项
   */
  removeCustomItem(id: string): void {
    const index = this.options.customItems.findIndex(item => item.id === id);
    if (index !== -1) {
      this.options.customItems.splice(index, 1);
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.hide();
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
    document.removeEventListener('contextmenu', this.handleDocumentContextMenu.bind(this));
  }
}

/**
 * 创建默认的单元格右键菜单
 */
export function createCellContextMenu(options?: CellContextMenuOptions): CellContextMenu {
  return new CellContextMenu(options);
}
