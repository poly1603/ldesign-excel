/**
 * Excel 文件解析器
 * @description 解析 xlsx 文件格式，提取工作簿、工作表、样式等数据
 */
import JSZip from 'jszip';
import { XmlUtils } from './XmlUtils';
import type {
  Workbook,
  Sheet,
  Cell,
  Row,
  Column,
  CellStyle,
  FontStyle,
  Fill,
  Border,
  BorderSide,
  Alignment,
  Color,
  MergeCell,
  Hyperlink,
  Comment,
  FreezePane,
  AutoFilter,
  DataValidation,
  ConditionalFormatRule,
  Image,
  Chart,
  Table,
  DefinedName,
  Stylesheet,
  Theme,
  DocumentProperties,
  SheetView,
  PrintOptions,
  CellFormula,
  RichText,
  RichTextRun,
  CellValueType,
  PatternType,
  BorderStyleType,
  HorizontalAlignment,
  VerticalAlignment,
  NumberFormat,
  SheetState,
  SheetType
} from '../types';

/**
 * 解析进度回调
 */
export interface ParseProgressCallback {
  (progress: number, message: string): void;
}

/**
 * 解析选项
 */
export interface ParseOptions {
  /** 是否解析样式 */
  parseStyles?: boolean;
  /** 是否解析图片 */
  parseImages?: boolean;
  /** 是否解析图表 */
  parseCharts?: boolean;
  /** 是否解析批注 */
  parseComments?: boolean;
  /** 是否解析数据验证 */
  parseDataValidations?: boolean;
  /** 是否解析条件格式 */
  parseConditionalFormats?: boolean;
  /** 是否解析公式 */
  parseFormulas?: boolean;
  /** 进度回调 */
  onProgress?: ParseProgressCallback;
  /** 密码 (用于加密文件) */
  password?: string;
}

/**
 * 默认解析选项
 */
const DEFAULT_PARSE_OPTIONS: Required<Omit<ParseOptions, 'onProgress' | 'password'>> = {
  parseStyles: true,
  parseImages: true,
  parseCharts: true,
  parseComments: true,
  parseDataValidations: true,
  parseConditionalFormats: true,
  parseFormulas: true
};

/**
 * 内置数字格式
 */
const BUILTIN_NUM_FMTS: Record<number, string> = {
  0: 'General',
  1: '0',
  2: '0.00',
  3: '#,##0',
  4: '#,##0.00',
  9: '0%',
  10: '0.00%',
  11: '0.00E+00',
  12: '# ?/?',
  13: '# ??/??',
  14: 'mm-dd-yy',
  15: 'd-mmm-yy',
  16: 'd-mmm',
  17: 'mmm-yy',
  18: 'h:mm AM/PM',
  19: 'h:mm:ss AM/PM',
  20: 'h:mm',
  21: 'h:mm:ss',
  22: 'm/d/yy h:mm',
  37: '#,##0 ;(#,##0)',
  38: '#,##0 ;[Red](#,##0)',
  39: '#,##0.00;(#,##0.00)',
  40: '#,##0.00;[Red](#,##0.00)',
  45: 'mm:ss',
  46: '[h]:mm:ss',
  47: 'mmss.0',
  48: '##0.0E+0',
  49: '@'
};

/**
 * Excel 文件解析器
 */
export class ExcelParser {
  private zip: JSZip | null = null;
  private options: Required<Omit<ParseOptions, 'onProgress' | 'password'>> & ParseOptions;
  private sharedStrings: Array<string | RichText> = [];
  private stylesheet: Stylesheet | null = null;
  private theme: Theme | null = null;
  private relationships: Map<string, { target: string; type: string }> = new Map();
  private workbookRelationships: Map<string, { target: string; type: string }> = new Map();

  constructor(options: ParseOptions = {}) {
    this.options = { ...DEFAULT_PARSE_OPTIONS, ...options };
  }

  /**
   * 解析 Excel 文件
   */
  async parse(data: ArrayBuffer | Uint8Array | Blob | File): Promise<Workbook> {
    this.reportProgress(0, '开始解析...');

    // 加载 ZIP 文件
    if (data instanceof Blob || data instanceof File) {
      data = await data.arrayBuffer();
    }

    this.zip = await JSZip.loadAsync(data);
    this.reportProgress(10, '解压文件完成');

    // 解析关系文件
    await this.parseRelationships();
    this.reportProgress(15, '解析关系文件完成');

    // 解析主题
    if (this.options.parseStyles) {
      this.theme = await this.parseTheme();
      this.reportProgress(20, '解析主题完成');
    }

    // 解析样式
    if (this.options.parseStyles) {
      this.stylesheet = await this.parseStylesheet();
      this.reportProgress(25, '解析样式完成');
    }

    // 解析共享字符串
    this.sharedStrings = await this.parseSharedStrings();
    this.reportProgress(30, '解析共享字符串完成');

    // 解析工作簿
    const workbook = await this.parseWorkbook();
    this.reportProgress(100, '解析完成');

    return workbook;
  }

  /**
   * 报告进度
   */
  private reportProgress(progress: number, message: string): void {
    if (this.options.onProgress) {
      this.options.onProgress(progress, message);
    }
  }

