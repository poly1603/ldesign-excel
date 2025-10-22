/**
 * Web Worker 池管理器
 * 管理多个 Worker 实例,支持并发任务处理
 */

import { logger } from '../errors';
import { WorkerMessageType, WorkerResponseType } from './excel-parser.worker';

/**
 * Worker 任务接口
 */
interface WorkerTask {
  id: string;
  type: WorkerMessageType;
  payload: any;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: number, message: string) => void;
  timeout?: number;
  timeoutId?: NodeJS.Timeout;
}

/**
 * Worker 实例包装
 */
interface WorkerInstance {
  worker: Worker;
  busy: boolean;
  currentTask: WorkerTask | null;
}

/**
 * Worker 池选项
 */
export interface WorkerPoolOptions {
  /**
   * 最大 Worker 数量
   */
  maxWorkers?: number;

  /**
   * Worker 脚本 URL
   */
  workerUrl?: string;

  /**
   * 默认超时时间(毫秒)
   */
  defaultTimeout?: number;

  /**
   * 是否自动回收空闲 Worker
   */
  autoReclaim?: boolean;

  /**
   * 回收间隔(毫秒)
   */
  reclaimInterval?: number;
}

/**
 * Worker 池管理器
 */
export class WorkerPool {
  private workers: WorkerInstance[] = [];
  private taskQueue: WorkerTask[] = [];
  private maxWorkers: number;
  private workerUrl: string | null;
  private defaultTimeout: number;
  private autoReclaim: boolean;
  private reclaimInterval: number;
  private reclaimIntervalId: NodeJS.Timeout | null = null;
  private taskIdCounter = 0;

  constructor(options: WorkerPoolOptions = {}) {
    this.maxWorkers = options.maxWorkers || navigator.hardwareConcurrency || 4;
    this.workerUrl = options.workerUrl || null;
    this.defaultTimeout = options.defaultTimeout || 300000; // 5分钟
    this.autoReclaim = options.autoReclaim !== false;
    this.reclaimInterval = options.reclaimInterval || 60000; // 1分钟

    if (this.autoReclaim) {
      this.startAutoReclaim();
    }

    logger.info('Worker pool initialized', {
      maxWorkers: this.maxWorkers,
      autoReclaim: this.autoReclaim,
    });
  }

  /**
   * 执行任务
   */
  async execute<T = any>(
    type: WorkerMessageType,
    payload: any,
    options?: {
      onProgress?: (progress: number, message: string) => void;
      timeout?: number;
    }
  ): Promise<T> {
    const taskId = this.generateTaskId();

    return new Promise<T>((resolve, reject) => {
      const task: WorkerTask = {
        id: taskId,
        type,
        payload,
        resolve,
        reject,
        onProgress: options?.onProgress,
        timeout: options?.timeout || this.defaultTimeout,
      };

      // 设置超时
      if (task.timeout > 0) {
        task.timeoutId = setTimeout(() => {
          this.cancelTask(taskId);
          reject(new Error(`Task ${taskId} timeout after ${task.timeout}ms`));
        }, task.timeout);
      }

      // 尝试分配 Worker
      const worker = this.getAvailableWorker();
      if (worker) {
        this.assignTask(worker, task);
      } else {
        // 加入队列等待
        this.taskQueue.push(task);
        logger.debug(`Task ${taskId} queued, queue size: ${this.taskQueue.length}`);
      }
    });
  }

  /**
   * 获取可用的 Worker
   */
  private getAvailableWorker(): WorkerInstance | null {
    // 查找空闲 Worker
    const idleWorker = this.workers.find((w) => !w.busy);
    if (idleWorker) {
      return idleWorker;
    }

    // 如果未达到最大数量,创建新 Worker
    if (this.workers.length < this.maxWorkers) {
      return this.createWorker();
    }

    return null;
  }

  /**
   * 创建 Worker
   */
  private createWorker(): WorkerInstance {
    let worker: Worker;

    if (this.workerUrl) {
      worker = new Worker(this.workerUrl, { type: 'module' });
    } else {
      // 使用内联 Worker (仅用于开发/测试)
      const blob = new Blob(
        [`importScripts('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');`],
        { type: 'application/javascript' }
      );
      const url = URL.createObjectURL(blob);
      worker = new Worker(url);
      URL.revokeObjectURL(url);
    }

    const instance: WorkerInstance = {
      worker,
      busy: false,
      currentTask: null,
    };

    // 监听消息
    worker.addEventListener('message', (event) => {
      this.handleWorkerMessage(instance, event.data);
    });

    // 监听错误
    worker.addEventListener('error', (event) => {
      this.handleWorkerError(instance, event);
    });

    this.workers.push(instance);
    logger.debug(`Worker created, total workers: ${this.workers.length}`);

    return instance;
  }

  /**
   * 分配任务给 Worker
   */
  private assignTask(workerInstance: WorkerInstance, task: WorkerTask): void {
    workerInstance.busy = true;
    workerInstance.currentTask = task;

    const message = {
      type: task.type,
      id: task.id,
      payload: task.payload,
    };

    workerInstance.worker.postMessage(message);
    logger.debug(`Task ${task.id} assigned to worker`);
  }

  /**
   * 处理 Worker 消息
   */
  private handleWorkerMessage(workerInstance: WorkerInstance, data: any): void {
    const { type, id, payload } = data;
    const task = workerInstance.currentTask;

    if (!task || task.id !== id) {
      logger.warn(`Received message for unknown task: ${id}`);
      return;
    }

    switch (type) {
      case WorkerResponseType.PROGRESS:
        if (task.onProgress) {
          task.onProgress(payload.progress, payload.message);
        }
        break;

      case WorkerResponseType.SUCCESS:
        this.completeTask(workerInstance, task, payload);
        break;

      case WorkerResponseType.ERROR:
        const error = new Error(payload.message);
        if (payload.stack) {
          error.stack = payload.stack;
        }
        this.failTask(workerInstance, task, error);
        break;

      default:
        logger.warn(`Unknown response type: ${type}`);
    }
  }

