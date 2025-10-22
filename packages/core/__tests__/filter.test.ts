/**
 * 筛选排序测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedFilter, AdvancedSorter, FilterType, LogicalOperator, SortDirection } from '../src/filter';

describe('AdvancedFilter', () => {
  let filter: AdvancedFilter;
  let testData: any[][];

  beforeEach(() => {
    filter = new AdvancedFilter();
    testData = [
      [{ v: 100 }, { v: 'active' }],
      [{ v: 50 }, { v: 'inactive' }],
      [{ v: 150 }, { v: 'active' }],
      [{ v: 75 }, { v: 'active' }],
    ];
  });

  it('应该按大于条件筛选', () => {
    const result = filter.filter(testData, {
      operator: LogicalOperator.AND,
      conditions: [
        { column: 0, type: FilterType.GREATER_THAN, value1: 70 },
      ],
    });

    expect(result.rowIndices.length).toBe(3);
    expect(result.rowIndices).toContain(0);
    expect(result.rowIndices).toContain(2);
    expect(result.rowIndices).toContain(3);
  });

  it('应该支持多条件 AND 筛选', () => {
    const result = filter.filter(testData, {
      operator: LogicalOperator.AND,
      conditions: [
        { column: 0, type: FilterType.GREATER_THAN, value1: 70 },
        { column: 1, type: FilterType.EQUALS, value1: 'active' },
      ],
    });

    expect(result.rowIndices.length).toBe(2);
  });
});

describe('AdvancedSorter', () => {
  let sorter: AdvancedSorter;
  let testData: any[][];

  beforeEach(() => {
    sorter = new AdvancedSorter();
    testData = [
      [{ v: 30 }, { v: 'B' }],
      [{ v: 10 }, { v: 'A' }],
      [{ v: 20 }, { v: 'C' }],
    ];
  });

  it('应该按升序排序', () => {
    const indices = sorter.sortByColumn(testData, 0, SortDirection.ASC);

    expect(indices[0]).toBe(1); // 10
    expect(indices[1]).toBe(2); // 20
    expect(indices[2]).toBe(0); // 30
  });

  it('应该按降序排序', () => {
    const indices = sorter.sortByColumn(testData, 0, SortDirection.DESC);

    expect(indices[0]).toBe(0); // 30
    expect(indices[1]).toBe(2); // 20
    expect(indices[2]).toBe(1); // 10
  });

  it('应该支持多列排序', () => {
    const data = [
      [{ v: 1 }, { v: 'B' }],
      [{ v: 1 }, { v: 'A' }],
      [{ v: 2 }, { v: 'C' }],
    ];

    const indices = sorter.sort(data, [
      { column: 0, direction: SortDirection.ASC },
      { column: 1, direction: SortDirection.ASC },
    ]);

    expect(data[indices[0]][1].v).toBe('A');
    expect(data[indices[1]][1].v).toBe('B');
    expect(data[indices[2]][1].v).toBe('C');
  });
});

