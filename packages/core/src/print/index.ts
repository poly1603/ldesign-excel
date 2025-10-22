/**
 * 打印支持系统
 * 提供打印预览、页面设置、打印区域选择等功能
 */

import { logger } from '../errors';
import type { PrintConfig } from '../types';

/**
 * 打印方向
 */
export enum PrintOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

/**
 * 纸张大小
 */
export enum PaperSize {
  A4 = 'A4',
  A3 = 'A3',
  LETTER = 'Letter',
  LEGAL = 'Legal',
  TABLOID = 'Tabloid',
}

/**
 * 打印范围
 */
export interface PrintRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  sheetIndex?: number;
}

/**
 * 页面设置
 */
export interface PageSetup {
  /** 纸张大小 */
  paperSize: PaperSize;
  /** 方向 */
  orientation: PrintOrientation;
  /** 边距 (毫米) */
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** 缩放 (百分比) */
  scale: number;
  /** 页眉 */
  header?: {
    left?: string;
    center?: string;
    right?: string;
  };
  /** 页脚 */
  footer?: {
    left?: string;
    center?: string;
    right?: string;
  };
  /** 是否打印网格线 */
  gridLines: boolean;
  /** 是否打印行列标题 */
  headings: boolean;
  /** 是否居中打印 */
  centerHorizontally?: boolean;
  centerVertically?: boolean;
}

/**
 * 打印预览配置
 */
export interface PrintPreviewOptions {
  /** 显示页码 */
  showPageNumbers?: boolean;
  /** 显示工作表名称 */
  showSheetName?: boolean;
  /** 显示打印日期 */
  showPrintDate?: boolean;
}

/**
 * 打印管理器
 */
export class PrintManager {
  private pageSetup: PageSetup;
  private printRange: PrintRange | null = null;

