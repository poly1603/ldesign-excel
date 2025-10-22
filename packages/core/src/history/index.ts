/**
 * 版本历史系统
 * 支持操作历史记录、撤销重做、版本快照
 */

import { logger } from '../errors';

/**
 * 操作类型
 */
export enum OperationType {
  /** 单元格编辑 */
  CELL_EDIT = 'cell_edit',
  /** 行插入 */
  ROW_INSERT = 'row_insert',
  /** 行删除 */
  ROW_DELETE = 'row_delete',
  /** 列插入 */
  COLUMN_INSERT = 'column_insert',
  /** 列删除 */
  COLUMN_DELETE = 'column_delete',
  /** 合并单元格 */
  MERGE_CELLS = 'merge_cells',
  /** 取消合并 */
  UNMERGE_CELLS = 'unmerge_cells',
  /** 样式修改 */
  STYLE_CHANGE = 'style_change',
  /** 批量操作 */
  BATCH = 'batch',
}

/**
 * 历史记录项
 */
export interface HistoryRecord {
  /** 记录ID */
  id: string;
  /** 操作类型 */
  type: OperationType;
  /** 时间戳 */
  timestamp: number;
  /** 工作表索引 */
  sheetIndex: number;
  /** 操作数据 */
  data: {
    /** 位置信息 */
    position?: { row: number; col: number };
    /** 旧值 */
    oldValue?: any;
    /** 新值 */
    newValue?: any;
    /** 额外信息 */
    extra?: Record<string, any>;
  };
  /** 用户信息 */
  user?: {
    id: string;
    name: string;
  };
  /** 描述 */
  description?: string;
}

/**
 * 版本快照
 */
export interface VersionSnapshot {
  /** 快照ID */
  id: string;
  /** 时间戳 */
  timestamp: number;
  /** 数据 */
  data: any;
  /** 标签 */
  label?: string;
  /** 描述 */
  description?: string;
  /** 用户 */
  user?: {
    id: string;
    name: string;
  };
}

/**
 * 历史管理器配置
 */
export interface HistoryManagerConfig {
  /** 最大历史记录数 */
  maxHistorySize?: number;
  /** 最大快照数 */
  maxSnapshots?: number;
  /** 是否启用自动快照 */
  autoSnapshot?: boolean;
  /** 自动快照间隔(秒) */
  snapshotInterval?: number;
}

/**
 * 历史管理器
 */
export class HistoryManager {
  private history: HistoryRecord[] = [];
  private currentIndex = -1;
  private snapshots: VersionSnapshot[] = [];
  private maxHistorySize: number;
  private maxSnapshots: number;
  private autoSnapshot: boolean;
  private snapshotInterval: number;
  private snapshotTimer: NodeJS.Timeout | null = null;
  private recordIdCounter = 0;

  constructor(config?: HistoryManagerConfig) {
    this.maxHistorySize = config?.maxHistorySize || 100;
    this.maxSnapshots = config?.maxSnapshots || 10;
    this.autoSnapshot = config?.autoSnapshot || false;
    this.snapshotInterval = config?.snapshotInterval || 300; // 5分钟

    if (this.autoSnapshot) {
      this.startAutoSnapshot();
    }

    logger.info('History manager initialized', {
      maxHistorySize: this.maxHistorySize,
      autoSnapshot: this.autoSnapshot,
    });
  }

  /**
   * 记录操作
   */
  record(record: Omit<HistoryRecord, 'id' | 'timestamp'>): void {
    // 如果当前不在历史末尾,删除后续历史
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // 添加新记录
    const newRecord: HistoryRecord = {
      ...record,
      id: this.generateRecordId(),
      timestamp: Date.now(),
    };

    this.history.push(newRecord);
    this.currentIndex++;

    // 限制历史大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }

    logger.debug('Operation recorded', {
      type: record.type,
      index: this.currentIndex,
      total: this.history.length,
    });
  }

  /**
   * 撤销
   */
  undo(): HistoryRecord | null {
    if (!this.canUndo()) {
      logger.debug('Cannot undo: at the beginning of history');
      return null;
    }

    const record = this.history[this.currentIndex];
    this.currentIndex--;

    logger.debug('Undo', { type: record.type, index: this.currentIndex });
    return record;
  }

