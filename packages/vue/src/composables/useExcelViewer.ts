/**
 * Excel 查看器 Composable
 * @description 提供 Excel 查看器的响应式状态和方法
 */
import { ref, shallowRef, readonly, onUnmounted, type Ref } from 'vue';
import {
  ExcelViewer,
  type ExcelViewerOptions,
  type Workbook,
  type Sheet,
  type Cell,
  type CellRange,
  type CellAddress,
  type EventData,
  type LoadEvent,
  type LoadErrorEvent,
  type SheetChangeEvent,
  type CellClickEvent,
  type SelectionChangeEvent,
  type ZoomEvent
} from '@excel-viewer/core';

/**
 * useExcelViewer 返回值类型
 */
export interface UseExcelViewerReturn {
  /** 查看器实例 */
  viewer: Ref<ExcelViewer | null>;
  /** 工作簿数据 */
  workbook: Ref<Workbook | null>;
  /** 当前工作表 */
  currentSheet: Ref<Sheet | null>;
  /** 当前工作表索引 */
  currentSheetIndex: Ref<number>;
  /** 是否正在加载 */
  isLoading: Ref<boolean>;
  /** 加载错误 */
  error: Ref<Error | null>;
  /** 当前选区 */
  selection: Ref<CellRange | null>;
  /** 活动单元格 */
  activeCell: Ref<CellAddress | null>;
  /** 缩放比例 */
  zoom: Ref<number>;
  /** 初始化查看器 */
  init: (options: ExcelViewerOptions) => void;
  /** 加载文件 */
  loadFile: (file: File) => Promise<void>;
  /** 加载 URL */
  loadUrl: (url: string) => Promise<void>;
  /** 加载数据 */
  loadData: (data: ArrayBuffer | Uint8Array | Blob) => Promise<void>;
  /** 切换工作表 */
  switchSheet: (index: number) => void;
  /** 获取单元格 */
  getCell: (address: string) => Cell | null;
  /** 设置缩放 */
  setZoom: (zoom: number) => void;
  /** 放大 */
  zoomIn: () => void;
  /** 缩小 */
  zoomOut: () => void;
  /** 切换全屏 */
  toggleFullscreen: () => void;
  /** 打印 */
  print: () => void;
  /** 销毁 */
  destroy: () => void;
}

/**
 * Excel 查看器 Composable
 */
export function useExcelViewer(): UseExcelViewerReturn {
  const viewer = shallowRef<ExcelViewer | null>(null);
  const workbook = shallowRef<Workbook | null>(null);
  const currentSheet = shallowRef<Sheet | null>(null);
  const currentSheetIndex = ref(0);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const selection = ref<CellRange | null>(null);
  const activeCell = ref<CellAddress | null>(null);
  const zoom = ref(1);

  /**
   * 初始化查看器
   */
  const init = (options: ExcelViewerOptions) => {
    if (viewer.value) {
      viewer.value.destroy();
    }

    viewer.value = new ExcelViewer(options);

    // 绑定事件
    viewer.value.on('load', (data: LoadEvent) => {
      isLoading.value = false;
      workbook.value = data.workbook;
      currentSheet.value = data.workbook.sheets[data.workbook.activeSheet] || null;
      currentSheetIndex.value = data.workbook.activeSheet;
    });

    viewer.value.on('loadError', (data: LoadErrorEvent) => {
      isLoading.value = false;
      error.value = data.error;
    });

    viewer.value.on('sheetChange', (data: SheetChangeEvent) => {
      currentSheetIndex.value = data.sheetIndex;
      if (workbook.value) {
        currentSheet.value = workbook.value.sheets[data.sheetIndex] || null;
      }
    });

    viewer.value.on('selectionChange', (data: SelectionChangeEvent) => {
      selection.value = data.selection[0] || null;
      activeCell.value = data.activeCell;
    });

    viewer.value.on('zoom', (data: ZoomEvent) => {
      zoom.value = data.zoom;
    });
  };

  /**
   * 加载文件
   */
  const loadFile = async (file: File) => {
    if (!viewer.value) {
      throw new Error('查看器未初始化');
    }

    isLoading.value = true;
    error.value = null;

    try {
      await viewer.value.loadFile(file);
    } catch (e) {
      error.value = e as Error;
      isLoading.value = false;
      throw e;
    }
  };

  /**
   * 加载 URL
   */
  const loadUrl = async (url: string) => {
    if (!viewer.value) {
      throw new Error('查看器未初始化');
    }

    isLoading.value = true;
    error.value = null;

    try {
      await viewer.value.loadUrl(url);
    } catch (e) {
      error.value = e as Error;
      isLoading.value = false;
      throw e;
    }
  };

  /**
   * 加载数据
   */
  const loadData = async (data: ArrayBuffer | Uint8Array | Blob) => {
    if (!viewer.value) {
      throw new Error('查看器未初始化');
    }

    isLoading.value = true;
    error.value = null;

    try {
      await viewer.value.loadData(data);
    } catch (e) {
      error.value = e as Error;
      isLoading.value = false;
      throw e;
    }
  };

  /**
   * 切换工作表
   */
  const switchSheet = (index: number) => {
    viewer.value?.switchSheet(index);
  };

  /**
   * 获取单元格
   */
  const getCell = (address: string): Cell | null => {
    return viewer.value?.getCell(address) ?? null;
  };

  /**
   * 设置缩放
   */
  const setZoom = (value: number) => {
    viewer.value?.setZoom(value);
  };

  /**
   * 放大
   */
  const zoomIn = () => {
    viewer.value?.zoomIn();
  };

  /**
   * 缩小
   */
  const zoomOut = () => {
    viewer.value?.zoomOut();
  };

  /**
   * 切换全屏
   */
  const toggleFullscreen = () => {
    viewer.value?.toggleFullscreen();
  };

  /**
   * 打印
   */
  const print = () => {
    viewer.value?.print();
  };

  /**
   * 销毁
   */
  const destroy = () => {
    viewer.value?.destroy();
    viewer.value = null;
    workbook.value = null;
    currentSheet.value = null;
  };

  // 组件卸载时销毁
  onUnmounted(() => {
    destroy();
  });

  return {
    viewer: readonly(viewer) as Ref<ExcelViewer | null>,
    workbook: readonly(workbook) as Ref<Workbook | null>,
    currentSheet: readonly(currentSheet) as Ref<Sheet | null>,
    currentSheetIndex: readonly(currentSheetIndex),
    isLoading: readonly(isLoading),
    error: readonly(error),
    selection: readonly(selection),
    activeCell: readonly(activeCell),
    zoom: readonly(zoom),
    init,
    loadFile,
    loadUrl,
    loadData,
    switchSheet,
    getCell,
    setZoom,
    zoomIn,
    zoomOut,
    toggleFullscreen,
    print,
    destroy
  };
}
