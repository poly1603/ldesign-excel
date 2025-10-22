/**
 * 协作系统
 * 支持多人实时协作编辑
 */

import { logger } from '../errors';
import type { CollaborationConfig } from '../types';

/**
 * 用户状态
 */
export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  IDLE = 'idle',
}

/**
 * 操作类型
 */
export enum CollabOperationType {
  CELL_EDIT = 'cell_edit',
  SELECTION_CHANGE = 'selection_change',
  CURSOR_MOVE = 'cursor_move',
  USER_JOIN = 'user_join',
  USER_LEAVE = 'user_leave',
  LOCK_CELL = 'lock_cell',
  UNLOCK_CELL = 'unlock_cell',
}

/**
 * 用户信息
 */
export interface CollabUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  status: UserStatus;
  cursor?: {
    sheetIndex: number;
    row: number;
    col: number;
  };
  selection?: {
    sheetIndex: number;
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  };
  lastActivity: number;
}

/**
 * 协作操作
 */
export interface CollabOperation {
  id: string;
  type: CollabOperationType;
  userId: string;
  timestamp: number;
  sheetIndex: number;
  data: any;
}

/**
 * 冲突解决策略
 */
export enum ConflictStrategy {
  /** 最后写入获胜 */
  LAST_WRITE_WINS = 'last_write_wins',
  /** 先到先得 */
  FIRST_COME_FIRST_SERVED = 'first_come_first_served',
  /** 手动解决 */
  MANUAL = 'manual',
}

/**
 * 协作管理器
 */
export class CollaborationManager {
  private config: CollaborationConfig;
  private ws: WebSocket | null = null;
  private users: Map<string, CollabUser> = new Map();
  private operations: CollabOperation[] = [];
  private currentUser: CollabUser | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private conflictStrategy: ConflictStrategy = ConflictStrategy.LAST_WRITE_WINS;
  private lockedCells: Map<string, string> = new Map(); // cellRef -> userId

  constructor(config: CollaborationConfig) {
    this.config = {
      enabled: config.enabled !== false,
      heartbeatInterval: config.heartbeatInterval || 30000,
      autoReconnect: config.autoReconnect !== false,
      ...config,
    };

    if (this.config.user) {
      this.currentUser = {
        ...this.config.user,
        color: this.config.user.color || this.generateRandomColor(),
        status: UserStatus.ONLINE,
        lastActivity: Date.now(),
      };
    }

    logger.info('Collaboration manager initialized', {
      enabled: this.config.enabled,
      user: this.currentUser?.name,
    });
  }

  /**
   * 连接到协作服务器
   */
  connect(): Promise<void> {
    if (!this.config.url) {
      return Promise.reject(new Error('WebSocket URL not configured'));
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url!);

        this.ws.onopen = () => {
          logger.info('WebSocket connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();

          // 发送用户加入消息
          if (this.currentUser) {
            this.sendOperation({
              type: CollabOperationType.USER_JOIN,
              data: this.currentUser,
            });
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          logger.error('WebSocket error', error as any);
          reject(error);
        };

        this.ws.onclose = () => {
          logger.warn('WebSocket closed');
          this.stopHeartbeat();

          if (this.config.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.ws) {
      // 发送用户离开消息
      if (this.currentUser) {
        this.sendOperation({
          type: CollabOperationType.USER_LEAVE,
          data: { userId: this.currentUser.id },
        });
      }

      this.ws.close();
      this.ws = null;
      this.stopHeartbeat();
      logger.info('WebSocket disconnected');
    }
  }

  /**
   * 重新连接
   */
  private async reconnect(): Promise<void> {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      await this.connect();
    } catch (error) {
      logger.error('Reconnect failed', error as Error);
    }
  }

  /**
   * 发送操作
   */
  sendOperation(operation: Omit<CollabOperation, 'id' | 'userId' | 'timestamp' | 'sheetIndex'> & { sheetIndex?: number }): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.currentUser) {
      logger.warn('Cannot send operation: not connected');
      return;
    }

    const op: CollabOperation = {
      ...operation,
      id: this.generateOperationId(),
      userId: this.currentUser.id,
      timestamp: Date.now(),
      sheetIndex: operation.sheetIndex || 0,
    };

    this.ws.send(JSON.stringify(op));
    this.operations.push(op);

    logger.debug('Operation sent', { type: op.type, id: op.id });
  }

  /**
   * 处理消息
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case CollabOperationType.USER_JOIN:
          this.handleUserJoin(message.data);
          break;

        case CollabOperationType.USER_LEAVE:
          this.handleUserLeave(message.data.userId);
          break;

        case CollabOperationType.CELL_EDIT:
          this.handleCellEdit(message);
          break;

        case CollabOperationType.SELECTION_CHANGE:
          this.handleSelectionChange(message);
          break;

        case CollabOperationType.CURSOR_MOVE:
          this.handleCursorMove(message);
          break;

        case CollabOperationType.LOCK_CELL:
          this.handleLockCell(message);
          break;

        case CollabOperationType.UNLOCK_CELL:
          this.handleUnlockCell(message);
          break;

        default:
          logger.warn('Unknown message type', { type: message.type });
      }
    } catch (error) {
      logger.error('Failed to handle message', error as Error);
    }
  }

  /**
   * 处理用户加入
   */
  private handleUserJoin(user: CollabUser): void {
    this.users.set(user.id, user);
    logger.info('User joined', { userId: user.id, name: user.name });
  }

