/**
 * 数据验证测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DataValidator, ValidationType, ValidationOperator } from '../src/validation';

describe('DataValidator', () => {
  let validator: DataValidator;

  beforeEach(() => {
    validator = new DataValidator();
  });

  describe('整数验证', () => {
    it('应该验证整数范围', () => {
      validator.addRule('A1', {
        type: ValidationType.WHOLE_NUMBER,
        operator: ValidationOperator.BETWEEN,
        formula1: '1',
        formula2: '100',
      });

      expect(validator.validate('A1', 50).valid).toBe(true);
      expect(validator.validate('A1', 0).valid).toBe(false);
      expect(validator.validate('A1', 101).valid).toBe(false);
    });

    it('应该拒绝非整数', () => {
      validator.addRule('A1', {
        type: ValidationType.WHOLE_NUMBER,
        operator: ValidationOperator.EQUAL,
        formula1: '10',
      });

      expect(validator.validate('A1', 10).valid).toBe(true);
      expect(validator.validate('A1', 10.5).valid).toBe(false);
    });
  });

  describe('列表验证', () => {
    it('应该验证列表值', () => {
      validator.addRule('B1', {
        type: ValidationType.LIST,
        list: ['选项1', '选项2', '选项3'],
      });

      expect(validator.validate('B1', '选项1').valid).toBe(true);
      expect(validator.validate('B1', '选项4').valid).toBe(false);
    });
  });

  describe('文本长度验证', () => {
    it('应该验证文本长度', () => {
      validator.addRule('C1', {
        type: ValidationType.TEXT_LENGTH,
        operator: ValidationOperator.LESS_THAN,
        formula1: '10',
      });

      expect(validator.validate('C1', 'short').valid).toBe(true);
      expect(validator.validate('C1', 'very long text').valid).toBe(false);
    });
  });

  describe('空白值处理', () => {
    it('允许空白时应该接受空值', () => {
      validator.addRule('D1', {
        type: ValidationType.WHOLE_NUMBER,
        operator: ValidationOperator.GREATER_THAN,
        formula1: '0',
        allowBlank: true,
      });

      expect(validator.validate('D1', '').valid).toBe(true);
      expect(validator.validate('D1', null).valid).toBe(true);
      expect(validator.validate('D1', undefined).valid).toBe(true);
    });
  });
});

