/**
 * 命令管理器
 * 负责执行命令、管理历史记录、支持撤销/重做
 */

import { ICommand } from './Command';
import type { CommandContext } from './Command';

export type { CommandContext };

export interface CommandManagerOptions {
  /** 最大历史记录数 */
  maxHistorySize?: number;
}

export class CommandManager {
  private context: CommandContext;
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];
  private maxHistorySize: number;
  private isExecuting = false;

  constructor(context: CommandContext, options: CommandManagerOptions = {}) {
    this.context = context;
    this.maxHistorySize = options.maxHistorySize ?? 100;
  }

  /**
   * 执行命令
   */
  execute(command: ICommand): void {
    if (this.isExecuting) return;

    this.isExecuting = true;
    try {
      command.execute(this.context);

      // 尝试与上一个命令合并
      const lastCommand = this.undoStack[this.undoStack.length - 1];
      if (lastCommand && command.canMerge?.(lastCommand)) {
        this.undoStack[this.undoStack.length - 1] = command.merge!(lastCommand);
      } else {
        this.undoStack.push(command);
      }

      // 限制历史记录大小
      if (this.undoStack.length > this.maxHistorySize) {
        this.undoStack.shift();
      }

      // 清空重做栈
      this.redoStack = [];
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * 撤销
   */
  undo(): boolean {
    if (!this.canUndo()) return false;

    this.isExecuting = true;
    try {
      const command = this.undoStack.pop()!;
      command.undo(this.context);
      this.redoStack.push(command);
      this.context.emit('undo', { command: command.name });
      this.context.render();
      return true;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * 重做
   */
  redo(): boolean {
    if (!this.canRedo()) return false;

    this.isExecuting = true;
    try {
      const command = this.redoStack.pop()!;
      command.execute(this.context);
      this.undoStack.push(command);
      this.context.emit('redo', { command: command.name });
      this.context.render();
      return true;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * 清空历史记录
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * 获取撤销栈大小
   */
  get undoStackSize(): number {
    return this.undoStack.length;
  }

  /**
   * 获取重做栈大小
   */
  get redoStackSize(): number {
    return this.redoStack.length;
  }
}
