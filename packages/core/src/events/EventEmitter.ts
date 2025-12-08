/**
 * 事件发射器
 * @description 提供类型安全的事件订阅和发布功能
 */
import type { EventType, EventData } from '../types';

/**
 * 事件监听器类型
 */
export type EventListener<T extends EventData = EventData> = (data: T) => void;

/**
 * 事件发射器
 */
export class EventEmitter {
  private listeners: Map<EventType, Set<EventListener>> = new Map();
  private onceListeners: Map<EventType, Set<EventListener>> = new Map();

  /**
   * 订阅事件
   */
  on<T extends EventData>(type: T['type'], listener: EventListener<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener as EventListener);

    // 返回取消订阅函数
    return () => this.off(type, listener);
  }

  /**
   * 订阅一次性事件
   */
  once<T extends EventData>(type: T['type'], listener: EventListener<T>): () => void {
    if (!this.onceListeners.has(type)) {
      this.onceListeners.set(type, new Set());
    }
    this.onceListeners.get(type)!.add(listener as EventListener);

    return () => {
      const set = this.onceListeners.get(type);
      if (set) {
        set.delete(listener as EventListener);
      }
    };
  }

  /**
   * 取消订阅事件
   */
  off<T extends EventData>(type: T['type'], listener: EventListener<T>): void {
    const set = this.listeners.get(type);
    if (set) {
      set.delete(listener as EventListener);
    }

    const onceSet = this.onceListeners.get(type);
    if (onceSet) {
      onceSet.delete(listener as EventListener);
    }
  }

  /**
   * 发射事件
   */
  emit<T extends EventData>(data: T): void {
    const type = data.type;

    // 触发普通监听器
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Event listener error for "${type}":`, error);
        }
      });
    }

    // 触发一次性监听器
    const onceListeners = this.onceListeners.get(type);
    if (onceListeners) {
      onceListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Once event listener error for "${type}":`, error);
        }
      });
      onceListeners.clear();
    }
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(type?: EventType): void {
    if (type) {
      this.listeners.delete(type);
      this.onceListeners.delete(type);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }

  /**
   * 获取监听器数量
   */
  listenerCount(type: EventType): number {
    const listeners = this.listeners.get(type);
    const onceListeners = this.onceListeners.get(type);
    return (listeners?.size ?? 0) + (onceListeners?.size ?? 0);
  }

  /**
   * 检查是否有监听器
   */
  hasListeners(type: EventType): boolean {
    return this.listenerCount(type) > 0;
  }
}
