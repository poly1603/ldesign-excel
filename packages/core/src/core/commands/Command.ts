/**
 * 命令模式基类
 * 所有可撤销的操作都通过命令实现
 */

import type { WorkbookData, SheetData } from '../types';

export interface CommandContext {
  /** 获取工作簿数据 */
  getWorkbook(): WorkbookData;
  /** 获取当前工作表 */
  getActiveSheet(): SheetData;
  /** 触发重新渲染 */
  render(): void;
  /** 触发事件 */
  emit(event: string, data?: unknown): void;
}

/**
 * 命令接口
 */
export interface ICommand {
  /** 命令名称 */
  readonly name: string;
  /** 命令描述（用于显示） */
  readonly description?: string;
  /** 执行命令 */
  execute(context: CommandContext): void;
  /** 撤销命令 */
  undo(context: CommandContext): void;
  /** 是否可以合并（用于连续输入等场景） */
  canMerge?(other: ICommand): boolean;
  /** 合并命令 */
  merge?(other: ICommand): ICommand;
}

/**
 * 命令基类
 */
export abstract class BaseCommand implements ICommand {
  abstract readonly name: string;
  description?: string;

  abstract execute(context: CommandContext): void;
  abstract undo(context: CommandContext): void;

  canMerge(_other: ICommand): boolean {
    return false;
  }

  merge(_other: ICommand): ICommand {
    return this;
  }
}

/**
 * 复合命令（批量操作）
 */
export class CompositeCommand extends BaseCommand {
  readonly name = 'composite';
  private commands: ICommand[] = [];

  constructor(commands: ICommand[] = []) {
    super();
    this.commands = commands;
  }

  add(command: ICommand): void {
    this.commands.push(command);
  }

  execute(context: CommandContext): void {
    for (const cmd of this.commands) {
      cmd.execute(context);
    }
  }

  undo(context: CommandContext): void {
    // 反向撤销
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo(context);
    }
  }

  get isEmpty(): boolean {
    return this.commands.length === 0;
  }
}