  constructor(config?: Partial<PageSetup>) {
    this.pageSetup = {
      paperSize: PaperSize.A4,
      orientation: PrintOrientation.PORTRAIT,
      margins: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10,
      },
      scale: 100,
      gridLines: false,
      headings: false,
      ...config,
    };
  }

  /**
   * 设置页面配置
   */
  setPageSetup(setup: Partial<PageSetup>): void {
    this.pageSetup = {
      ...this.pageSetup,
      ...setup,
    };
    logger.debug('Page setup updated', this.pageSetup);
  }

  /**
   * 获取页面配置
   */
  getPageSetup(): PageSetup {
    return { ...this.pageSetup };
  }

  /**
   * 设置打印区域
   */
  setPrintRange(range: PrintRange | null): void {
    this.printRange = range;
    logger.debug('Print range set', range);
  }

  /**
   * 获取打印区域
   */
  getPrintRange(): PrintRange | null {
    return this.printRange ? { ...this.printRange } : null;
  }

  /**
   * 生成打印 HTML
   */
  generatePrintHTML(data: any[][], sheetName?: string): string {
    const { paperSize, orientation, margins, scale, header, footer, gridLines, headings } =
      this.pageSetup;

    // 计算打印范围
    const range = this.printRange || {
      startRow: 0,
      startCol: 0,
      endRow: data.length - 1,
      endCol: (data[0]?.length || 0) - 1,
    };

    // 生成样式
    const styles = this.generatePrintStyles(paperSize, orientation, margins, scale, gridLines);

    // 生成表格 HTML
    const tableHTML = this.generateTableHTML(data, range, headings);

    // 生成完整 HTML
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>打印预览${sheetName ? ` - ${sheetName}` : ''}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="print-container">
    ${header ? this.generateHeader(header) : ''}
    <div class="print-content">
      ${tableHTML}
    </div>
    ${footer ? this.generateFooter(footer) : ''}
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * 生成打印样式
   */
  private generatePrintStyles(
    paperSize: PaperSize,
    orientation: PrintOrientation,
    margins: PageSetup['margins'],
    scale: number,
    gridLines: boolean
  ): string {
    const paperSizes: Record<PaperSize, { width: string; height: string }> = {
      [PaperSize.A4]: { width: '210mm', height: '297mm' },
      [PaperSize.A3]: { width: '297mm', height: '420mm' },
      [PaperSize.LETTER]: { width: '8.5in', height: '11in' },
      [PaperSize.LEGAL]: { width: '8.5in', height: '14in' },
      [PaperSize.TABLOID]: { width: '11in', height: '17in' },
    };

    const size = paperSizes[paperSize];
    const isLandscape = orientation === PrintOrientation.LANDSCAPE;

    return `
      @page {
        size: ${isLandscape ? size.height : size.width} ${isLandscape ? size.width : size.height};
        margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: Arial, sans-serif;
        font-size: 10pt;
      }

      .print-container {
        width: 100%;
        height: 100%;
      }

      .print-header, .print-footer {
        display: flex;
        justify-content: space-between;
        padding: 5mm 0;
        font-size: 9pt;
        color: #666;
      }

      .print-content {
        transform: scale(${scale / 100});
        transform-origin: top left;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        page-break-inside: auto;
      }

      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }

      th, td {
        padding: 4px 8px;
        text-align: left;
        ${gridLines ? 'border: 1px solid #ddd;' : ''}
      }

      th {
        background-color: #f5f5f5;
        font-weight: bold;
      }

      @media print {
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .no-print {
          display: none !important;
        }
      }
    `;
  }

  /**
   * 生成表格 HTML
   */
  private generateTableHTML(data: any[][], range: PrintRange, showHeadings: boolean): string {
    let html = '<table>';

    // 添加列标题
    if (showHeadings) {
      html += '<thead><tr><th></th>';
      for (let col = range.startCol; col <= range.endCol; col++) {
        html += `<th>${this.columnIndexToLetter(col)}</th>`;
      }
      html += '</tr></thead>';
    }

    // 添加数据行
    html += '<tbody>';
    for (let row = range.startRow; row <= range.endRow; row++) {
      html += '<tr>';

      // 行标题
      if (showHeadings) {
        html += `<th>${row + 1}</th>`;
      }

      // 单元格数据
      for (let col = range.startCol; col <= range.endCol; col++) {
        const cell = data[row]?.[col];
        const value = this.getCellDisplayValue(cell);
        const style = this.getCellStyle(cell);
        html += `<td${style ? ` style="${style}"` : ''}>${this.escapeHTML(value)}</td>`;
      }

      html += '</tr>';
    }
    html += '</tbody>';

    html += '</table>';
    return html;
  }

  /**
   * 生成页眉
   */
  private generateHeader(header: NonNullable<PageSetup['header']>): string {
    return `
      <div class="print-header">
        <div>${this.escapeHTML(header.left || '')}</div>
        <div>${this.escapeHTML(header.center || '')}</div>
        <div>${this.escapeHTML(header.right || '')}</div>
      </div>
    `;
  }

  /**
   * 生成页脚
   */
  private generateFooter(footer: NonNullable<PageSetup['footer']>): string {
    return `
      <div class="print-footer">
        <div>${this.escapeHTML(footer.left || '')}</div>
        <div>${this.escapeHTML(footer.center || '')}</div>
        <div>${this.escapeHTML(footer.right || '')}</div>
      </div>
    `;
  }

  /**
   * 获取单元格显示值
   */
  private getCellDisplayValue(cell: any): string {
    if (!cell || cell.v === undefined) {
      return '';
    }

    if (cell.w) {
      return cell.w;
    }

    if (cell.t === 'b') {
      return cell.v ? 'TRUE' : 'FALSE';
    }

    return String(cell.v);
  }

  /**
   * 获取单元格样式
   */
  private getCellStyle(cell: any): string {
    if (!cell?.s) {
      return '';
    }

    const styles: string[] = [];

    if (cell.s.font) {
      if (cell.s.font.bold) styles.push('font-weight: bold');
      if (cell.s.font.italic) styles.push('font-style: italic');
      if (cell.s.font.color) styles.push(`color: ${cell.s.font.color}`);
      if (cell.s.font.size) styles.push(`font-size: ${cell.s.font.size}pt`);
    }

    if (cell.s.fill?.fgColor) {
      styles.push(`background-color: ${cell.s.fill.fgColor}`);
    }

    if (cell.s.alignment) {
      if (cell.s.alignment.horizontal) {
        styles.push(`text-align: ${cell.s.alignment.horizontal}`);
      }
      if (cell.s.alignment.vertical) {
        styles.push(`vertical-align: ${cell.s.alignment.vertical}`);
      }
    }

    return styles.join('; ');
  }

  /**
   * 列索引转字母
   */
  private columnIndexToLetter(index: number): string {
    let letter = '';
    let num = index + 1;

    while (num > 0) {
      const remainder = (num - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      num = Math.floor((num - 1) / 26);
    }

    return letter;
  }

  /**
   * HTML 转义
   */
  private escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 打印预览
   */
  printPreview(data: any[][], sheetName?: string): void {
    const html = this.generatePrintHTML(data, sheetName);
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      logger.info('Print preview opened');
    } else {
      logger.error('Failed to open print preview window');
      throw new Error('无法打开打印预览窗口,请检查弹窗拦截设置');
    }
  }

  /**
   * 直接打印
   */
  print(data: any[][], sheetName?: string): void {
    const html = this.generatePrintHTML(data, sheetName);
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();

      // 等待内容加载后打印
      printWindow.onload = () => {
        printWindow.print();
        logger.info('Print dialog opened');
      };
    } else {
      logger.error('Failed to open print window');
      throw new Error('无法打开打印窗口,请检查弹窗拦截设置');
    }
  }

  /**
   * 计算打印页数
   */
  calculatePages(data: any[][], rowsPerPage: number = 50): number {
    const range = this.printRange || {
      startRow: 0,
      endRow: data.length - 1,
    };

    const totalRows = range.endRow - range.startRow + 1;
    return Math.ceil(totalRows / rowsPerPage);
  }
}