  /**
   * 处理 Worker 错误
   */
  private handleWorkerError(workerInstance: WorkerInstance, event: ErrorEvent): void {
    const task = workerInstance.currentTask;

    if (task) {
      this.failTask(workerInstance, task, new Error(event.message));
    }

    logger.error('Worker error', new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  }

  /**
   * 完成任务
   */
  private completeTask(workerInstance: WorkerInstance, task: WorkerTask, result: any): void {
    // 清除超时
    if (task.timeoutId) {
      clearTimeout(task.timeoutId);
    }

    // 完成任务
    task.resolve(result);

    // 释放 Worker
    this.releaseWorker(workerInstance);
  }

  /**
   * 任务失败
   */
  private failTask(workerInstance: WorkerInstance, task: WorkerTask, error: Error): void {
    // 清除超时
    if (task.timeoutId) {
      clearTimeout(task.timeoutId);
    }

    // 拒绝任务
    task.reject(error);

    // 释放 Worker
    this.releaseWorker(workerInstance);
  }

  /**
   * 释放 Worker
   */
  private releaseWorker(workerInstance: WorkerInstance): void {
    workerInstance.busy = false;
    workerInstance.currentTask = null;

    // 处理队列中的下一个任务
    if (this.taskQueue.length > 0) {
      const nextTask = this.taskQueue.shift();
      if (nextTask) {
        this.assignTask(workerInstance, nextTask);
      }
    }
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): void {
    // 从队列中移除
    const queueIndex = this.taskQueue.findIndex((t) => t.id === taskId);
    if (queueIndex > -1) {
      const task = this.taskQueue[queueIndex];
      this.taskQueue.splice(queueIndex, 1);

      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
      }

      task.reject(new Error('Task cancelled'));
      logger.debug(`Task ${taskId} cancelled from queue`);
      return;
    }

    // 从正在执行的任务中取消
    const workerInstance = this.workers.find((w) => w.currentTask?.id === taskId);
    if (workerInstance && workerInstance.currentTask) {
      const task = workerInstance.currentTask;

      // 发送取消消息给 Worker
      workerInstance.worker.postMessage({
        type: WorkerMessageType.CANCEL,
        id: taskId,
        payload: null,
      });

      this.failTask(workerInstance, task, new Error('Task cancelled'));
      logger.debug(`Task ${taskId} cancelled`);
    }
  }

  /**
   * 生成任务 ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${++this.taskIdCounter}`;
  }

  /**
   * 开始自动回收
   */
  private startAutoReclaim(): void {
    if (this.reclaimIntervalId) {
      return;
    }

    this.reclaimIntervalId = setInterval(() => {
      this.reclaimIdleWorkers();
    }, this.reclaimInterval);
  }

  /**
   * 回收空闲 Worker
   */
  private reclaimIdleWorkers(): void {
    const idleWorkers = this.workers.filter((w) => !w.busy);

    // 保留至少一个 Worker
    if (idleWorkers.length > 1) {
      const toReclaim = idleWorkers.slice(1);
      toReclaim.forEach((w) => {
        this.terminateWorker(w);
      });

      if (toReclaim.length > 0) {
        logger.debug(`Reclaimed ${toReclaim.length} idle workers`);
      }
    }
  }

  /**
   * 终止 Worker
   */
  private terminateWorker(workerInstance: WorkerInstance): void {
    const index = this.workers.indexOf(workerInstance);
    if (index > -1) {
      workerInstance.worker.terminate();
      this.workers.splice(index, 1);
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalWorkers: number;
    busyWorkers: number;
    idleWorkers: number;
    queuedTasks: number;
  } {
    const busyWorkers = this.workers.filter((w) => w.busy).length;

    return {
      totalWorkers: this.workers.length,
      busyWorkers,
      idleWorkers: this.workers.length - busyWorkers,
      queuedTasks: this.taskQueue.length,
    };
  }

  /**
   * 销毁池
   */
  destroy(): void {
    // 停止自动回收
    if (this.reclaimIntervalId) {
      clearInterval(this.reclaimIntervalId);
      this.reclaimIntervalId = null;
    }

    // 取消所有排队的任务
    this.taskQueue.forEach((task) => {
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
      }
      task.reject(new Error('Worker pool destroyed'));
    });
    this.taskQueue = [];

    // 终止所有 Worker
    this.workers.forEach((w) => {
      if (w.currentTask) {
        if (w.currentTask.timeoutId) {
          clearTimeout(w.currentTask.timeoutId);
        }
        w.currentTask.reject(new Error('Worker pool destroyed'));
      }
      w.worker.terminate();
    });
    this.workers = [];

    logger.info('Worker pool destroyed');
  }
}

/**
 * 全局 Worker 池实例
 */
let globalWorkerPool: WorkerPool | null = null;

/**
 * 获取全局 Worker 池
 */
export function getWorkerPool(options?: WorkerPoolOptions): WorkerPool {
  if (!globalWorkerPool) {
    globalWorkerPool = new WorkerPool(options);
  }
  return globalWorkerPool;
}

/**
 * 销毁全局 Worker 池
 */
export function destroyWorkerPool(): void {
  if (globalWorkerPool) {
    globalWorkerPool.destroy();
    globalWorkerPool = null;
  }
}


