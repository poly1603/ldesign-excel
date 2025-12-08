import type { App, Plugin } from 'vue';
import ExcelViewer from './components/ExcelViewer.vue';

// 导出组件
export { ExcelViewer };

// 导出 composables
export {
  useExcelViewer,
  useFileDrop,
  type UseExcelViewerReturn,
  type UseFileDropOptions,
  type UseFileDropReturn
} from './composables';

// 从 core 包重新导出类型
export type {
  Workbook,
  Sheet,
  Cell,
  RenderOptions,
  RenderTheme,
  ToolbarConfig,
  ExcelViewerOptions,
  EventType,
  EventData,
  LoadEvent,
  LoadErrorEvent,
  SheetChangeEvent,
  CellClickEvent,
  SelectionChangeEvent,
  ZoomEvent
} from '@excel-viewer/core';

// 从 core 包重新导出常量
export { RENDER_THEMES, DEFAULT_RENDER_OPTIONS } from '@excel-viewer/core';

/**
 * Vue 插件安装函数
 */
export const ExcelViewerPlugin: Plugin = {
  install(app: App) {
    app.component('ExcelViewer', ExcelViewer);
  }
};

// 默认导出插件
export default ExcelViewerPlugin;