  /**
   * 读取 ZIP 文件中的 XML
   */
  private async readXml(path: string): Promise<Document | null> {
    if (!this.zip) return null;

    // 移除开头的斜杠
    path = path.replace(/^\//, '');

    const file = this.zip.file(path);
    if (!file) return null;

    const content = await file.async('string');
    return XmlUtils.parse(content);
  }

  /**
   * 读取二进制文件
   */
  private async readBinary(path: string): Promise<Uint8Array | null> {
    if (!this.zip) return null;

    path = path.replace(/^\//, '');
    const file = this.zip.file(path);
    if (!file) return null;

    return await file.async('uint8array');
  }

  /**
   * 解析关系文件
   */
  private async parseRelationships(): Promise<void> {
    // 解析根关系
    const rootRels = await this.readXml('_rels/.rels');
    if (rootRels) {
      XmlUtils.forEachChildByTag(rootRels.documentElement, 'Relationship', (rel) => {
        const id = XmlUtils.getAttr(rel, 'Id');
        const target = XmlUtils.getAttr(rel, 'Target');
        const type = XmlUtils.getAttr(rel, 'Type');
        this.relationships.set(id, { target, type });
      });
    }

    // 解析工作簿关系
    const wbRels = await this.readXml('xl/_rels/workbook.xml.rels');
    if (wbRels) {
      XmlUtils.forEachChildByTag(wbRels.documentElement, 'Relationship', (rel) => {
        const id = XmlUtils.getAttr(rel, 'Id');
        const target = XmlUtils.getAttr(rel, 'Target');
        const type = XmlUtils.getAttr(rel, 'Type');
        this.workbookRelationships.set(id, { target, type });
      });
    }
  }

  /**
   * 解析主题
   */
  private async parseTheme(): Promise<Theme | null> {
    const themeDoc = await this.readXml('xl/theme/theme1.xml');
    if (!themeDoc) return null;

    const themeElements = themeDoc.documentElement;
    const clrScheme = XmlUtils.getChild(
      XmlUtils.getChild(themeElements, 'themeElements'),
      'clrScheme'
    );

    if (!clrScheme) return null;

    const parseColorElement = (el: Element | null): string => {
      if (!el) return '000000';
      const srgbClr = XmlUtils.getChild(el, 'srgbClr');
      if (srgbClr) return XmlUtils.getAttr(srgbClr, 'val', '000000');
      const sysClr = XmlUtils.getChild(el, 'sysClr');
      if (sysClr) return XmlUtils.getAttr(sysClr, 'lastClr', '000000');
      return '000000';
    };

    const colors = {
      dk1: parseColorElement(XmlUtils.getChild(clrScheme, 'dk1')),
      lt1: parseColorElement(XmlUtils.getChild(clrScheme, 'lt1')),
      dk2: parseColorElement(XmlUtils.getChild(clrScheme, 'dk2')),
      lt2: parseColorElement(XmlUtils.getChild(clrScheme, 'lt2')),
      accent1: parseColorElement(XmlUtils.getChild(clrScheme, 'accent1')),
      accent2: parseColorElement(XmlUtils.getChild(clrScheme, 'accent2')),
      accent3: parseColorElement(XmlUtils.getChild(clrScheme, 'accent3')),
      accent4: parseColorElement(XmlUtils.getChild(clrScheme, 'accent4')),
      accent5: parseColorElement(XmlUtils.getChild(clrScheme, 'accent5')),
      accent6: parseColorElement(XmlUtils.getChild(clrScheme, 'accent6')),
      hlink: parseColorElement(XmlUtils.getChild(clrScheme, 'hlink')),
      folHlink: parseColorElement(XmlUtils.getChild(clrScheme, 'folHlink'))
    };

    const fontScheme = XmlUtils.getChild(
      XmlUtils.getChild(themeElements, 'themeElements'),
      'fontScheme'
    );

    const parseFontElement = (el: Element | null): { latin: string; ea: string; cs: string } => {
      return {
        latin: XmlUtils.getAttr(XmlUtils.getChild(el, 'latin'), 'typeface', 'Calibri'),
        ea: XmlUtils.getAttr(XmlUtils.getChild(el, 'ea'), 'typeface', ''),
        cs: XmlUtils.getAttr(XmlUtils.getChild(el, 'cs'), 'typeface', '')
      };
    };

    return {
      name: XmlUtils.getAttr(clrScheme, 'name', 'Office'),
      colors,
      fonts: {
        major: parseFontElement(XmlUtils.getChild(fontScheme, 'majorFont')),
        minor: parseFontElement(XmlUtils.getChild(fontScheme, 'minorFont'))
      }
    };
  }

  /**
   * 解析样式表
   */
  private async parseStylesheet(): Promise<Stylesheet | null> {
    const stylesDoc = await this.readXml('xl/styles.xml');
    if (!stylesDoc) return null;

    const root = stylesDoc.documentElement;

    // 解析数字格式
    const numFmts: NumberFormat[] = [];
    XmlUtils.forEachChildByTag(XmlUtils.getChild(root, 'numFmts'), 'numFmt', (el) => {
      numFmts.push({
        id: XmlUtils.getAttrAsInt(el, 'numFmtId'),
        formatCode: XmlUtils.getAttr(el, 'formatCode')
      });
    });

    // 解析字体
    const fonts: FontStyle[] = [];
    XmlUtils.forEachChildByTag(XmlUtils.getChild(root, 'fonts'), 'font', (el) => {
      fonts.push(this.parseFont(el));
    });

    // 解析填充
    const fills: Fill[] = [];
    XmlUtils.forEachChildByTag(XmlUtils.getChild(root, 'fills'), 'fill', (el) => {
      fills.push(this.parseFill(el));
    });

    // 解析边框
    const borders: Border[] = [];
    XmlUtils.forEachChildByTag(XmlUtils.getChild(root, 'borders'), 'border', (el) => {
      borders.push(this.parseBorder(el));
    });

    // 解析单元格样式
    const cellXfs: CellStyle[] = [];
    XmlUtils.forEachChildByTag(XmlUtils.getChild(root, 'cellXfs'), 'xf', (el) => {
      cellXfs.push(this.parseCellXf(el, fonts, fills, borders, numFmts));
    });

    // 解析单元格样式定义
    const cellStyleXfs: CellStyle[] = [];
    XmlUtils.forEachChildByTag(XmlUtils.getChild(root, 'cellStyleXfs'), 'xf', (el) => {
      cellStyleXfs.push(this.parseCellXf(el, fonts, fills, borders, numFmts));
    });

    // 解析样式名称
    const cellStyles: Array<{ name: string; xfId: number; builtinId?: number }> = [];
    XmlUtils.forEachChildByTag(XmlUtils.getChild(root, 'cellStyles'), 'cellStyle', (el) => {
      cellStyles.push({
        name: XmlUtils.getAttr(el, 'name'),
        xfId: XmlUtils.getAttrAsInt(el, 'xfId'),
        builtinId: XmlUtils.getAttrAsInt(el, 'builtinId')
      });
    });

    return {
      numFmts,
      fonts,
      fills,
      borders,
      cellXfs,
      cellStyleXfs,
      cellStyles
    };
  }

  /**
   * 解析字体
   */
  private parseFont(el: Element): FontStyle {
    const font: FontStyle = {};

    const nameEl = XmlUtils.getChild(el, 'name');
    if (nameEl) font.name = XmlUtils.getAttr(nameEl, 'val');

    const szEl = XmlUtils.getChild(el, 'sz');
    if (szEl) font.size = XmlUtils.getAttrAsNumber(szEl, 'val');

    if (XmlUtils.getChild(el, 'b')) font.bold = true;
    if (XmlUtils.getChild(el, 'i')) font.italic = true;
    if (XmlUtils.getChild(el, 'strike')) font.strikethrough = true;

    const uEl = XmlUtils.getChild(el, 'u');
    if (uEl) {
      const val = XmlUtils.getAttr(uEl, 'val', 'single');
      font.underline = val as FontStyle['underline'];
    }

    const colorEl = XmlUtils.getChild(el, 'color');
    if (colorEl) font.color = this.parseColor(colorEl);

    const vertAlignEl = XmlUtils.getChild(el, 'vertAlign');
    if (vertAlignEl) {
      font.vertAlign = XmlUtils.getAttr(vertAlignEl, 'val') as FontStyle['vertAlign'];
    }

    const familyEl = XmlUtils.getChild(el, 'family');
    if (familyEl) font.family = XmlUtils.getAttrAsInt(familyEl, 'val');

    const schemeEl = XmlUtils.getChild(el, 'scheme');
    if (schemeEl) font.scheme = XmlUtils.getAttr(schemeEl, 'val') as FontStyle['scheme'];

    return font;
  }

  /**
   * 解析颜色
   */
  private parseColor(el: Element): Color {
    const color: Color = {};

    if (XmlUtils.getAttr(el, 'auto')) {
      color.auto = true;
    } else if (XmlUtils.getAttr(el, 'rgb')) {
      color.rgb = XmlUtils.getAttr(el, 'rgb');
    } else if (XmlUtils.getAttr(el, 'theme')) {
      color.theme = XmlUtils.getAttrAsInt(el, 'theme');
      if (XmlUtils.getAttr(el, 'tint')) {
        color.tint = XmlUtils.getAttrAsNumber(el, 'tint');
      }
    } else if (XmlUtils.getAttr(el, 'indexed')) {
      color.indexed = XmlUtils.getAttrAsInt(el, 'indexed');
    }

    return color;
  }

  /**
   * 解析填充
   */
  private parseFill(el: Element): Fill {
    const patternFill = XmlUtils.getChild(el, 'patternFill');
    if (patternFill) {
      const fill: Fill = {
        type: 'pattern',
        pattern: (XmlUtils.getAttr(patternFill, 'patternType', 'none') as PatternType)
      };

      const fgColor = XmlUtils.getChild(patternFill, 'fgColor');
      if (fgColor) fill.fgColor = this.parseColor(fgColor);

      const bgColor = XmlUtils.getChild(patternFill, 'bgColor');
      if (bgColor) fill.bgColor = this.parseColor(bgColor);

      return fill;
    }

    const gradientFill = XmlUtils.getChild(el, 'gradientFill');
    if (gradientFill) {
      const fill: Fill = {
        type: 'gradient',
        gradientType: XmlUtils.getAttr(gradientFill, 'type', 'linear') as 'linear' | 'path',
        degree: XmlUtils.getAttrAsNumber(gradientFill, 'degree', 0),
        stops: []
      };

      XmlUtils.forEachChildByTag(gradientFill, 'stop', (stop) => {
        fill.stops!.push({
          position: XmlUtils.getAttrAsNumber(stop, 'position'),
          color: this.parseColor(XmlUtils.getChild(stop, 'color')!)
        });
      });

      return fill;
    }

    return { type: 'pattern', pattern: 'none' };
  }

  /**
   * 解析边框
   */
  private parseBorder(el: Element): Border {
    const border: Border = {};

    const parseSide = (side: Element | null): BorderSide | undefined => {
      if (!side) return undefined;
      const style = XmlUtils.getAttr(side, 'style');
      if (!style || style === 'none') return undefined;

      const borderSide: BorderSide = {
        style: style as BorderStyleType
      };

      const colorEl = XmlUtils.getChild(side, 'color');
      if (colorEl) borderSide.color = this.parseColor(colorEl);

      return borderSide;
    };

    border.left = parseSide(XmlUtils.getChild(el, 'left'));
    border.right = parseSide(XmlUtils.getChild(el, 'right'));
    border.top = parseSide(XmlUtils.getChild(el, 'top'));
    border.bottom = parseSide(XmlUtils.getChild(el, 'bottom'));
    border.diagonal = parseSide(XmlUtils.getChild(el, 'diagonal'));

    if (XmlUtils.getAttrAsBool(el, 'diagonalUp')) border.diagonalUp = true;
    if (XmlUtils.getAttrAsBool(el, 'diagonalDown')) border.diagonalDown = true;

    return border;
  }

  /**
   * 解析单元格样式
   */
  private parseCellXf(
    el: Element,
    fonts: FontStyle[],
    fills: Fill[],
    borders: Border[],
    numFmts: NumberFormat[]
  ): CellStyle {
    const style: CellStyle = {};

    // 数字格式
    const numFmtId = XmlUtils.getAttrAsInt(el, 'numFmtId', 0);
    style.numFmtId = numFmtId;

    // 查找格式代码
    const customFmt = numFmts.find(f => f.id === numFmtId);
    if (customFmt) {
      style.numFmt = customFmt.formatCode;
    } else if (BUILTIN_NUM_FMTS[numFmtId]) {
      style.numFmt = BUILTIN_NUM_FMTS[numFmtId];
    }

    // 字体
    if (XmlUtils.getAttrAsBool(el, 'applyFont') || XmlUtils.getAttr(el, 'fontId')) {
      const fontId = XmlUtils.getAttrAsInt(el, 'fontId', 0);
      if (fonts[fontId]) {
        style.font = { ...fonts[fontId] };
      }
    }

    // 填充
    if (XmlUtils.getAttrAsBool(el, 'applyFill') || XmlUtils.getAttr(el, 'fillId')) {
      const fillId = XmlUtils.getAttrAsInt(el, 'fillId', 0);
      if (fills[fillId]) {
        style.fill = { ...fills[fillId] };
      }
    }

    // 边框
    if (XmlUtils.getAttrAsBool(el, 'applyBorder') || XmlUtils.getAttr(el, 'borderId')) {
      const borderId = XmlUtils.getAttrAsInt(el, 'borderId', 0);
      if (borders[borderId]) {
        style.border = { ...borders[borderId] };
      }
    }

    // 对齐
    const alignment = XmlUtils.getChild(el, 'alignment');
    if (alignment) {
      style.alignment = this.parseAlignment(alignment);
    }

    // 保护
    const protection = XmlUtils.getChild(el, 'protection');
    if (protection) {
      style.protection = {
        locked: XmlUtils.getAttrAsBool(protection, 'locked', true),
        hidden: XmlUtils.getAttrAsBool(protection, 'hidden', false)
      };
    }

    return style;
  }

  /**
   * 解析对齐
   */
  private parseAlignment(el: Element): Alignment {
    const alignment: Alignment = {};

    const horizontal = XmlUtils.getAttr(el, 'horizontal');
    if (horizontal) alignment.horizontal = horizontal as HorizontalAlignment;

    const vertical = XmlUtils.getAttr(el, 'vertical');
    if (vertical) alignment.vertical = vertical as VerticalAlignment;

    const textRotation = XmlUtils.getAttr(el, 'textRotation');
    if (textRotation) alignment.textRotation = parseInt(textRotation, 10);

    alignment.wrapText = XmlUtils.getAttrAsBool(el, 'wrapText');
    alignment.shrinkToFit = XmlUtils.getAttrAsBool(el, 'shrinkToFit');

    const indent = XmlUtils.getAttr(el, 'indent');
    if (indent) alignment.indent = parseInt(indent, 10);

    return alignment;
  }

  /**
   * 解析共享字符串
   */
  private async parseSharedStrings(): Promise<Array<string | RichText>> {
    const ssDoc = await this.readXml('xl/sharedStrings.xml');
    if (!ssDoc) return [];

    const strings: Array<string | RichText> = [];

    XmlUtils.forEachChildByTag(ssDoc.documentElement, 'si', (si) => {
      // 简单文本
      const t = XmlUtils.getChild(si, 't');
      if (t) {
        strings.push(XmlUtils.getText(t));
        return;
      }

      // 富文本
      const runs = XmlUtils.getChildren(si, 'r');
      if (runs.length > 0) {
        const richText: RichText = runs.map(r => {
          const run: RichTextRun = {
            text: XmlUtils.getText(XmlUtils.getChild(r, 't'))
          };

          const rPr = XmlUtils.getChild(r, 'rPr');
          if (rPr) {
            run.font = this.parseFont(rPr);
          }

          return run;
        });
        strings.push(richText);
      } else {
        strings.push('');
      }
    });

    return strings;
  }

  /**
   * 解析工作簿
   */
  private async parseWorkbook(): Promise<Workbook> {
    const wbDoc = await this.readXml('xl/workbook.xml');
    if (!wbDoc) {
      throw new Error('无效的 Excel 文件：找不到 workbook.xml');
    }

    const root = wbDoc.documentElement;

    // 解析工作簿属性
    const workbookPr = XmlUtils.getChild(root, 'workbookPr');
    const workbookProperties = {
      date1904: XmlUtils.getAttrAsBool(workbookPr, 'date1904')
    };

    // 解析工作表信息
    const sheets: Sheet[] = [];
    const sheetsEl = XmlUtils.getChild(root, 'sheets');
    const sheetInfos: Array<{ name: string; sheetId: string; rId: string; state: SheetState }> = [];

    XmlUtils.forEachChildByTag(sheetsEl, 'sheet', (el, index) => {
      sheetInfos.push({
        name: XmlUtils.getAttr(el, 'name'),
        sheetId: XmlUtils.getAttr(el, 'sheetId'),
        rId: XmlUtils.getAttr(el, 'r:id') || XmlUtils.getAttr(el, 'id'),
        state: (XmlUtils.getAttr(el, 'state', 'visible') as SheetState)
      });
    });

    // 解析每个工作表
    let progress = 35;
    const progressStep = 50 / Math.max(sheetInfos.length, 1);

    for (let i = 0; i < sheetInfos.length; i++) {
      const info = sheetInfos[i];
      this.reportProgress(progress, `解析工作表: ${info.name}`);

      const rel = this.workbookRelationships.get(info.rId);
      if (rel) {
        const sheetPath = `xl/${rel.target.replace(/^\//, '')}`;
        const sheet = await this.parseSheet(sheetPath, info.name, i, info.state);
        sheets.push(sheet);
      }

      progress += progressStep;
    }

    // 解析定义名称
    const definedNames: DefinedName[] = [];
    XmlUtils.forEachChildByTag(XmlUtils.getChild(root, 'definedNames'), 'definedName', (el) => {
      definedNames.push({
        name: XmlUtils.getAttr(el, 'name'),
        ref: XmlUtils.getText(el),
        scope: XmlUtils.getAttr(el, 'localSheetId'),
        comment: XmlUtils.getAttr(el, 'comment'),
        hidden: XmlUtils.getAttrAsBool(el, 'hidden')
      });
    });

    // 解析活动工作表
    const bookViewsEl = XmlUtils.getChild(root, 'bookViews');
    const workbookViewEl = XmlUtils.getChild(bookViewsEl, 'workbookView');
    const activeSheet = XmlUtils.getAttrAsInt(workbookViewEl, 'activeTab', 0);

    // 解析文档属性
    const properties = await this.parseDocumentProperties();

    return {
      sheets,
      activeSheet,
      styles: this.stylesheet || {
        numFmts: [],
        fonts: [],
        fills: [],
        borders: [],
        cellXfs: [],
        cellStyleXfs: [],
        cellStyles: []
      },
      definedNames,
      theme: this.theme || undefined,
      properties,
      workbookProperties,
      sharedStrings: this.sharedStrings
    };
  }

  /**
   * 解析文档属性
   */
  private async parseDocumentProperties(): Promise<DocumentProperties> {
    const properties: DocumentProperties = {};

    // 核心属性
    const coreDoc = await this.readXml('docProps/core.xml');
    if (coreDoc) {
      const root = coreDoc.documentElement;

      const titleEl = XmlUtils.getChild(root, 'title');
      if (titleEl) properties.title = XmlUtils.getText(titleEl);

      const subjectEl = XmlUtils.getChild(root, 'subject');
      if (subjectEl) properties.subject = XmlUtils.getText(subjectEl);

      const creatorEl = XmlUtils.getChild(root, 'creator');
      if (creatorEl) properties.creator = XmlUtils.getText(creatorEl);

      const keywordsEl = XmlUtils.getChild(root, 'keywords');
      if (keywordsEl) properties.keywords = XmlUtils.getText(keywordsEl);

      const descriptionEl = XmlUtils.getChild(root, 'description');
      if (descriptionEl) properties.description = XmlUtils.getText(descriptionEl);

      const lastModifiedByEl = XmlUtils.getChild(root, 'lastModifiedBy');
      if (lastModifiedByEl) properties.lastModifiedBy = XmlUtils.getText(lastModifiedByEl);

      const createdEl = XmlUtils.getChild(root, 'created');
      if (createdEl) {
        const dateStr = XmlUtils.getText(createdEl);
        if (dateStr) properties.created = new Date(dateStr);
      }

      const modifiedEl = XmlUtils.getChild(root, 'modified');
      if (modifiedEl) {
        const dateStr = XmlUtils.getText(modifiedEl);
        if (dateStr) properties.modified = new Date(dateStr);
      }
    }

    // 扩展属性
    const appDoc = await this.readXml('docProps/app.xml');
    if (appDoc) {
      const root = appDoc.documentElement;

      const applicationEl = XmlUtils.getChild(root, 'Application');
      if (applicationEl) properties.application = XmlUtils.getText(applicationEl);

      const companyEl = XmlUtils.getChild(root, 'Company');
      if (companyEl) properties.company = XmlUtils.getText(companyEl);

      const appVersionEl = XmlUtils.getChild(root, 'AppVersion');
      if (appVersionEl) properties.appVersion = XmlUtils.getText(appVersionEl);
    }

    return properties;
  }

  /**
   * 解析工作表
   */
  private async parseSheet(
    path: string,
    name: string,
    index: number,
    state: SheetState
  ): Promise<Sheet> {
    const sheetDoc = await this.readXml(path);
    if (!sheetDoc) {
      throw new Error(`无法解析工作表: ${path}`);
    }

    const root = sheetDoc.documentElement;
    const sheet: Sheet = {
      id: `sheet${index + 1}`,
      name,
      type: 'worksheet',
      state,
      index,
      rows: new Map(),
      columns: new Map(),
      cells: new Map(),
      mergeCells: [],
      dataValidations: [],
      conditionalFormats: [],
      hyperlinks: new Map(),
      comments: new Map(),
      images: [],
      charts: [],
      tables: [],
      pivotTables: [],
      views: []
    };

    // 解析维度
    const dimensionEl = XmlUtils.getChild(root, 'dimension');
    if (dimensionEl) {
      const ref = XmlUtils.getAttr(dimensionEl, 'ref');
      if (ref) {
        const range = XmlUtils.parseRange(ref);
        sheet.dimension = {
          start: range.start,
          end: range.end,
          ref
        };
      }
    }

    // 解析工作表格式属性
    const sheetFormatPr = XmlUtils.getChild(root, 'sheetFormatPr');
    if (sheetFormatPr) {
      sheet.defaultRowHeight = XmlUtils.getAttrAsNumber(sheetFormatPr, 'defaultRowHeight', 15);
      sheet.defaultColWidth = XmlUtils.getAttrAsNumber(sheetFormatPr, 'defaultColWidth', 8.43);
    }

    // 解析视图
    const sheetViews = XmlUtils.getChild(root, 'sheetViews');
    XmlUtils.forEachChildByTag(sheetViews, 'sheetView', (viewEl) => {
      sheet.views.push(this.parseSheetView(viewEl));
    });

    // 从视图中提取冻结窗格
    if (sheet.views.length > 0) {
      const paneEl = XmlUtils.getChild(
        XmlUtils.getChildren(sheetViews, 'sheetView')[0],
        'pane'
      );
      if (paneEl) {
        sheet.freezePane = this.parseFreezePane(paneEl);
      }
    }

    // 解析列定义
    XmlUtils.forEachChildByTag(XmlUtils.getChild(root, 'cols'), 'col', (col) => {
      const min = XmlUtils.getAttrAsInt(col, 'min', 1) - 1;
      const max = XmlUtils.getAttrAsInt(col, 'max', 1) - 1;
      const width = XmlUtils.getAttrAsNumber(col, 'width', 8.43);
      const hidden = XmlUtils.getAttrAsBool(col, 'hidden');
      const styleIndex = XmlUtils.getAttrAsInt(col, 'style');
      const customWidth = XmlUtils.getAttrAsBool(col, 'customWidth');
      const bestFit = XmlUtils.getAttrAsBool(col, 'bestFit');
      const outlineLevel = XmlUtils.getAttrAsInt(col, 'outlineLevel');
      const collapsed = XmlUtils.getAttrAsBool(col, 'collapsed');

      for (let i = min; i <= max; i++) {
        sheet.columns.set(i, {
          index: i,
          width,
          pixelWidth: Math.round(width * 7 + 5), // Excel 近似转换
          hidden,
          styleIndex,
          customWidth,
          bestFit,
          outlineLevel,
          collapsed
        });
      }
    });

    // 解析行和单元格
    const sheetData = XmlUtils.getChild(root, 'sheetData');
    XmlUtils.forEachChildByTag(sheetData, 'row', (rowEl) => {
      const rowIndex = XmlUtils.getAttrAsInt(rowEl, 'r', 1) - 1;

      // 行属性
      const row: Row = {
        index: rowIndex,
        height: XmlUtils.getAttrAsNumber(rowEl, 'ht', sheet.defaultRowHeight || 15),
        hidden: XmlUtils.getAttrAsBool(rowEl, 'hidden'),
        styleIndex: XmlUtils.getAttr(rowEl, 's') ? XmlUtils.getAttrAsInt(rowEl, 's') : undefined,
        customHeight: XmlUtils.getAttrAsBool(rowEl, 'customHeight'),
        outlineLevel: XmlUtils.getAttrAsInt(rowEl, 'outlineLevel'),
        collapsed: XmlUtils.getAttrAsBool(rowEl, 'collapsed')
      };
      sheet.rows.set(rowIndex, row);

      // 单元格
      XmlUtils.forEachChildByTag(rowEl, 'c', (cellEl) => {
        const cell = this.parseCell(cellEl);
        sheet.cells.set(cell.address, cell);
      });
    });

    // 解析合并单元格
    XmlUtils.forEachChildByTag(XmlUtils.getChild(root, 'mergeCells'), 'mergeCell', (el) => {
      const ref = XmlUtils.getAttr(el, 'ref');
      if (ref) {
        const range = XmlUtils.parseRange(ref);
        const mergeCell: MergeCell = {
          ref,
          startRow: range.start.row,
          startCol: range.start.col,
          endRow: range.end.row,
          endCol: range.end.col
        };
        sheet.mergeCells.push(mergeCell);

        // 标记合并单元格
        for (let r = range.start.row; r <= range.end.row; r++) {
          for (let c = range.start.col; c <= range.end.col; c++) {
            const addr = XmlUtils.formatCellAddress(r, c);
            const cell = sheet.cells.get(addr);
            if (cell) {
              cell.isMerged = true;
              cell.merge = range;
              if (r === range.start.row && c === range.start.col) {
                cell.isMergeOrigin = true;
              }
            }
          }
        }
      }
    });

    // 解析超链接
    XmlUtils.forEachChildByTag(XmlUtils.getChild(root, 'hyperlinks'), 'hyperlink', (el) => {
      const ref = XmlUtils.getAttr(el, 'ref');
      const rId = XmlUtils.getAttr(el, 'r:id');
      const location = XmlUtils.getAttr(el, 'location');
      const display = XmlUtils.getAttr(el, 'display');
      const tooltip = XmlUtils.getAttr(el, 'tooltip');

      if (ref) {
        const hyperlink: Hyperlink = {
          target: location || '',
          type: location ? 'internal' : 'url',
          tooltip,
          display
        };

        // TODO: 从关系文件中获取外部链接目标

        sheet.hyperlinks.set(ref, hyperlink);

        // 更新单元格
        const cell = sheet.cells.get(ref);
        if (cell) {
          cell.hyperlink = hyperlink;
        }
      }
    });

    // 解析自动筛选
    const autoFilterEl = XmlUtils.getChild(root, 'autoFilter');
    if (autoFilterEl) {
      sheet.autoFilter = {
        ref: XmlUtils.getAttr(autoFilterEl, 'ref')
      };
    }

    // 解析数据验证
    if (this.options.parseDataValidations) {
      XmlUtils.forEachChildByTag(XmlUtils.getChild(root, 'dataValidations'), 'dataValidation', (el) => {
        sheet.dataValidations.push(this.parseDataValidation(el));
      });
    }

    // 解析条件格式
    if (this.options.parseConditionalFormats) {
      XmlUtils.forEachChildByTag(root, 'conditionalFormatting', (cfEl) => {
        const ranges = XmlUtils.getAttr(cfEl, 'sqref').split(' ');
        XmlUtils.forEachChildByTag(cfEl, 'cfRule', (ruleEl) => {
          sheet.conditionalFormats.push(this.parseConditionalFormat(ruleEl, ranges));
        });
      });
    }

    // 解析打印设置
    const printOptionsEl = XmlUtils.getChild(root, 'printOptions');
    const pageSetupEl = XmlUtils.getChild(root, 'pageSetup');
    if (printOptionsEl || pageSetupEl) {
      sheet.printOptions = this.parsePrintOptions(printOptionsEl, pageSetupEl);
    }

    return sheet;
  }

  /**
   * 解析单元格
   */
  private parseCell(el: Element): Cell {
    const address = XmlUtils.getAttr(el, 'r');
    const { row, col } = XmlUtils.parseCellAddress(address);
    const typeAttr = XmlUtils.getAttr(el, 't');
    const styleIndex = XmlUtils.getAttr(el, 's') ? XmlUtils.getAttrAsInt(el, 's') : undefined;

    let value: Cell['value'] = null;
    let type: CellValueType = 'empty';
    let text = '';
    let formula: CellFormula | undefined;

    // 解析公式
    const fEl = XmlUtils.getChild(el, 'f');
    if (fEl && this.options.parseFormulas) {
      formula = {
        text: XmlUtils.getText(fEl),
        type: (XmlUtils.getAttr(fEl, 't', 'normal') as CellFormula['type']),
        ref: XmlUtils.getAttr(fEl, 'ref') || undefined,
        si: XmlUtils.getAttr(fEl, 'si') ? XmlUtils.getAttrAsInt(fEl, 'si') : undefined
      };
      type = 'formula';
    }

    // 解析值
    const vEl = XmlUtils.getChild(el, 'v');
    const vText = XmlUtils.getText(vEl);

    switch (typeAttr) {
      case 's': // 共享字符串
        const ssIndex = parseInt(vText, 10);
        if (ssIndex >= 0 && ssIndex < this.sharedStrings.length) {
          const ss = this.sharedStrings[ssIndex];
          if (typeof ss === 'string') {
            value = ss;
            text = ss;
          } else {
            value = ss;
            text = ss.map(r => r.text).join('');
          }
        }
        type = formula ? 'formula' : 'string';
        break;

      case 'inlineStr': // 内联字符串
        const isEl = XmlUtils.getChild(el, 'is');
        const tEl = XmlUtils.getChild(isEl, 't');
        value = XmlUtils.getText(tEl);
        text = value as string;
        type = formula ? 'formula' : 'string';
        break;

      case 'b': // 布尔
        value = vText === '1' || vText.toLowerCase() === 'true';
        text = value ? 'TRUE' : 'FALSE';
        type = formula ? 'formula' : 'boolean';
        break;

      case 'e': // 错误
        value = vText;
        text = vText;
        type = 'error';
        break;

      case 'str': // 公式字符串结果
        value = vText;
        text = vText;
        type = formula ? 'formula' : 'string';
        break;

      default: // 数字或空
        if (vText !== '') {
          const num = parseFloat(vText);
          if (!isNaN(num)) {
            value = num;
            text = vText;
            type = formula ? 'formula' : 'number';

            // 检查是否是日期 (需要根据样式判断)
            if (styleIndex !== undefined && this.stylesheet) {
              const style = this.stylesheet.cellXfs[styleIndex];
              if (style && this.isDateFormat(style.numFmt || '')) {
                type = formula ? 'formula' : 'date';
                value = this.excelDateToJS(num);
                text = (value as Date).toLocaleDateString();
              }
            }
          }
        }
        break;
    }

    const cell: Cell = {
      address,
      row,
      col,
      value,
      type,
      text,
      formula,
      styleIndex
    };

    // 应用样式
    if (styleIndex !== undefined && this.stylesheet && this.stylesheet.cellXfs[styleIndex]) {
      cell.style = this.stylesheet.cellXfs[styleIndex];
    }

    return cell;
  }

  /**
   * 判断是否是日期格式
   */
  private isDateFormat(format: string): boolean {
    if (!format || format === 'General') return false;

    // 排除数字和文本格式
    if (/^[0#.,E%@]/.test(format)) return false;

    // 检测日期格式字符
    const dateChars = /[ymdhs]/i;
    const bracketRegex = /\[.*?\]/g;
    const cleanFormat = format.replace(bracketRegex, '');

    return dateChars.test(cleanFormat);
  }

  /**
   * Excel 日期转 JS Date
   */
  private excelDateToJS(serial: number): Date {
    // Excel 日期从 1900-01-01 开始 (序列号 1)
    // 需要考虑 1900 年闰年 bug
    const utcDays = Math.floor(serial) - 25569;
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);

    // 处理小数部分 (时间)
    const fractionalDay = serial - Math.floor(serial);
    const totalSeconds = Math.floor(86400 * fractionalDay);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    dateInfo.setHours(hours, minutes, seconds);

    return dateInfo;
  }

  /**
   * 解析工作表视图
   */
  private parseSheetView(el: Element): SheetView {
    return {
      tabSelected: XmlUtils.getAttrAsBool(el, 'tabSelected'),
      showGridLines: XmlUtils.getAttrAsBool(el, 'showGridLines', true),
      showRowColHeaders: XmlUtils.getAttrAsBool(el, 'showRowColHeaders', true),
      showZeros: XmlUtils.getAttrAsBool(el, 'showZeros', true),
      rightToLeft: XmlUtils.getAttrAsBool(el, 'rightToLeft'),
      showFormulas: XmlUtils.getAttrAsBool(el, 'showFormulas'),
      showOutlineSymbols: XmlUtils.getAttrAsBool(el, 'showOutlineSymbols', true),
      defaultGridColor: XmlUtils.getAttrAsBool(el, 'defaultGridColor', true),
      view: XmlUtils.getAttr(el, 'view', 'normal') as SheetView['view'],
      zoomScale: XmlUtils.getAttrAsInt(el, 'zoomScale', 100),
      zoomScaleNormal: XmlUtils.getAttrAsInt(el, 'zoomScaleNormal', 100),
      zoomScalePageLayoutView: XmlUtils.getAttrAsInt(el, 'zoomScalePageLayoutView', 100),
      workbookViewId: XmlUtils.getAttrAsInt(el, 'workbookViewId', 0)
    };
  }

  /**
   * 解析冻结窗格
   */
  private parseFreezePane(el: Element): FreezePane {
    return {
      rows: XmlUtils.getAttrAsInt(el, 'ySplit', 0),
      cols: XmlUtils.getAttrAsInt(el, 'xSplit', 0),
      topLeftCell: XmlUtils.getAttr(el, 'topLeftCell'),
      activePane: XmlUtils.getAttr(el, 'activePane') as FreezePane['activePane'],
      state: XmlUtils.getAttr(el, 'state', 'frozen') as FreezePane['state']
    };
  }

  /**
   * 解析数据验证
   */
  private parseDataValidation(el: Element): DataValidation {
    return {
      type: XmlUtils.getAttr(el, 'type', 'none') as DataValidation['type'],
      operator: XmlUtils.getAttr(el, 'operator') as DataValidation['operator'],
      ranges: XmlUtils.getAttr(el, 'sqref', '').split(' '),
      formula1: XmlUtils.getText(XmlUtils.getChild(el, 'formula1')),
      formula2: XmlUtils.getText(XmlUtils.getChild(el, 'formula2')),
      allowBlank: XmlUtils.getAttrAsBool(el, 'allowBlank'),
      showDropDown: !XmlUtils.getAttrAsBool(el, 'showDropDown'), // Excel 中 1 表示隐藏
      showInputMessage: XmlUtils.getAttrAsBool(el, 'showInputMessage'),
      showErrorMessage: XmlUtils.getAttrAsBool(el, 'showErrorMessage'),
      promptTitle: XmlUtils.getAttr(el, 'promptTitle'),
      prompt: XmlUtils.getAttr(el, 'prompt'),
      errorTitle: XmlUtils.getAttr(el, 'errorTitle'),
      error: XmlUtils.getAttr(el, 'error'),
      errorStyle: XmlUtils.getAttr(el, 'errorStyle', 'stop') as DataValidation['errorStyle']
    };
  }

  /**
   * 解析条件格式
   */
  private parseConditionalFormat(el: Element, ranges: string[]): ConditionalFormatRule {
    const rule: ConditionalFormatRule = {
      type: XmlUtils.getAttr(el, 'type', 'cellIs') as ConditionalFormatRule['type'],
      priority: XmlUtils.getAttrAsInt(el, 'priority', 1),
      ranges,
      stopIfTrue: XmlUtils.getAttrAsBool(el, 'stopIfTrue')
    };

    // 操作符
    const operator = XmlUtils.getAttr(el, 'operator');
    if (operator) {
      rule.operator = operator as ConditionalFormatRule['operator'];
    }

    // 公式
    const formulas = XmlUtils.getChildren(el, 'formula');
    if (formulas.length > 0) {
      rule.formula = formulas.map(f => XmlUtils.getText(f));
    }

    // 色阶
    const colorScale = XmlUtils.getChild(el, 'colorScale');
    if (colorScale) {
      const cfvos = XmlUtils.getChildren(colorScale, 'cfvo');
      const colors = XmlUtils.getChildren(colorScale, 'color');
      rule.colorScale = {
        cfvo: cfvos.map(c => ({
          type: XmlUtils.getAttr(c, 'type'),
          val: XmlUtils.getAttr(c, 'val')
        })),
        color: colors.map(c => this.parseColor(c))
      };
    }

    // 数据条
    const dataBar = XmlUtils.getChild(el, 'dataBar');
    if (dataBar) {
      const colorEl = XmlUtils.getChild(dataBar, 'color');
      rule.dataBar = {
        minLength: XmlUtils.getAttrAsInt(dataBar, 'minLength', 10),
        maxLength: XmlUtils.getAttrAsInt(dataBar, 'maxLength', 90),
        showValue: XmlUtils.getAttrAsBool(dataBar, 'showValue', true),
        gradient: XmlUtils.getAttrAsBool(dataBar, 'gradient', true),
        color: colorEl ? this.parseColor(colorEl) : { rgb: '638EC6' }
      };
    }

    // 图标集
    const iconSet = XmlUtils.getChild(el, 'iconSet');
    if (iconSet) {
      const cfvos = XmlUtils.getChildren(iconSet, 'cfvo');
      rule.iconSet = {
        iconSet: XmlUtils.getAttr(iconSet, 'iconSet', '3TrafficLights1') as any,
        showValue: XmlUtils.getAttrAsBool(iconSet, 'showValue', true),
        reverse: XmlUtils.getAttrAsBool(iconSet, 'reverse'),
        cfvo: cfvos.map(c => ({
          type: XmlUtils.getAttr(c, 'type'),
          val: XmlUtils.getAttr(c, 'val'),
          gte: XmlUtils.getAttrAsBool(c, 'gte', true)
        }))
      };
    }

    return rule;
  }

  /**
   * 解析打印设置
   */
  private parsePrintOptions(
    printOptionsEl: Element | null,
    pageSetupEl: Element | null
  ): PrintOptions {
    const options: PrintOptions = {};

    if (printOptionsEl) {
      options.gridLines = XmlUtils.getAttrAsBool(printOptionsEl, 'gridLines');
      options.headings = XmlUtils.getAttrAsBool(printOptionsEl, 'headings');
      options.horizontalCentered = XmlUtils.getAttrAsBool(printOptionsEl, 'horizontalCentered');
      options.verticalCentered = XmlUtils.getAttrAsBool(printOptionsEl, 'verticalCentered');
    }

    if (pageSetupEl) {
      const orientation = XmlUtils.getAttr(pageSetupEl, 'orientation');
      if (orientation) options.orientation = orientation as PrintOptions['orientation'];

      options.scale = XmlUtils.getAttrAsInt(pageSetupEl, 'scale', 100);
      options.fitToWidth = XmlUtils.getAttrAsInt(pageSetupEl, 'fitToWidth');
      options.fitToHeight = XmlUtils.getAttrAsInt(pageSetupEl, 'fitToHeight');
      options.blackAndWhite = XmlUtils.getAttrAsBool(pageSetupEl, 'blackAndWhite');
      options.draft = XmlUtils.getAttrAsBool(pageSetupEl, 'draft');
    }

    return options;
  }
}
