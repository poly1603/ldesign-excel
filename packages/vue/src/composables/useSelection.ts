import { ref, type Ref } from 'vue'
import type { ExcelRenderer } from '@excel-renderer/core'
import type { Selection, CellRange, CellData } from '@excel-renderer/core'

/**
 * useSelection Composable
 * 用于管理单元格选择
 */
export function useSelection(renderer: Ref<ExcelRenderer | undefined>) {
  const selection = ref<Selection | null>(null)

  /**
   * 选择单个单元格
   */
  function selectCell(row: number, col: number): void {
    // 这里需要渲染器实现selectCell方法
    updateSelection()
  }

  /**
   * 选择区域
   */
  function selectRange(range: CellRange): void {
    // 这里需要渲染器实现selectRange方法
    updateSelection()
  }

  /**
   * 获取选中的单元格数据
   */
  function getSelectedData(): CellData[] {
    return selection.value?.data || []
  }

  /**
   * 清除选择
   */
  function clearSelection(): void {
    selection.value = null
  }

  /**
   * 更新选择状态
   */
  function updateSelection(): void {
    // 从渲染器获取当前选择状态
    // selection.value = renderer.value?.getSelection()
  }

  return {
    selection,
    selectCell,
    selectRange,
    getSelectedData,
    clearSelection,
    updateSelection,
  }
}