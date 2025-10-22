/**
 * 公式引擎测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FormulaEngine } from '../src/formula';

describe('FormulaEngine', () => {
  let engine: FormulaEngine;

  beforeEach(() => {
    engine = new FormulaEngine();
  });

  describe('数学函数', () => {
    it('应该正确计算 SUM', () => {
      engine.setCellValue('A1', 10);
      engine.setCellValue('A2', 20);
      engine.setCellValue('A3', 30);

      const result = engine.calculate('=SUM(A1:A3)');
      expect(result.value).toBe(60);
      expect(result.type).toBe('number');
    });

    it('应该正确计算 AVERAGE', () => {
      engine.setCellValue('A1', 10);
      engine.setCellValue('A2', 20);
      engine.setCellValue('A3', 30);

      const result = engine.calculate('=AVERAGE(A1:A3)');
      expect(result.value).toBe(20);
    });

    it('应该正确计算 MAX 和 MIN', () => {
      engine.setCellValue('A1', 10);
      engine.setCellValue('A2', 50);
      engine.setCellValue('A3', 30);

      expect(engine.calculate('=MAX(A1:A3)').value).toBe(50);
      expect(engine.calculate('=MIN(A1:A3)').value).toBe(10);
    });

    it('应该正确计算 ROUND', () => {
      const result = engine.calculate('=ROUND(3.14159, 2)');
      expect(result.value).toBe(3.14);
    });
  });

  describe('逻辑函数', () => {
    it('应该正确计算 IF', () => {
      engine.setCellValue('A1', 100);

      const result1 = engine.calculate('=IF(A1>50, "大", "小")');
      expect(result1.value).toBe('大');

      engine.setCellValue('A1', 30);
      const result2 = engine.calculate('=IF(A1>50, "大", "小")');
      expect(result2.value).toBe('小');
    });

    it('应该正确计算 AND 和 OR', () => {
      expect(engine.calculate('=AND(TRUE, TRUE)').value).toBe(true);
      expect(engine.calculate('=AND(TRUE, FALSE)').value).toBe(false);
      expect(engine.calculate('=OR(TRUE, FALSE)').value).toBe(true);
      expect(engine.calculate('=OR(FALSE, FALSE)').value).toBe(false);
    });
  });

  describe('文本函数', () => {
    it('应该正确拼接文本', () => {
      engine.setCellValue('A1', 'Hello');
      engine.setCellValue('A2', 'World');

      const result = engine.calculate('=CONCATENATE(A1, " ", A2)');
      expect(result.value).toBe('Hello World');
    });

    it('应该正确提取文本', () => {
      expect(engine.calculate('=LEFT("Hello", 2)').value).toBe('He');
      expect(engine.calculate('=RIGHT("Hello", 2)').value).toBe('lo');
      expect(engine.calculate('=MID("Hello", 2, 3)').value).toBe('ell');
    });

    it('应该正确转换文本大小写', () => {
      expect(engine.calculate('=UPPER("hello")').value).toBe('HELLO');
      expect(engine.calculate('=LOWER("HELLO")').value).toBe('hello');
    });
  });

  describe('自定义函数', () => {
    it('应该支持注册自定义函数', () => {
      engine.registerFunction('DOUBLE', (x: number) => x * 2);

      const result = engine.calculate('=DOUBLE(5)');
      expect(result.value).toBe(10);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效公式', () => {
      const result = engine.calculate('=INVALID()');
      expect(result.error).toBeDefined();
      expect(result.type).toBe('error');
    });
  });
});

