/**
 * 格式导出器
 * 支持 Markdown、ODS 等格式
 */

import { logger } from '../errors';
import type { SheetData, CellData } from '../types';

/**
 * Markdown 导出器
 */
export class MarkdownExporter {
  /**
   * 导出为 Markdown 表格
   */
  export(sheets: SheetData[]): string {
    let markdown = '';

    sheets.forEach((sheet, index) => {
      if (index > 0) {
        markdown += '\n\n';
      }

      // 工作表标题
      if (sheets.length > 1) {
        markdown += `## ${sheet.name}\n\n`;
      }

      // 转换表格
      markdown += this.sheetToMarkdown(sheet);
    });

    logger.info('Exported to Markdown', { sheets: sheets.length });
    return markdown;
  }

  /**
   * 工作表转 Markdown
   */
  private sheetToMarkdown(sheet: SheetData): string {
    if (!sheet.data || sheet.data.length === 0) {
      return '';
    }

    const lines: string[] = [];
    const colCount = sheet.data[0].length;

    // 表头
    const headerRow = sheet.data[0].map((cell) => this.getCellValue(cell));
    lines.push('| ' + headerRow.join(' | ') + ' |');

    // 分隔符
    const separator = '|' + ' --- |'.repeat(colCount);
    lines.push(separator);

    // 数据行
    for (let i = 1; i < sheet.data.length; i++) {
      const row = sheet.data[i].map((cell) => this.getCellValue(cell));
      lines.push('| ' + row.join(' | ') + ' |');
    }

    return lines.join('\n');
  }

  /**
   * 获取单元格值
   */
  private getCellValue(cell: CellData): string {
    if (!cell || cell.v === undefined) {
      return '';
    }

    let value = cell.w || String(cell.v);

    // 转义 Markdown 特殊字符
    value = value
      .replace(/\|/g, '\\|')
      .replace(/\n/g, '<br>')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_');

    return value;
  }
}

/**
 * XML 导出器
 */
export class XMLExporter {
  /**
   * 导出为 XML
   */
  export(sheets: SheetData[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<workbook>\n';

    sheets.forEach((sheet) => {
      xml += this.sheetToXML(sheet);
    });

    xml += '</workbook>';

    logger.info('Exported to XML', { sheets: sheets.length });
    return xml;
  }

  /**
   * 工作表转 XML
   */
  private sheetToXML(sheet: SheetData): string {
    let xml = `  <sheet name="${this.escapeXML(sheet.name)}" index="${sheet.index}">\n`;
    xml += '    <data>\n';

    sheet.data.forEach((row, rowIndex) => {
      xml += `      <row index="${rowIndex}">\n`;

      row.forEach((cell, colIndex) => {
        if (cell && cell.v !== undefined) {
          xml += `        <cell col="${colIndex}"`;
          if (cell.t) xml += ` type="${cell.t}"`;
          if (cell.f) xml += ` formula="${this.escapeXML(cell.f)}"`;
          xml += `>${this.escapeXML(String(cell.v))}</cell>\n`;
        }
      });

      xml += '      </row>\n';
    });

    xml += '    </data>\n';
    xml += '  </sheet>\n';

    return xml;
  }

  /**
   * XML 转义
   */
  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

/**
 * 图片导出增强器
 */
export class EnhancedImageExporter {
  /**
   * 导出为高 DPI 图片
   */
  async exportHighDPI(
    element: HTMLElement,
    options?: {
      format?: 'png' | 'jpeg' | 'webp';
      quality?: number;
      scale?: number;
    }
  ): Promise<Blob> {
    const scale = options?.scale || window.devicePixelRatio || 2;
    const format = options?.format || 'png';
    const quality = options?.quality || 0.92;

    // 使用 html2canvas 或类似库
    // 这里提供框架,实际需要集成库
    logger.info('Exporting high DPI image', { format, scale, quality });

    // 创建临时 canvas
    const canvas = document.createElement('canvas');
    const rect = element.getBoundingClientRect();

    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.scale(scale, scale);

    // TODO: 实际的渲染逻辑需要使用 html2canvas 或其他库

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        },
        `image/${format}`,
        quality
      );
    });
  }

  /**
   * 导出选区为图片
   */
  async exportSelection(
    element: HTMLElement,
    selection: { startRow: number; startCol: number; endRow: number; endCol: number },
    options?: {
      format?: 'png' | 'jpeg' | 'webp';
      quality?: number;
    }
  ): Promise<Blob> {
    // 计算选区位置
    // 裁剪并导出
    logger.info('Exporting selection as image', { selection });

    // 简化实现
    return this.exportHighDPI(element, options);
  }

  /**
   * 添加水印
   */
  async addWatermark(
    imageBlob: Blob,
    watermarkText: string,
    options?: {
      position?: 'center' | 'top-right' | 'bottom-right';
      opacity?: number;
      fontSize?: number;
    }
  ): Promise<Blob> {
    const position = options?.position || 'bottom-right';
    const opacity = options?.opacity || 0.3;
    const fontSize = options?.fontSize || 20;

    // 加载图片
    const img = await this.loadImage(imageBlob);

    // 创建 canvas
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // 绘制原图
    ctx.drawImage(img, 0, 0);

    // 绘制水印
    ctx.globalAlpha = opacity;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = '#999';

    let x = 0;
    let y = 0;

    switch (position) {
      case 'center':
        x = canvas.width / 2;
        y = canvas.height / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        break;
      case 'top-right':
        x = canvas.width - 10;
        y = 30;
        ctx.textAlign = 'right';
        break;
      case 'bottom-right':
        x = canvas.width - 10;
        y = canvas.height - 10;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        break;
    }

    ctx.fillText(watermarkText, x, y);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create watermarked image'));
        }
      }, 'image/png');
    });
  }

  /**
   * 加载图片
   */
  private loadImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }
}

/**
 * 格式转换工具
 */
export class FormatConverter {
  /**
   * CSV 转 JSON
   */
  csvToJSON(csv: string): any[] {
    const lines = csv.split('\n').filter((line) => line.trim());

    if (lines.length === 0) {
      return [];
    }

    const headers = this.parseCSVLine(lines[0]);
    const result: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const obj: any = {};

      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });

      result.push(obj);
    }

    return result;
  }

  /**
   * JSON 转 CSV
   */
  jsonToCSV(data: any[]): string {
    if (data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const lines: string[] = [];

    // 添加表头
    lines.push(headers.map((h) => this.escapeCSV(h)).join(','));

    // 添加数据行
    data.forEach((row) => {
      const values = headers.map((h) => this.escapeCSV(String(row[h] || '')));
      lines.push(values.join(','));
    });

    return lines.join('\n');
  }

  /**
   * 解析 CSV 行
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * CSV 转义
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}


