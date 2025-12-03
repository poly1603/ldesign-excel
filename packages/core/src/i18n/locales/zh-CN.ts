import type { LocaleMessages } from '../../types'

/**
 * 简体中文语言包
 */
export const zhCN: LocaleMessages = {
  toolbar: {
    zoomIn: '放大',
    zoomOut: '缩小',
    export: '导出',
    search: '搜索',
    print: '打印',
    undo: '撤销',
    redo: '重做',
  },
  contextMenu: {
    copy: '复制',
    paste: '粘贴',
    cut: '剪切',
    delete: '删除',
    insertRow: '插入行',
    insertCol: '插入列',
    deleteRow: '删除行',
    deleteCol: '删除列',
    clearContent: '清除内容',
    clearFormat: '清除格式',
  },
  filter: {
    filterBy: '筛选',
    sortAsc: '升序排序',
    sortDesc: '降序排序',
    clearFilter: '清除筛选',
    customFilter: '自定义筛选',
    searchPlaceholder: '搜索...',
  },
  errors: {
    fileNotSupported: '不支持的文件格式',
    parseError: '文件解析失败',
    formulaError: '公式计算错误',
    loadError: '加载失败',
    exportError: '导出失败',
    invalidRange: '无效的范围',
    networkError: '网络错误',
  },
  common: {
    ok: '确定',
    cancel: '取消',
    close: '关闭',
    confirm: '确认',
    warning: '警告',
    error: '错误',
    success: '成功',
    loading: '加载中...',
  },
}