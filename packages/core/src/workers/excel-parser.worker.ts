/**
 * Excel 解析 Web Worker
 * 在后台线程解析 Excel 文件，避免阻塞主线程
 */

import * as XLSX from 'xlsx';

/**
 * Worker 消息类型
 */
enum WorkerMessageType {
  PARSE_FILE = 'PARSE_FILE',
  PARSE_ARRAY_BUFFER = 'PARSE_ARRAY_BUFFER',
  PARSE_CHUNK = 'PARSE_CHUNK',
  CANCEL = 'CANCEL',
}

/**
 * Worker 响应类型
 */
enum WorkerResponseType {
  PROGRESS = 'PROGRESS',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

/**
 * Worker 消息接口
 */
interface WorkerMessage {
  type: WorkerMessageType;
  id: string;
  payload: any;
}

/**
 * Worker 响应接口
 */
interface WorkerResponse {
  type: WorkerResponseType;
  id: string;
  payload: any;
}

/**
 * 当前正在处理的任务
 */
let currentTaskId: string | null = null;
let isCancelled = false;

/**
 * 处理 Worker 消息
 */
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, id, payload } = event.data;

  try {
    switch (type) {
      case WorkerMessageType.PARSE_FILE:
        await parseFile(id, payload);
        break;

      case WorkerMessageType.PARSE_ARRAY_BUFFER:
        await parseArrayBuffer(id, payload);
        break;

      case WorkerMessageType.PARSE_CHUNK:
        await parseChunk(id, payload);
        break;

      case WorkerMessageType.CANCEL:
        cancelTask(id);
        break;

      default:
        sendError(id, new Error(`Unknown message type: ${type}`));
    }
  } catch (error) {
    sendError(id, error as Error);
  }
});

/**
 * 解析文件
 */
async function parseFile(id: string, file: File): Promise<void> {
  currentTaskId = id;
  isCancelled = false;

  try {
    sendProgress(id, 0, '开始读取文件...');

    const arrayBuffer = await file.arrayBuffer();

    if (isCancelled) return;

    sendProgress(id, 20, '开始解析文件...');

    const sheets = await parseArrayBufferInternal(id, arrayBuffer);

    if (isCancelled) return;

    sendSuccess(id, sheets);
  } catch (error) {
    sendError(id, error as Error);
  } finally {
    currentTaskId = null;
  }
}

/**
 * 解析 ArrayBuffer
 */
async function parseArrayBuffer(id: string, arrayBuffer: ArrayBuffer): Promise<void> {
  currentTaskId = id;
  isCancelled = false;

  try {
    const sheets = await parseArrayBufferInternal(id, arrayBuffer);

    if (isCancelled) return;

    sendSuccess(id, sheets);
  } catch (error) {
    sendError(id, error as Error);
  } finally {
    currentTaskId = null;
  }
}

/**
 * 内部解析 ArrayBuffer
 */
async function parseArrayBufferInternal(id: string, arrayBuffer: ArrayBuffer): Promise<any[]> {
  sendProgress(id, 30, '正在解析工作簿...');

  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellStyles: true,
    cellFormula: true,
    cellDates: true,
    cellNF: true,
  });

  if (isCancelled) return [];

  sendProgress(id, 50, '正在解析工作表...');

  const sheets: any[] = [];
  const sheetCount = workbook.SheetNames.length;

  for (let i = 0; i < sheetCount; i++) {
    if (isCancelled) return [];

    const sheetName = workbook.SheetNames[i];
    const worksheet = workbook.Sheets[sheetName];

    sendProgress(
      id,
      50 + (i / sheetCount) * 40,
      `正在解析工作表 ${i + 1}/${sheetCount}: ${sheetName}`
    );

    const sheetData = parseWorksheet(worksheet, sheetName, i);
    sheets.push(sheetData);

    // 每解析一个工作表后让出控制权
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  sendProgress(id, 100, '解析完成');

  return sheets;
}

/**
 * 解析工作表
 */
