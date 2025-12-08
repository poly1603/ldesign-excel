/**
 * XML 解析工具类
 * @description 提供 XML 解析和节点操作的工具方法
 */
export class XmlUtils {
  private static parser: DOMParser | null = null;

  /**
   * 获取 DOMParser 实例
   */
  private static getParser(): DOMParser {
    if (!this.parser) {
      this.parser = new DOMParser();
    }
    return this.parser;
  }

  /**
   * 解析 XML 字符串
   */
  static parse(xmlString: string): Document {
    const parser = this.getParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');

    // 检查解析错误
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error(`XML 解析错误: ${parseError.textContent}`);
    }

    return doc;
  }

  /**
   * 获取元素属性值
   */
  static getAttr(element: Element | null, name: string, defaultValue = ''): string {
    if (!element) return defaultValue;
    return element.getAttribute(name) ?? defaultValue;
  }

  /**
   * 获取元素属性为数字
   */
  static getAttrAsNumber(element: Element | null, name: string, defaultValue = 0): number {
    const value = this.getAttr(element, name);
    if (value === '') return defaultValue;
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * 获取元素属性为整数
   */
  static getAttrAsInt(element: Element | null, name: string, defaultValue = 0): number {
    const value = this.getAttr(element, name);
    if (value === '') return defaultValue;
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * 获取元素属性为布尔值
   */
  static getAttrAsBool(element: Element | null, name: string, defaultValue = false): boolean {
    const value = this.getAttr(element, name);
    if (value === '') return defaultValue;
    return value === '1' || value === 'true';
  }

  /**
   * 获取子元素
   */
  static getChild(element: Element | null, tagName: string): Element | null {
    if (!element) return null;

    // 处理带命名空间的标签
    const children = element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.localName === tagName || child.tagName === tagName) {
        return child;
      }
    }
    return null;
  }

  /**
   * 获取所有子元素
   */
  static getChildren(element: Element | null, tagName?: string): Element[] {
    if (!element) return [];

    const children = Array.from(element.children);
    if (!tagName) return children;

    return children.filter(child =>
      child.localName === tagName || child.tagName === tagName
    );
  }

  /**
   * 获取元素文本内容
   */
  static getText(element: Element | null): string {
    if (!element) return '';
    return element.textContent ?? '';
  }

  /**
   * 查找元素 (支持命名空间)
   */
  static querySelector(element: Element | Document, selector: string): Element | null {
    // 简单标签名查询
    if (/^[a-zA-Z]+$/.test(selector)) {
      if (element instanceof Document) {
        return this.getChild(element.documentElement, selector);
      }
      return this.getChild(element, selector);
    }
    return element.querySelector(selector);
  }

  /**
   * 查找所有元素 (支持命名空间)
   */
  static querySelectorAll(element: Element | Document, selector: string): Element[] {
    // 简单标签名查询
    if (/^[a-zA-Z]+$/.test(selector)) {
      if (element instanceof Document) {
        return this.getChildren(element.documentElement, selector);
      }
      return this.getChildren(element, selector);
    }
    return Array.from(element.querySelectorAll(selector));
  }

  /**
   * 遍历元素的直接子节点
   */
  static forEachChild(element: Element | null, callback: (child: Element, index: number) => void): void {
    if (!element) return;
    const children = element.children;
    for (let i = 0; i < children.length; i++) {
      callback(children[i], i);
    }
  }

  /**
   * 根据标签名遍历子元素
   */
  static forEachChildByTag(
    element: Element | null,
    tagName: string,
    callback: (child: Element, index: number) => void
  ): void {
    if (!element) return;
    const children = this.getChildren(element, tagName);
    children.forEach((child, index) => callback(child, index));
  }

  /**
   * 获取命名空间前缀
   */
  static getNsPrefix(element: Element, nsUri: string): string | null {
    const attrs = element.attributes;
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      if (attr.value === nsUri && attr.name.startsWith('xmlns:')) {
        return attr.name.substring(6);
      }
    }
    return null;
  }

  /**
   * 解析单元格地址 (如 "A1" -> { row: 0, col: 0 })
   */
  static parseCellAddress(address: string): { row: number; col: number } {
    const match = address.match(/^([A-Z]+)(\d+)$/i);
    if (!match) {
      throw new Error(`无效的单元格地址: ${address}`);
    }

    const colStr = match[1].toUpperCase();
    const rowStr = match[2];

    // 列号转换 (A=0, B=1, ..., Z=25, AA=26, ...)
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 64);
    }
    col -= 1;

    // 行号 (1-based -> 0-based)
    const row = parseInt(rowStr, 10) - 1;

    return { row, col };
  }

  /**
   * 生成单元格地址 (如 { row: 0, col: 0 } -> "A1")
   */
  static formatCellAddress(row: number, col: number): string {
    let colStr = '';
    let c = col + 1;
    while (c > 0) {
      const remainder = (c - 1) % 26;
      colStr = String.fromCharCode(65 + remainder) + colStr;
      c = Math.floor((c - 1) / 26);
    }
    return `${colStr}${row + 1}`;
  }

  /**
   * 解析范围引用 (如 "A1:C3")
   */
  static parseRange(ref: string): {
    start: { row: number; col: number };
    end: { row: number; col: number };
  } {
    const parts = ref.split(':');
    const start = this.parseCellAddress(parts[0]);
    const end = parts.length > 1 ? this.parseCellAddress(parts[1]) : { ...start };
    return { start, end };
  }

  /**
   * 格式化范围引用
   */
  static formatRange(
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ): string {
    const start = this.formatCellAddress(startRow, startCol);
    const end = this.formatCellAddress(endRow, endCol);
    return start === end ? start : `${start}:${end}`;
  }
}
