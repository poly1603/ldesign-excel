/**
 * 内存管理工具
 */

import { logger } from '../errors';

/**
 * LRU 缓存节点
 */
class LRUNode<K, V> {
  constructor(
    public key: K,
    public value: V,
    public prev: LRUNode<K, V> | null = null,
    public next: LRUNode<K, V> | null = null
  ) { }
}

/**
 * LRU 缓存实现
 */
export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, LRUNode<K, V>>;
  private head: LRUNode<K, V> | null = null;
  private tail: LRUNode<K, V> | null = null;
  private hits = 0;
  private misses = 0;

  constructor(capacity: number = 100) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * 获取缓存值
   */
  get(key: K): V | undefined {
    const node = this.cache.get(key);

    if (!node) {
      this.misses++;
      return undefined;
    }

    this.hits++;
    this.moveToHead(node);
    return node.value;
  }

  /**
   * 设置缓存值
   */
  set(key: K, value: V): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      existingNode.value = value;
      this.moveToHead(existingNode);
      return;
    }

    const newNode = new LRUNode(key, value);
    this.cache.set(key, newNode);
    this.addToHead(newNode);

    if (this.cache.size > this.capacity) {
      const removed = this.removeTail();
      if (removed) {
        this.cache.delete(removed.key);
      }
    }
  }

  /**
   * 删除缓存值
   */
  delete(key: K): boolean {
    const node = this.cache.get(key);

    if (!node) {
      return false;
    }

    this.removeNode(node);
    return this.cache.delete(key);
  }

  /**
   * 检查键是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 获取缓存命中率
   */
  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  /**
   * 获取统计信息
   */
  getStats(): { hits: number; misses: number; hitRate: number; size: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
      size: this.size(),
    };
  }

  /**
   * 移动节点到头部
   */
  private moveToHead(node: LRUNode<K, V>): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  /**
   * 添加节点到头部
   */
  private addToHead(node: LRUNode<K, V>): void {
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * 移除节点
   */
  private removeNode(node: LRUNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  /**
   * 移除尾部节点
   */
  private removeTail(): LRUNode<K, V> | null {
    if (!this.tail) {
      return null;
    }

    const removed = this.tail;
    this.removeNode(removed);
    return removed;
  }
}

/**
 * 稀疏矩阵实现
 * 用于优化大型但稀疏的数据存储
 */
export class SparseMatrix<T> {
  private data: Map<string, T> = new Map();
  private rows: number;
  private cols: number;

  constructor(rows: number = 0, cols: number = 0) {
    this.rows = rows;
    this.cols = cols;
  }

  /**
   * 生成键
   */
  private getKey(row: number, col: number): string {
    return `${row},${col}`;
  }

  /**
   * 设置值
   */
  set(row: number, col: number, value: T): void {
    if (row < 0 || col < 0) {
      throw new Error('Invalid row or column index');
    }

    this.rows = Math.max(this.rows, row + 1);
    this.cols = Math.max(this.cols, col + 1);

    const key = this.getKey(row, col);
    this.data.set(key, value);
  }

  /**
   * 获取值
   */
  get(row: number, col: number): T | undefined {
    const key = this.getKey(row, col);
    return this.data.get(key);
  }

  /**
   * 删除值
   */
  delete(row: number, col: number): boolean {
    const key = this.getKey(row, col);
    return this.data.delete(key);
  }

  /**
   * 检查是否存在
   */
  has(row: number, col: number): boolean {
    const key = this.getKey(row, col);
    return this.data.has(key);
  }

  /**
   * 获取非空元素数量
   */
  getNonZeroCount(): number {
    return this.data.size;
  }

  /**
   * 获取总元素数量
   */
  getTotalCount(): number {
    return this.rows * this.cols;
  }

  /**
   * 获取稀疏度
   */
  getSparsity(): number {
    const total = this.getTotalCount();
    return total === 0 ? 0 : 1 - this.getNonZeroCount() / total;
  }

  /**
   * 清空矩阵
   */
  clear(): void {
    this.data.clear();
  }

  /**
   * 转换为二维数组
   */
  toArray(defaultValue: T): T[][] {
    const result: T[][] = [];

    for (let r = 0; r < this.rows; r++) {
      const row: T[] = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(this.get(r, c) ?? defaultValue);
      }
      result.push(row);
    }

    return result;
  }

  /**
   * 遍历非空元素
   */
  forEach(callback: (value: T, row: number, col: number) => void): void {
    this.data.forEach((value, key) => {
      const [row, col] = key.split(',').map(Number);
      callback(value, row, col);
    });
  }
}

