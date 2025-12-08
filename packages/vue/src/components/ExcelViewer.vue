<template>
  <div ref="containerRef" class="excel-viewer-container" :style="containerStyle">
    <slot name="loading" v-if="isLoading">
      <div class="excel-viewer-loading-overlay">
        <div class="excel-viewer-spinner"></div>
        <span>{{ loadingText }}</span>
      </div>
    </slot>
    <slot name="error" v-if="error" :error="error">
      <div class="excel-viewer-error-overlay">
        <span class="error-icon">⚠️</span>
        <span>{{ error.message }}</span>
        <button @click="retry" class="retry-btn">重试</button>
      </div>
    </slot>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted, watch, type PropType } from 'vue';
import {
  ExcelViewer as CoreExcelViewer,
  type ExcelViewerOptions,
  type RenderOptions,
  type ToolbarConfig,
  type Workbook,
  type Sheet,
  type Cell,
  type EventData,
  type LoadEvent,
  type LoadErrorEvent,
  type SheetChangeEvent,
  type CellClickEvent,
  type SelectionChangeEvent,
  type ZoomEvent
} from '@excel-viewer/core';

export default defineComponent({
  name: 'ExcelViewer',

  props: {
    /**
     * Excel 文件 URL
     */
    src: {
      type: String,
      default: ''
    },

    /**
     * Excel 文件对象
     */
    file: {
      type: Object as PropType<File | null>,
      default: null
    },

    /**
     * Excel 文件数据
     */
    data: {
      type: Object as PropType<ArrayBuffer | Uint8Array | null>,
      default: null
    },

    /**
     * 渲染选项
     */
    renderOptions: {
      type: Object as PropType<Partial<RenderOptions>>,
      default: () => ({})
    },

    /**
     * 工具栏配置
     */
    toolbar: {
      type: Object as PropType<Partial<ToolbarConfig>>,
      default: () => ({})
    },

    /**
     * 是否只读
     */
    readonly: {
      type: Boolean,
      default: true
    },

    /**
     * 是否启用选择
     */
    enableSelection: {
      type: Boolean,
      default: true
    },

    /**
     * 缩放比例
     */
    zoom: {
      type: Number,
      default: 1
    },

    /**
     * 当前工作表索引
     */
    sheetIndex: {
      type: Number,
      default: 0
    },

    /**
     * 容器宽度
     */
    width: {
      type: [String, Number],
      default: '100%'
    },

    /**
     * 容器高度
     */
    height: {
      type: [String, Number],
      default: '100%'
    },

    /**
     * 加载中文本
     */
    loadingText: {
      type: String,
      default: '加载中...'
    }
  },

  emits: [
    'load',
    'load-error',
    'sheet-change',
    'cell-click',
    'cell-double-click',
    'cell-right-click',
    'selection-change',
    'zoom-change',
    'update:zoom',
    'update:sheetIndex'
  ],

  setup(props, { emit, expose }) {
    const containerRef = ref<HTMLElement | null>(null);
    const viewer = ref<CoreExcelViewer | null>(null);
    const isLoading = ref(false);
    const error = ref<Error | null>(null);
    const workbook = ref<Workbook | null>(null);

    // 容器样式
    const containerStyle = computed(() => ({
      width: typeof props.width === 'number' ? `${props.width}px` : props.width,
      height: typeof props.height === 'number' ? `${props.height}px` : props.height
    }));

    // 初始化查看器
    const initViewer = () => {
      if (!containerRef.value) return;

      const options: ExcelViewerOptions = {
        container: containerRef.value,
        renderOptions: {
          ...props.renderOptions,
          zoom: props.zoom
        },
        toolbar: props.toolbar,
        readonly: props.readonly,
        enableSelection: props.enableSelection
      };

      viewer.value = new CoreExcelViewer(options);

      // 绑定事件
      viewer.value.on('load', (data: LoadEvent) => {
        isLoading.value = false;
        workbook.value = data.workbook;
        emit('load', data);
      });

      viewer.value.on('loadError', (data: LoadErrorEvent) => {
        isLoading.value = false;
        error.value = data.error;
        emit('load-error', data);
      });

      viewer.value.on('sheetChange', (data: SheetChangeEvent) => {
        emit('sheet-change', data);
        emit('update:sheetIndex', data.sheetIndex);
      });

      viewer.value.on('cellClick', (data: CellClickEvent) => {
        emit('cell-click', data);
      });

      viewer.value.on('cellDoubleClick', (data: CellClickEvent) => {
        emit('cell-double-click', data);
      });

      viewer.value.on('cellRightClick', (data: CellClickEvent) => {
        emit('cell-right-click', data);
      });

      viewer.value.on('selectionChange', (data: SelectionChangeEvent) => {
        emit('selection-change', data);
      });

      viewer.value.on('zoom', (data: ZoomEvent) => {
        emit('zoom-change', data);
        emit('update:zoom', data.zoom);
      });
    };

    // 加载内容
    const load = async () => {
      console.log('[ExcelViewer.vue] load() called, viewer:', !!viewer.value, 'file:', !!props.file);
      if (!viewer.value) {
        console.log('[ExcelViewer.vue] viewer not ready');
        return;
      }

      error.value = null;
      isLoading.value = true;

      try {
        if (props.src) {
          console.log('[ExcelViewer.vue] loading from src');
          await viewer.value.loadUrl(props.src);
        } else if (props.file) {
          console.log('[ExcelViewer.vue] loading from file:', props.file.name);
          await viewer.value.loadFile(props.file);
        } else if (props.data) {
          console.log('[ExcelViewer.vue] loading from data');
          await viewer.value.loadData(props.data);
        }
        console.log('[ExcelViewer.vue] load completed');
      } catch (e) {
        console.error('[ExcelViewer.vue] load error:', e);
        error.value = e as Error;
        isLoading.value = false;
      }
    };

    // 重试
    const retry = () => {
      error.value = null;
      load();
    };

    // 暴露的方法
    const getViewer = () => viewer.value;
    const getWorkbook = () => workbook.value;
    const getCurrentSheet = (): Sheet | null => viewer.value?.getCurrentSheet() ?? null;
    const getCell = (address: string): Cell | null => viewer.value?.getCell(address) ?? null;
    const switchSheet = (index: number) => viewer.value?.switchSheet(index);
    const setZoom = (zoom: number) => viewer.value?.setZoom(zoom);
    const zoomIn = () => viewer.value?.zoomIn();
    const zoomOut = () => viewer.value?.zoomOut();
    const toggleFullscreen = () => viewer.value?.toggleFullscreen();
    const print = () => viewer.value?.print();

    // 监听数据源变化
    watch(() => props.src, (newVal) => {
      console.log('[ExcelViewer.vue] src changed:', newVal);
      if (props.src) load();
    });

    watch(() => props.file, (newVal) => {
      console.log('[ExcelViewer.vue] file changed:', newVal?.name);
      if (props.file) load();
    });

    watch(() => props.data, (newVal) => {
      console.log('[ExcelViewer.vue] data changed:', !!newVal);
      if (props.data) load();
    });

    // 监听缩放变化
    watch(() => props.zoom, (newZoom) => {
      if (viewer.value && newZoom !== undefined) {
        viewer.value.setZoom(newZoom);
      }
    });

    // 监听工作表索引变化
    watch(() => props.sheetIndex, (newIndex) => {
      if (viewer.value && newIndex !== undefined) {
        viewer.value.switchSheet(newIndex);
      }
    });

    // 生命周期
    onMounted(() => {
      console.log('[ExcelViewer.vue] onMounted, file:', props.file?.name);
      initViewer();
      if (props.src || props.file || props.data) {
        console.log('[ExcelViewer.vue] has data source, calling load()');
        load();
      }
    });

    onUnmounted(() => {
      viewer.value?.destroy();
      viewer.value = null;
    });

    // 暴露方法
    expose({
      getViewer,
      getWorkbook,
      getCurrentSheet,
      getCell,
      switchSheet,
      setZoom,
      zoomIn,
      zoomOut,
      toggleFullscreen,
      print,
      load,
      retry
    });

    return {
      containerRef,
      isLoading,
      error,
      containerStyle,
      retry
    };
  }
});
</script>

<style scoped>
.excel-viewer-container {
  position: relative;
  overflow: hidden;
}

.excel-viewer-loading-overlay,
.excel-viewer-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  z-index: 100;
  gap: 12px;
}

.excel-viewer-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  font-size: 48px;
}

.retry-btn {
  padding: 8px 24px;
  border: 1px solid #2196f3;
  border-radius: 4px;
  background: #2196f3;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #1976d2;
}
</style>
