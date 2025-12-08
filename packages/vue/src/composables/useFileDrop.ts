/**
 * 文件拖放 Composable
 * @description 提供文件拖放功能
 */
import { ref, onMounted, onUnmounted, type Ref } from 'vue';

/**
 * useFileDrop 选项
 */
export interface UseFileDropOptions {
  /** 接受的文件类型 */
  accept?: string[];
  /** 是否允许多文件 */
  multiple?: boolean;
  /** 拖放回调 */
  onDrop?: (files: File[]) => void;
  /** 拖入回调 */
  onDragEnter?: () => void;
  /** 拖离回调 */
  onDragLeave?: () => void;
}

/**
 * useFileDrop 返回值
 */
export interface UseFileDropReturn {
  /** 目标元素 ref */
  dropRef: Ref<HTMLElement | null>;
  /** 是否正在拖拽 */
  isDragging: Ref<boolean>;
  /** 拖放的文件 */
  files: Ref<File[]>;
  /** 手动打开文件选择器 */
  openFilePicker: () => void;
}

/**
 * Excel 文件类型
 */
const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'text/csv' // csv
];

const EXCEL_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

/**
 * 文件拖放 Composable
 */
export function useFileDrop(options: UseFileDropOptions = {}): UseFileDropReturn {
  const {
    accept = EXCEL_MIME_TYPES,
    multiple = false,
    onDrop,
    onDragEnter,
    onDragLeave
  } = options;

  const dropRef = ref<HTMLElement | null>(null);
  const isDragging = ref(false);
  const files = ref<File[]>([]);
  const dragCounter = ref(0);

  /**
   * 检查文件是否有效
   */
  const isValidFile = (file: File): boolean => {
    // 检查 MIME 类型
    if (accept.includes(file.type)) {
      return true;
    }

    // 检查扩展名
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return EXCEL_EXTENSIONS.includes(ext);
  };

  /**
   * 过滤有效文件
   */
  const filterValidFiles = (fileList: FileList | null): File[] => {
    if (!fileList) return [];

    const validFiles: File[] = [];
    const maxFiles = multiple ? fileList.length : 1;

    for (let i = 0; i < Math.min(fileList.length, maxFiles); i++) {
      const file = fileList[i];
      if (isValidFile(file)) {
        validFiles.push(file);
      }
    }

    return validFiles;
  };

  /**
   * 处理拖入
   */
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.value++;

    if (dragCounter.value === 1) {
      isDragging.value = true;
      onDragEnter?.();
    }
  };

  /**
   * 处理拖离
   */
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.value--;

    if (dragCounter.value === 0) {
      isDragging.value = false;
      onDragLeave?.();
    }
  };

  /**
   * 处理拖拽中
   */
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  /**
   * 处理拖放
   */
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounter.value = 0;
    isDragging.value = false;

    const validFiles = filterValidFiles(e.dataTransfer?.files ?? null);
    if (validFiles.length > 0) {
      files.value = validFiles;
      onDrop?.(validFiles);
    }
  };

  /**
   * 打开文件选择器
   */
  const openFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = EXCEL_EXTENSIONS.join(',');
    input.multiple = multiple;

    input.addEventListener('change', () => {
      const validFiles = filterValidFiles(input.files);
      if (validFiles.length > 0) {
        files.value = validFiles;
        onDrop?.(validFiles);
      }
    });

    input.click();
  };

  // 绑定事件
  onMounted(() => {
    const el = dropRef.value;
    if (!el) return;

    el.addEventListener('dragenter', handleDragEnter);
    el.addEventListener('dragleave', handleDragLeave);
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('drop', handleDrop);
  });

  // 解绑事件
  onUnmounted(() => {
    const el = dropRef.value;
    if (!el) return;

    el.removeEventListener('dragenter', handleDragEnter);
    el.removeEventListener('dragleave', handleDragLeave);
    el.removeEventListener('dragover', handleDragOver);
    el.removeEventListener('drop', handleDrop);
  });

  return {
    dropRef,
    isDragging,
    files,
    openFilePicker
  };
}
