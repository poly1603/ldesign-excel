/**
 * 内存管理测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCache, SparseMatrix } from '../src/utils/memory';

describe('LRUCache', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(3);
  });

  it('应该正确存储和获取值', () => {
    cache.set('a', 1);
    cache.set('b', 2);

    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
  });

  it('应该在超过容量时移除最旧的项', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.set('d', 4); // 超过容量,应该移除 'a'

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
  });

  it('应该更新访问顺序', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    cache.get('a'); // 访问 'a',使其成为最新

    cache.set('d', 4); // 应该移除 'b' 而不是 'a'

    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
  });

  it('应该正确计算命中率', () => {
    cache.set('a', 1);

    cache.get('a'); // 命中
    cache.get('b'); // 未命中
    cache.get('a'); // 命中

    const hitRate = cache.getHitRate();
    expect(hitRate).toBe(2 / 3);
  });
});

describe('SparseMatrix', () => {
  let matrix: SparseMatrix<number>;

  beforeEach(() => {
    matrix = new SparseMatrix<number>();
  });

  it('应该正确设置和获取值', () => {
    matrix.set(100, 100, 42);
    expect(matrix.get(100, 100)).toBe(42);
  });

  it('对于未设置的单元格应该返回 undefined', () => {
    expect(matrix.get(0, 0)).toBeUndefined();
  });

  it('应该正确计算稀疏度', () => {
    matrix.set(1000, 1000, 1);
    matrix.set(2000, 2000, 2);

    const sparsity = matrix.getSparsity();
    expect(sparsity).toBeGreaterThan(0.99); // 非常稀疏
  });

  it('应该支持遍历非空元素', () => {
    matrix.set(1, 1, 10);
    matrix.set(2, 2, 20);
    matrix.set(3, 3, 30);

    const values: number[] = [];
    matrix.forEach((value) => {
      values.push(value);
    });

    expect(values).toContain(10);
    expect(values).toContain(20);
    expect(values).toContain(30);
    expect(values.length).toBe(3);
  });
});