function parseWorksheet(worksheet: XLSX.WorkSheet, name: string, index: number): any {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const data: any[][] = [];
  const merges: any[] = [];
  const rows: any[] = [];
  const columns: any[] = [];

  // 解析单元格数据
  for (let R = range.s.r; R <= range.e.r; ++R) {
    const row: any[] = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cellAddress];
      row.push(parseCell(cell));
    }
    data.push(row);
  }

  // 解析合并单元格
  if (worksheet['!merges']) {
    worksheet['!merges'].forEach((merge: any) => {
      merges.push({
        r: merge.s.r,
        c: merge.s.c,
        rs: merge.e.r - merge.s.r + 1,
        cs: merge.e.c - merge.s.c + 1,
      });
    });
  }

  // 解析行高
  if (worksheet['!rows']) {
    worksheet['!rows'].forEach((row: any, idx: number) => {
      if (row) {
        rows.push({
          index: idx,
          height: row.hpx || row.hpt,
          hidden: row.hidden || false,
        });
      }
    });
  }

  // 解析列宽
  if (worksheet['!cols']) {
    worksheet['!cols'].forEach((col: any, idx: number) => {
      if (col) {
        columns.push({
          index: idx,
          width: col.wpx || col.wch,
          hidden: col.hidden || false,
        });
      }
    });
  }

  return {
    name,
    index,
    data,
    merges: merges.length > 0 ? merges : undefined,
    rows: rows.length > 0 ? rows : undefined,
    columns: columns.length > 0 ? columns : undefined,
  };
}

/**
 * 解析单元格
 */
function parseCell(cell: XLSX.CellObject | undefined): any {
  if (!cell) {
    return {};
  }

  const cellData: any = {
    v: cell.v,
    t: cell.t,
    w: cell.w,
  };

  if (cell.f) cellData.f = cell.f;
  if (cell.z) cellData.z = cell.z;
  if (cell.s) cellData.s = parseCellStyle(cell.s);

  return cellData;
}

/**
 * 解析单元格样式
 */
function parseCellStyle(style: any): any {
  const cellStyle: any = {};

  if (style.font) {
    cellStyle.font = {
      name: style.font.name,
      size: style.font.sz,
      bold: style.font.bold,
      italic: style.font.italic,
      underline: style.font.underline,
      strike: style.font.strike,
      color: style.font.color?.rgb || style.font.color?.theme,
    };
  }

  if (style.fill) {
    cellStyle.fill = {
      type: style.fill.patternType,
      fgColor: style.fill.fgColor?.rgb || style.fill.fgColor?.theme,
      bgColor: style.fill.bgColor?.rgb || style.fill.bgColor?.theme,
      pattern: style.fill.pattern,
    };
  }

  if (style.border) {
    cellStyle.border = {
      top: style.border.top
        ? { style: style.border.top.style, color: style.border.top.color?.rgb }
        : undefined,
      bottom: style.border.bottom
        ? { style: style.border.bottom.style, color: style.border.bottom.color?.rgb }
        : undefined,
      left: style.border.left
        ? { style: style.border.left.style, color: style.border.left.color?.rgb }
        : undefined,
      right: style.border.right
        ? { style: style.border.right.style, color: style.border.right.color?.rgb }
        : undefined,
    };
  }

  if (style.alignment) {
    cellStyle.alignment = {
      horizontal: style.alignment.horizontal,
      vertical: style.alignment.vertical,
      wrapText: style.alignment.wrapText,
      textRotation: style.alignment.textRotation,
    };
  }

  if (style.numFmt) {
    cellStyle.numFmt = style.numFmt;
  }

  return cellStyle;
}

/**
 * 分块解析
 */
async function parseChunk(id: string, payload: { arrayBuffer: ArrayBuffer; chunkIndex: number; totalChunks: number }): Promise<void> {
  // TODO: 实现真正的分块解析逻辑
  // 这里简化处理，实际应该按块读取和解析
  sendError(id, new Error('Chunk parsing not implemented yet'));
}

/**
 * 取消任务
 */
function cancelTask(id: string): void {
  if (currentTaskId === id) {
    isCancelled = true;
    currentTaskId = null;
  }
}

/**
 * 发送进度
 */
function sendProgress(id: string, progress: number, message: string): void {
  const response: WorkerResponse = {
    type: WorkerResponseType.PROGRESS,
    id,
    payload: {
      progress,
      message,
    },
  };
  self.postMessage(response);
}

/**
 * 发送成功响应
 */
function sendSuccess(id: string, data: any): void {
  const response: WorkerResponse = {
    type: WorkerResponseType.SUCCESS,
    id,
    payload: data,
  };
  self.postMessage(response);
}

/**
 * 发送错误响应
 */
function sendError(id: string, error: Error): void {
  const response: WorkerResponse = {
    type: WorkerResponseType.ERROR,
    id,
    payload: {
      message: error.message,
      stack: error.stack,
    },
  };
  self.postMessage(response);
}

/**
 * 导出类型供主线程使用
 */
export type {
  WorkerMessage,
  WorkerResponse,
};

export {
  WorkerMessageType,
  WorkerResponseType,
};