/**
 * 内存监控器
 */
export class MemoryMonitor {
  private checkInterval: number;
  private warningThreshold: number;
  private criticalThreshold: number;
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: Array<(info: MemoryInfo) => void> = [];

  constructor(options?: {
    checkInterval?: number;
    warningThreshold?: number;
    criticalThreshold?: number;
  }) {
    this.checkInterval = options?.checkInterval || 5000; // 5秒
    this.warningThreshold = options?.warningThreshold || 0.7; // 70%
    this.criticalThreshold = options?.criticalThreshold || 0.9; // 90%
  }

  /**
   * 开始监控
   */
  start(): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.check();
    }, this.checkInterval);

    logger.info('Memory monitor started');
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Memory monitor stopped');
    }
  }

  /**
   * 检查内存使用情况
   */
  check(): MemoryInfo | null {
    const info = this.getMemoryInfo();

    if (!info) {
      return null;
    }

    // 触发回调
    this.callbacks.forEach((callback) => {
      try {
        callback(info);
      } catch (error) {
        logger.error('Error in memory monitor callback', error as Error);
      }
    });

    // 检查阈值
    if (info.usageRatio >= this.criticalThreshold) {
      logger.error('Critical memory usage detected', undefined, {
        used: info.usedJSHeapSize,
        total: info.totalJSHeapSize,
        ratio: info.usageRatio,
      });
    } else if (info.usageRatio >= this.warningThreshold) {
      logger.warn('High memory usage detected', {
        used: info.usedJSHeapSize,
        total: info.totalJSHeapSize,
        ratio: info.usageRatio,
      });
    }

    return info;
  }

  /**
   * 获取内存信息
   */
  getMemoryInfo(): MemoryInfo | null {
    // 检查是否支持 Performance Memory API
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usageRatio: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
      };
    }

    return null;
  }

  /**
   * 注册回调
   */
  onMemoryChange(callback: (info: MemoryInfo) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * 移除回调
   */
  offMemoryChange(callback: (info: MemoryInfo) => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }
}

/**
 * 内存信息接口
 */
export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usageRatio: number;
}

/**
 * 内存池
 * 用于管理可复用的对象
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    options?: { initialSize?: number; maxSize?: number }
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = options?.maxSize || 1000;

    // 预创建对象
    const initialSize = options?.initialSize || 10;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  /**
   * 获取对象
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  /**
   * 释放对象
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  /**
   * 清空池
   */
  clear(): void {
    this.pool = [];
  }

  /**
   * 获取池大小
   */
  size(): number {
    return this.pool.length;
  }
}

/**
 * 分块数据加载器
 * 用于分批加载大量数据
 */
export class ChunkedDataLoader<T> {
  private data: T[];
  private chunkSize: number;
  private currentIndex = 0;

  constructor(data: T[], chunkSize: number = 1000) {
    this.data = data;
    this.chunkSize = chunkSize;
  }

  /**
   * 获取下一块数据
   */
  next(): T[] | null {
    if (this.currentIndex >= this.data.length) {
      return null;
    }

    const chunk = this.data.slice(this.currentIndex, this.currentIndex + this.chunkSize);
    this.currentIndex += this.chunkSize;
    return chunk;
  }

  /**
   * 是否还有数据
   */
  hasNext(): boolean {
    return this.currentIndex < this.data.length;
  }

  /**
   * 重置
   */
  reset(): void {
    this.currentIndex = 0;
  }

  /**
   * 获取进度
   */
  getProgress(): number {
    return this.data.length === 0 ? 1 : this.currentIndex / this.data.length;
  }

  /**
   * 异步迭代器
   */
  async *[Symbol.asyncIterator](): AsyncIterator<T[]> {
    this.reset();
    while (this.hasNext()) {
      const chunk = this.next();
      if (chunk) {
        yield chunk;
        // 让出控制权，避免阻塞
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastTime);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      func.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}