  /**
   * 处理用户离开
   */
  private handleUserLeave(userId: string): void {
    this.users.delete(userId);

    // 解锁该用户锁定的所有单元格
    this.lockedCells.forEach((lockUserId, cellRef) => {
      if (lockUserId === userId) {
        this.lockedCells.delete(cellRef);
      }
    });

    logger.info('User left', { userId });
  }

  /**
   * 处理单元格编辑
   */
  private handleCellEdit(operation: CollabOperation): void {
    // 检查冲突
    const cellRef = `${operation.sheetIndex},${operation.data.row},${operation.data.col}`;
    const lockUserId = this.lockedCells.get(cellRef);

    if (lockUserId && lockUserId !== operation.userId) {
      logger.warn('Cell edit conflict detected', { cellRef, userId: operation.userId });
      // 根据策略处理冲突
      return;
    }

    // 应用编辑
    logger.debug('Cell edit received', operation.data);
  }

  /**
   * 处理选区变化
   */
  private handleSelectionChange(operation: CollabOperation): void {
    const user = this.users.get(operation.userId);
    if (user) {
      user.selection = operation.data;
      user.lastActivity = Date.now();
    }
  }

  /**
   * 处理光标移动
   */
  private handleCursorMove(operation: CollabOperation): void {
    const user = this.users.get(operation.userId);
    if (user) {
      user.cursor = operation.data;
      user.lastActivity = Date.now();
    }
  }

  /**
   * 处理单元格锁定
   */
  private handleLockCell(operation: CollabOperation): void {
    const cellRef = operation.data.cellRef;
    this.lockedCells.set(cellRef, operation.userId);
    logger.debug('Cell locked', { cellRef, userId: operation.userId });
  }

  /**
   * 处理单元格解锁
   */
  private handleUnlockCell(operation: CollabOperation): void {
    const cellRef = operation.data.cellRef;
    this.lockedCells.delete(cellRef);
    logger.debug('Cell unlocked', { cellRef });
  }

  /**
   * 锁定单元格
   */
  lockCell(sheetIndex: number, row: number, col: number): boolean {
    if (!this.currentUser) {
      return false;
    }

    const cellRef = `${sheetIndex},${row},${col}`;

    if (this.lockedCells.has(cellRef)) {
      return false;
    }

    this.sendOperation({
      type: CollabOperationType.LOCK_CELL,
      sheetIndex,
      data: { cellRef },
    });

    return true;
  }

  /**
   * 解锁单元格
   */
  unlockCell(sheetIndex: number, row: number, col: number): boolean {
    if (!this.currentUser) {
      return false;
    }

    const cellRef = `${sheetIndex},${row},${col}`;

    this.sendOperation({
      type: CollabOperationType.UNLOCK_CELL,
      sheetIndex,
      data: { cellRef },
    });

    return true;
  }

  /**
   * 更新光标位置
   */
  updateCursor(sheetIndex: number, row: number, col: number): void {
    if (!this.currentUser) {
      return;
    }

    this.currentUser.cursor = { sheetIndex, row, col };

    this.sendOperation({
      type: CollabOperationType.CURSOR_MOVE,
      sheetIndex,
      data: { sheetIndex, row, col },
    });
  }

  /**
   * 更新选区
   */
  updateSelection(
    sheetIndex: number,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ): void {
    if (!this.currentUser) {
      return;
    }

    this.currentUser.selection = { sheetIndex, startRow, startCol, endRow, endCol };

    this.sendOperation({
      type: CollabOperationType.SELECTION_CHANGE,
      sheetIndex,
      data: { sheetIndex, startRow, startCol, endRow, endCol },
    });
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval || !this.config.heartbeatInterval) {
      return;
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.config.heartbeatInterval);

    logger.debug('Heartbeat started');
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      logger.debug('Heartbeat stopped');
    }
  }

  /**
   * 获取在线用户
   */
  getOnlineUsers(): CollabUser[] {
    return Array.from(this.users.values()).filter((u) => u.status === UserStatus.ONLINE);
  }

  /**
   * 获取所有用户
   */
  getAllUsers(): CollabUser[] {
    return Array.from(this.users.values());
  }

  /**
   * 检查单元格是否被锁定
   */
  isCellLocked(sheetIndex: number, row: number, col: number): { locked: boolean; userId?: string } {
    const cellRef = `${sheetIndex},${row},${col}`;
    const userId = this.lockedCells.get(cellRef);

    return {
      locked: userId !== undefined,
      userId,
    };
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    connected: boolean;
    totalUsers: number;
    onlineUsers: number;
    operations: number;
    lockedCells: number;
  } {
    return {
      connected: this.ws?.readyState === WebSocket.OPEN,
      totalUsers: this.users.size,
      onlineUsers: this.getOnlineUsers().length,
      operations: this.operations.length,
      lockedCells: this.lockedCells.size,
    };
  }

  /**
   * 生成操作ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成随机颜色
   */
  private generateRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.disconnect();
    this.users.clear();
    this.operations = [];
    this.lockedCells.clear();
    logger.info('Collaboration manager destroyed');
  }
}

