/**
 * 渲染性能优化
 * 使用 RAF、增量渲染、Canvas 等技术优化渲染性能
 */

import { logger } from '../errors';
import { throttle } from '../utils/memory';

/**
 * 渲染模式
 */
export enum RenderMode {
  /** DOM 渲染 */
  DOM = 'dom',
  /** Canvas 渲染 */
  CANVAS = 'canvas',
  /** 混合模式 */
  HYBRID = 'hybrid',
}

/**
 * 渲染任务
 */
export interface RenderTask {
  /** 任务ID */
  id: string;
  /** 优先级 */
  priority: number;
  /** 渲染函数 */
  render: () => void;
  /** 是否完成 */
  completed: boolean;
}

/**
 * 渲染批次
 */
export interface RenderBatch {
  /** 批次ID */
  id: string;
  /** 任务列表 */
  tasks: RenderTask[];
  /** 开始时间 */
  startTime: number;
  /** 完成时间 */
  endTime?: number;
}

/**
 * 渲染优化器
 */
export class RenderOptimizer {
  private renderMode: RenderMode = RenderMode.DOM;
  private rafId: number | null = null;
  private renderQueue: RenderTask[] = [];
  private currentBatch: RenderBatch | null = null;
  private taskIdCounter = 0;
  private batchIdCounter = 0;
  private maxTasksPerFrame = 10;
  private dirtyRegions: Set<string> = new Set();

  constructor(mode: RenderMode = RenderMode.DOM) {
    this.renderMode = mode;
    logger.info('Render optimizer initialized', { mode });
  }

  /**
   * 请求渲染
   */
  requestRender(task: Omit<RenderTask, 'id' | 'completed'>): void {
    const renderTask: RenderTask = {
      ...task,
      id: this.generateTaskId(),
      completed: false,
    };

    this.renderQueue.push(renderTask);

    // 按优先级排序
    this.renderQueue.sort((a, b) => b.priority - a.priority);

    // 如果还没有调度渲染,启动 RAF
    if (!this.rafId) {
      this.scheduleRender();
    }
  }

  /**
   * 调度渲染
   */
  private scheduleRender(): void {
    if (this.rafId) {
      return;
    }

    this.rafId = requestAnimationFrame(() => {
      this.performRender();
    });
  }

  /**
   * 执行渲染
   */
  private performRender(): void {
    const startTime = performance.now();

    // 创建新批次
    this.currentBatch = {
      id: this.generateBatchId(),
      tasks: [],
      startTime,
    };

    // 执行任务
    let tasksExecuted = 0;

    while (this.renderQueue.length > 0 && tasksExecuted < this.maxTasksPerFrame) {
      const task = this.renderQueue.shift();

      if (task) {
        try {
          task.render();
          task.completed = true;
          this.currentBatch.tasks.push(task);
          tasksExecuted++;
        } catch (error) {
          logger.error('Render task failed', error as Error, { taskId: task.id });
        }
      }
    }

    const endTime = performance.now();
    this.currentBatch.endTime = endTime;

    logger.debug('Render batch completed', {
      batchId: this.currentBatch.id,
      tasksExecuted,
      duration: endTime - startTime,
      remaining: this.renderQueue.length,
    });

    // 如果还有任务,继续调度
    if (this.renderQueue.length > 0) {
      this.rafId = null;
      this.scheduleRender();
    } else {
      this.rafId = null;
    }
  }

  /**
   * 标记脏区域
   */
  markDirty(region: string): void {
    this.dirtyRegions.add(region);
    logger.debug('Region marked dirty', { region });
  }

  /**
   * 清除脏区域
   */
  clearDirty(region: string): void {
    this.dirtyRegions.delete(region);
  }

  /**
   * 获取脏区域
   */
  getDirtyRegions(): Set<string> {
    return new Set(this.dirtyRegions);
  }

  /**
   * 增量渲染
   */
  incrementalRender(
    allRegions: string[],
    renderFn: (region: string) => void
  ): void {
    // 只渲染脏区域
    const dirtyRegions = Array.from(this.dirtyRegions);

    if (dirtyRegions.length === 0) {
      logger.debug('No dirty regions, skipping render');
      return;
    }

    logger.debug('Incremental render', { dirtyCount: dirtyRegions.length });

    dirtyRegions.forEach((region, index) => {
      this.requestRender({
        priority: 100 - index,
        render: () => {
          renderFn(region);
          this.clearDirty(region);
        },
      });
    });
  }

  /**
   * 批量渲染
   */
  batchRender(renders: Array<() => void>): void {
    renders.forEach((render, index) => {
      this.requestRender({
        priority: renders.length - index,
        render,
      });
    });
  }

  /**
   * 取消所有待渲染任务
   */
  cancelAll(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.renderQueue = [];
    logger.debug('All render tasks cancelled');
  }

  /**
   * 设置每帧最大任务数
   */
  setMaxTasksPerFrame(max: number): void {
    this.maxTasksPerFrame = max;
    logger.debug('Max tasks per frame updated', { max });
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    queuedTasks: number;
    dirtyRegions: number;
    renderMode: RenderMode;
    isRendering: boolean;
  } {
    return {
      queuedTasks: this.renderQueue.length,
      dirtyRegions: this.dirtyRegions.size,
      renderMode: this.renderMode,
      isRendering: this.rafId !== null,
    };
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${++this.taskIdCounter}`;
  }

  /**
   * 生成批次ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${++this.batchIdCounter}`;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.cancelAll();
    this.dirtyRegions.clear();
    logger.info('Render optimizer destroyed');
  }
}

/**
 * Canvas 渲染器
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scale: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    this.ctx = ctx;
    this.scale = window.devicePixelRatio || 1;

    // 设置高 DPI
    this.setupHighDPI();

    logger.info('Canvas renderer initialized', { scale: this.scale });
  }

  /**
   * 设置高 DPI
   */
  private setupHighDPI(): void {
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * this.scale;
    this.canvas.height = rect.height * this.scale;

    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.ctx.scale(this.scale, this.scale);
  }

  /**
   * 渲染单元格
   */
  renderCell(
    x: number,
    y: number,
    width: number,
    height: number,
    value: string,
    style?: any
  ): void {
    // 清除区域
    this.ctx.clearRect(x, y, width, height);

    // 绘制背景
    if (style?.backgroundColor) {
      this.ctx.fillStyle = style.backgroundColor;
      this.ctx.fillRect(x, y, width, height);
    }

    // 绘制边框
    this.ctx.strokeStyle = style?.borderColor || '#ddd';
    this.ctx.strokeRect(x, y, width, height);

    // 绘制文本
    this.ctx.fillStyle = style?.color || '#000';
    this.ctx.font = this.getFontString(style);
    this.ctx.textAlign = style?.textAlign || 'left';
    this.ctx.textBaseline = 'middle';

    const padding = 4;
    const textX = x + padding;
    const textY = y + height / 2;

    this.ctx.fillText(value, textX, textY, width - padding * 2);
  }

  /**
   * 获取字体字符串
   */
  private getFontString(style?: any): string {
    const size = style?.fontSize || 12;
    const family = style?.fontFamily || 'Arial';
    const weight = style?.fontWeight || 'normal';
    const styleStr = style?.fontStyle || 'normal';

    return `${styleStr} ${weight} ${size}px ${family}`;
  }

  /**
   * 清空画布
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 获取上下文
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}


