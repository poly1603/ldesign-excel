/**
 * 电子表格核心模块导出
 */

// 主类
export { Spreadsheet } from './Spreadsheet';

// 类型
export * from './types';

// 命令系统
export * from './commands';

// 选区管理
export { SelectionManager, type SelectionManagerOptions } from './selection/SelectionManager';

// UI 组件
export { ContextMenu, createDefaultContextMenuItems, type MenuItem, type ContextMenuOptions } from './ui/ContextMenu';

// 剪贴板
export { ClipboardManager, type ClipboardData, type ClipboardManagerOptions } from './clipboard/ClipboardManager';
