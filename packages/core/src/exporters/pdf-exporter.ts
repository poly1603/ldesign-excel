/**
 * PDF 导出器
 * 提供 PDF 导出功能的基础框架
 * 注意: 实际使用需要集成 jsPDF 或 pdfmake 库
 */

import { logger } from '../errors';
import type { SheetData, PrintConfig } from '../types';

/**
 * PDF 导出选项
 */
export interface PDFExportOptions {
  /** 文件名 */
  filename?: string;
  /** 页面配置 */
  pageConfig?: PrintConfig;
  /** 是否包含样式 */
  includeStyles?: boolean;
  /** 工作表选择 */
  sheets?: number[];
  /** 页眉 */
  header?: string;
  /** 页脚 */
  footer?: string;
  /** 作者 */
  author?: string;
  /** 标题 */
  title?: string;
}

/**
 * PDF 导出器
 * 
 * 使用说明:
 * 1. 安装依赖: npm install jspdf jspdf-autotable
 * 2. 导入库: import jsPDF from 'jspdf'; import 'jspdf-autotable';
 * 3. 使用本类进行导出
 */
export class PDFExporter {
  /**
   * 导出为 PDF
   * 
   * 注意: 这是一个框架实现,实际使用需要集成 jsPDF 库
   * 
   * @example
   * ```typescript
   * // 首先安装: npm install jspdf jspdf-autotable
   * import jsPDF from 'jspdf';
   * import 'jspdf-autotable';
   * 
   * const exporter = new PDFExporter();
   * const blob = await exporter.export(sheets, options, jsPDF);
   * ```
   */
  async export(
    sheets: SheetData[],
    options: PDFExportOptions = {},
    jsPDFClass?: any // 外部传入的 jsPDF 类
  ): Promise<Blob> {
    if (!jsPDFClass) {
      throw new Error(
        'jsPDF 库未提供。请安装 jsPDF: npm install jspdf jspdf-autotable'
      );
    }

    logger.info('Starting PDF export', {
      sheets: sheets.length,
      filename: options.filename,
    });

    try {
      // 创建 PDF 文档
      const doc = new jsPDFClass({
        orientation: options.pageConfig?.orientation || 'portrait',
        unit: 'mm',
        format: this.getPaperSize(options.pageConfig?.paperSize),
      });

      // 设置文档属性
      if (options.title) doc.setProperties({ title: options.title });
      if (options.author) doc.setProperties({ author: options.author });

      // 导出选定的工作表
      const sheetsToExport = options.sheets
        ? sheets.filter((s) => options.sheets!.includes(s.index))
        : sheets;

      sheetsToExport.forEach((sheet, index) => {
        if (index > 0) {
          doc.addPage();
        }

        this.exportSheet(doc, sheet, options);
      });

      // 生成 Blob
      const pdfBlob = doc.output('blob');

      logger.info('PDF export completed');
      return pdfBlob;
    } catch (error) {
      logger.error('PDF export failed', error as Error);
      throw error;
    }
  }

  /**
   * 导出单个工作表
   */
  private exportSheet(doc: any, sheet: SheetData, options: PDFExportOptions): void {
    // 添加工作表标题
    doc.setFontSize(16);
    doc.text(sheet.name, 14, 15);

    // 准备表格数据
    const tableData = this.prepareTableData(sheet);

    // 使用 autoTable 插件绘制表格
    if (doc.autoTable) {
      doc.autoTable({
        head: [tableData.headers],
        body: tableData.body,
        startY: 25,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [66, 114, 196],
          textColor: 255,
          fontStyle: 'bold',
        },
        columnStyles: options.includeStyles ? this.getColumnStyles(sheet) : undefined,
      });
    }
  }

  /**
   * 准备表格数据
   */
  private prepareTableData(sheet: SheetData): {
    headers: string[];
    body: string[][];
  } {
    if (!sheet.data || sheet.data.length === 0) {
      return { headers: [], body: [] };
    }

    // 使用第一行作为表头
    const headers = sheet.data[0].map((cell) => this.getCellValue(cell));

    // 其余行作为数据
    const body = sheet.data.slice(1).map((row) =>
      row.map((cell) => this.getCellValue(cell))
    );

    return { headers, body };
  }

  /**
   * 获取单元格值
   */
  private getCellValue(cell: any): string {
    if (!cell || cell.v === undefined) {
      return '';
    }

    if (cell.w) {
      return cell.w;
    }

    return String(cell.v);
  }

  /**
   * 获取列样式
   */
  private getColumnStyles(sheet: SheetData): Record<number, any> {
    // 简化实现,返回空对象
    // 实际应该解析单元格样式并转换为 jsPDF 样式
    return {};
  }

  /**
   * 获取纸张大小
   */
  private getPaperSize(size?: string): string {
    const sizeMap: Record<string, string> = {
      A4: 'a4',
      A3: 'a3',
      Letter: 'letter',
      Legal: 'legal',
    };

    return sizeMap[size || 'A4'] || 'a4';
  }

  /**
   * 下载 PDF
   */
  async download(
    sheets: SheetData[],
    options: PDFExportOptions = {},
    jsPDFClass?: any
  ): Promise<void> {
    const blob = await this.export(sheets, options, jsPDFClass);
    const filename = options.filename || 'export.pdf';

    // 下载文件
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logger.info('PDF downloaded', { filename });
  }
}

/**
 * PDF 导出工具函数
 */
export const PDFExportUtils = {
  /**
   * 检查 jsPDF 是否可用
   */
  isJsPDFAvailable(): boolean {
    try {
      // 尝试引用 jsPDF
      return typeof window !== 'undefined' && 'jspdf' in window;
    } catch {
      return false;
    }
  },

  /**
   * 获取安装说明
   */
  getInstallInstructions(): string {
    return `
要使用 PDF 导出功能,请安装 jsPDF 库:

npm install jspdf jspdf-autotable

然后在代码中导入:

import jsPDF from 'jspdf';
import 'jspdf-autotable';

const exporter = new PDFExporter();
const blob = await exporter.export(sheets, options, jsPDF);
    `.trim();
  },
};

