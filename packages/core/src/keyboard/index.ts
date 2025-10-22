/**
 * 快捷键系统
 * 管理和处理键盘快捷键
 */

import { logger } from '../errors';
import type { KeyboardShortcut } from '../types';

/**
 * 快捷键管理器
 */
export class KeyboardManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private enabled = true;
  private listening = false;

  constructor() {
    this.registerDefaultShortcuts();
  }

  /**
   * 注册默认快捷键
   */
  private registerDefaultShortcuts(): void {
    // 编辑操作
    this.register({
      key: 'z',
      modifiers: { ctrl: true },
      handler: () => this.triggerAction('undo'),
      description: '撤销',
    });

    this.register({
      key: 'y',
      modifiers: { ctrl: true },
      handler: () => this.triggerAction('redo'),
      description: '重做',
    });

    this.register({
      key: 'c',
      modifiers: { ctrl: true },
      handler: () => this.triggerAction('copy'),
      description: '复制',
    });

    this.register({
      key: 'x',
      modifiers: { ctrl: true },
      handler: () => this.triggerAction('cut'),
      description: '剪切',
    });

    this.register({
      key: 'v',
      modifiers: { ctrl: true },
      handler: () => this.triggerAction('paste'),
      description: '粘贴',
    });

    this.register({
      key: 'a',
      modifiers: { ctrl: true },
      handler: () => this.triggerAction('selectAll'),
      description: '全选',
    });

    // 查找替换
    this.register({
      key: 'f',
      modifiers: { ctrl: true },
      handler: () => this.triggerAction('find'),
      description: '查找',
    });

    this.register({
      key: 'h',
      modifiers: { ctrl: true },
      handler: () => this.triggerAction('replace'),
      description: '替换',
    });

    // 保存
    this.register({
      key: 's',
      modifiers: { ctrl: true },
      handler: () => this.triggerAction('save'),
      description: '保存',
    });

    // 删除
    this.register({
      key: 'Delete',
      modifiers: {},
      handler: () => this.triggerAction('delete'),
      description: '删除',
    });

    // 导航
    this.register({
      key: 'Home',
      modifiers: { ctrl: true },
      handler: () => this.triggerAction('goToStart'),
      description: '跳到开始',
    });

    this.register({
      key: 'End',
      modifiers: { ctrl: true },
      handler: () => this.triggerAction('goToEnd'),
      description: '跳到结束',
    });

    // 格式化
    this.register({
      key: 'b',
      modifiers: { ctrl: true },
      handler: () => this.triggerAction('bold'),
      description: '加粗',
    });

    this.register({
      key: 'i',
      modifiers: { ctrl: true },
      handler: () => this.triggerAction('italic'),
      description: '斜体',
    });

    this.register({
      key: 'u',
      modifiers: { ctrl: true },
      handler: () => this.triggerAction('underline'),
      description: '下划线',
    });

    // Enter键
    this.register({
      key: 'Enter',
      modifiers: {},
      handler: () => this.triggerAction('confirm'),
      description: '确认',
    });

    // Escape键
    this.register({
      key: 'Escape',
      modifiers: {},
      handler: () => this.triggerAction('cancel'),
      description: '取消',
    });

    logger.info(`Registered ${this.shortcuts.size} default shortcuts`);
  }

  /**
   * 注册快捷键
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
    logger.debug(`Shortcut registered: ${key}`);
  }

  /**
   * 取消注册快捷键
   */
  unregister(shortcut: KeyboardShortcut | string): boolean {
    const key = typeof shortcut === 'string' ? shortcut : this.getShortcutKey(shortcut);
    const deleted = this.shortcuts.delete(key);

    if (deleted) {
      logger.debug(`Shortcut unregistered: ${key}`);
    }

    return deleted;
  }

  /**
   * 获取快捷键标识
   */
  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.modifiers?.ctrl) parts.push('Ctrl');
    if (shortcut.modifiers?.shift) parts.push('Shift');
    if (shortcut.modifiers?.alt) parts.push('Alt');
    if (shortcut.modifiers?.meta) parts.push('Meta');

    parts.push(shortcut.key);

    return parts.join('+');
  }

  /**
   * 开始监听
   */
  startListening(element: HTMLElement = document.body): void {
    if (this.listening) {
      return;
    }

    element.addEventListener('keydown', this.handleKeyDown);
    this.listening = true;
    logger.info('Keyboard manager started listening');
  }

  /**
   * 停止监听
   */
  stopListening(element: HTMLElement = document.body): void {
    if (!this.listening) {
      return;
    }

    element.removeEventListener('keydown', this.handleKeyDown);
    this.listening = false;
    logger.info('Keyboard manager stopped listening');
  }

  /**
   * 处理按键事件
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled) {
      return;
    }

    // 构建当前按键组合
    const parts: string[] = [];

    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.shiftKey) parts.push('Shift');
    if (event.altKey) parts.push('Alt');
    if (event.metaKey && !event.ctrlKey) parts.push('Meta');

    parts.push(event.key);

    const key = parts.join('+');
    const shortcut = this.shortcuts.get(key);

    if (shortcut && !shortcut.disabled) {
      logger.debug(`Shortcut triggered: ${key}`);

      const result = shortcut.handler(event);

      // 如果处理函数返回 false，阻止默认行为
      if (result === false || result === undefined) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  };

  /**
   * 触发动作（需要外部实现）
   */
  private triggerAction(action: string): boolean {
    logger.debug(`Action triggered: ${action}`);
    // 这里应该触发相应的事件或调用回调
    // 实际实现应该通过事件系统或回调机制
    return false;
  }

  /**
   * 启用/禁用快捷键
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info(`Keyboard manager ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 禁用特定快捷键
   */
  disableShortcut(key: string): void {
    const shortcut = this.shortcuts.get(key);
    if (shortcut) {
      shortcut.disabled = true;
      logger.debug(`Shortcut disabled: ${key}`);
    }
  }

  /**
   * 启用特定快捷键
   */
  enableShortcut(key: string): void {
    const shortcut = this.shortcuts.get(key);
    if (shortcut) {
      shortcut.disabled = false;
      logger.debug(`Shortcut enabled: ${key}`);
    }
  }

  /**
   * 获取所有快捷键
   */
  getAllShortcuts(): Map<string, KeyboardShortcut> {
    return new Map(this.shortcuts);
  }

  /**
   * 获取快捷键列表（格式化）
   */
  getShortcutList(): Array<{ key: string; description: string; disabled: boolean }> {
    const list: Array<{ key: string; description: string; disabled: boolean }> = [];

    this.shortcuts.forEach((shortcut, key) => {
      list.push({
        key,
        description: shortcut.description || '',
        disabled: shortcut.disabled || false,
      });
    });

    return list.sort((a, b) => a.key.localeCompare(b.key));
  }

  /**
   * 检查快捷键是否已注册
   */
  hasShortcut(key: string): boolean {
    return this.shortcuts.has(key);
  }

  /**
   * 清空所有快捷键
   */
  clear(): void {
    this.shortcuts.clear();
    logger.info('All shortcuts cleared');
  }

  /**
   * 重置为默认快捷键
   */
  reset(): void {
    this.clear();
    this.registerDefaultShortcuts();
    logger.info('Shortcuts reset to defaults');
  }

  /**
   * 导出快捷键配置
   */
  export(): Record<string, any> {
    const config: Record<string, any> = {};

    this.shortcuts.forEach((shortcut, key) => {
      config[key] = {
        key: shortcut.key,
        modifiers: shortcut.modifiers,
        description: shortcut.description,
        disabled: shortcut.disabled,
      };
    });

    return config;
  }

  /**
   * 导入快捷键配置
   */
  import(config: Record<string, any>): void {
    this.clear();

    Object.entries(config).forEach(([_, value]) => {
      if (value.key) {
        this.register({
          key: value.key,
          modifiers: value.modifiers,
          handler: () => false, // 需要重新绑定处理函数
          description: value.description,
          disabled: value.disabled,
        });
      }
    });

    logger.info(`Imported ${this.shortcuts.size} shortcuts`);
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopListening();
    this.clear();
  }
}

/**
 * 全局快捷键管理器实例
 */
let globalKeyboardManager: KeyboardManager | null = null;

/**
 * 获取全局快捷键管理器
 */
export function getKeyboardManager(): KeyboardManager {
  if (!globalKeyboardManager) {
    globalKeyboardManager = new KeyboardManager();
  }
  return globalKeyboardManager;
}

/**
 * 销毁全局快捷键管理器
 */
export function destroyKeyboardManager(): void {
  if (globalKeyboardManager) {
    globalKeyboardManager.destroy();
    globalKeyboardManager = null;
  }
}