  /**
   * 重做
   */
  redo(): HistoryRecord | null {
    if (!this.canRedo()) {
      logger.debug('Cannot redo: at the end of history');
      return null;
    }

    this.currentIndex++;
    const record = this.history[this.currentIndex];

    logger.debug('Redo', { type: record.type, index: this.currentIndex });
    return record;
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * 获取历史记录
   */
  getHistory(): HistoryRecord[] {
    return [...this.history];
  }

  /**
   * 获取指定范围的历史
   */
  getHistoryRange(start: number, end: number): HistoryRecord[] {
    return this.history.slice(start, end + 1);
  }

  /**
   * 清空历史
   */
  clearHistory(): void {
    this.history = [];
    this.currentIndex = -1;
    logger.info('History cleared');
  }

  /**
   * 创建快照
   */
  createSnapshot(data: any, label?: string, description?: string): VersionSnapshot {
    const snapshot: VersionSnapshot = {
      id: this.generateSnapshotId(),
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(data)), // 深拷贝
      label,
      description,
    };

    this.snapshots.push(snapshot);

    // 限制快照数量
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    logger.info('Snapshot created', {
      id: snapshot.id,
      label,
      total: this.snapshots.length,
    });

    return snapshot;
  }

  /**
   * 恢复快照
   */
  restoreSnapshot(snapshotId: string): any | null {
    const snapshot = this.snapshots.find((s) => s.id === snapshotId);

    if (!snapshot) {
      logger.warn(`Snapshot not found: ${snapshotId}`);
      return null;
    }

    logger.info('Snapshot restored', { id: snapshotId, label: snapshot.label });
    return JSON.parse(JSON.stringify(snapshot.data)); // 深拷贝
  }

  /**
   * 删除快照
   */
  deleteSnapshot(snapshotId: string): boolean {
    const index = this.snapshots.findIndex((s) => s.id === snapshotId);

    if (index > -1) {
      this.snapshots.splice(index, 1);
      logger.info('Snapshot deleted', { id: snapshotId });
      return true;
    }

    return false;
  }

  /**
   * 获取所有快照
   */
  getSnapshots(): VersionSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * 清空快照
   */
  clearSnapshots(): void {
    this.snapshots = [];
    logger.info('All snapshots cleared');
  }

  /**
   * 开始自动快照
   */
  private startAutoSnapshot(): void {
    if (this.snapshotTimer) {
      return;
    }

    this.snapshotTimer = setInterval(() => {
      // 这里需要外部提供数据
      logger.debug('Auto snapshot triggered');
    }, this.snapshotInterval * 1000);
  }

  /**
   * 停止自动快照
   */
  stopAutoSnapshot(): void {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
      logger.info('Auto snapshot stopped');
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    historySize: number;
    currentIndex: number;
    canUndo: boolean;
    canRedo: boolean;
    snapshotCount: number;
  } {
    return {
      historySize: this.history.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      snapshotCount: this.snapshots.length,
    };
  }

  /**
   * 生成记录ID
   */
  private generateRecordId(): string {
    return `record_${Date.now()}_${++this.recordIdCounter}`;
  }

  /**
   * 生成快照ID
   */
  private generateSnapshotId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 导出历史记录
   */
  exportHistory(): string {
    return JSON.stringify({
      history: this.history,
      currentIndex: this.currentIndex,
      snapshots: this.snapshots,
    }, null, 2);
  }

  /**
   * 导入历史记录
   */
  importHistory(json: string): boolean {
    try {
      const imported = JSON.parse(json);
      this.history = imported.history || [];
      this.currentIndex = imported.currentIndex || -1;
      this.snapshots = imported.snapshots || [];

      logger.info('History imported', {
        records: this.history.length,
        snapshots: this.snapshots.length,
      });

      return true;
    } catch (error) {
      logger.error('Failed to import history', error as Error);
      return false;
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopAutoSnapshot();
    this.clearHistory();
    this.clearSnapshots();
    logger.info('History manager destroyed');
  }
}


