import type { Theme } from '../../types'

/**
 * 亮色主题
 */
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: '#ffffff',
    foreground: '#000000',
    grid: '#e0e0e0',
    gridStrong: '#c0c0c0',
    headerBg: '#f5f5f5',
    headerText: '#333333',
    headerBorder: '#d0d0d0',
    selection: 'rgba(66, 133, 244, 0.2)',
    selectionBorder: '#4285f4',
    activeCell: 'rgba(66, 133, 244, 0.1)',
    activeCellBorder: '#4285f4',
    frozenLine: '#4285f4',
    scrollbar: '#f0f0f0',
    scrollbarThumb: '#c0c0c0',
    hover: 'rgba(0, 0, 0, 0.05)',
  },
  fonts: {
    default: 'Arial, sans-serif',
    size: 14,
    header: 'Arial, sans-serif',
    headerSize: 12,
  },
  spacing: {
    cellPadding: 5,
    rowHeight: 25,
    colWidth: 100,
    headerHeight: 30,
    headerWidth: 50,
  },
  borders: {
    width: 1,
    style: 'solid',
    selectionWidth: 2,
  },
}