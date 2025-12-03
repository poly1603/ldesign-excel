import type { LocaleMessages } from '../../types'

/**
 * English (US) locale
 */
export const enUS: LocaleMessages = {
  toolbar: {
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    export: 'Export',
    search: 'Search',
    print: 'Print',
    undo: 'Undo',
    redo: 'Redo',
  },
  contextMenu: {
    copy: 'Copy',
    paste: 'Paste',
    cut: 'Cut',
    delete: 'Delete',
    insertRow: 'Insert Row',
    insertCol: 'Insert Column',
    deleteRow: 'Delete Row',
    deleteCol: 'Delete Column',
    clearContent: 'Clear Content',
    clearFormat: 'Clear Format',
  },
  filter: {
    filterBy: 'Filter',
    sortAsc: 'Sort Ascending',
    sortDesc: 'Sort Descending',
    clearFilter: 'Clear Filter',
    customFilter: 'Custom Filter',
    searchPlaceholder: 'Search...',
  },
  errors: {
    fileNotSupported: 'File format not supported',
    parseError: 'Failed to parse file',
    formulaError: 'Formula calculation error',
    loadError: 'Failed to load',
    exportError: 'Failed to export',
    invalidRange: 'Invalid range',
    networkError: 'Network error',
  },
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',
    warning: 'Warning',
    error: 'Error',
    success: 'Success',
    loading: 'Loading...',
  },
}