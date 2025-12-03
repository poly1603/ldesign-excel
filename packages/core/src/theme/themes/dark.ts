import type { Theme } from '../../types'

/**
 * 暗色主题
 */
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    grid: '#3e3e3e',
    gridStrong: '#5e5e5e',
    headerBg: '#2d2d2d',
    headerText: '#cccccc',
    headerBorder: '#4e4e4e',
    selection: 'rgba(66, 133, 244, 0.3)',
    selectionBorder: '#4285f4',
    activeCell: 'rgba(66, 133, 244, 0.2)',
    activeCellBorder: '#4285f4',
    frozenLine: '#4285f4',
    scrollbar: '#2d2d2d',
    scrollbarThumb: '#5e5e5e',
    hover: 'rgba(255, 255, 255, 0.1)',
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