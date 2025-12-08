/**
 * 格式化工具类
 * @description 处理 Excel 数字格式化
 */

/**
 * 日期格式化选项
 */
interface DateFormatOptions {
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'short' | 'long';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  hour12?: boolean;
}

/**
 * 数字格式化结果
 */
interface FormatResult {
  text: string;
  color?: string;
}

export class FormatUtils {
  /**
   * 格式化单元格值
   */
  static formatValue(value: unknown, format: string | undefined): string {
    if (value === null || value === undefined) return '';

    if (!format || format === 'General') {
      return this.formatGeneral(value);
    }

    if (value instanceof Date) {
      return this.formatDate(value, format);
    }

    if (typeof value === 'number') {
      return this.formatNumber(value, format);
    }

    return String(value);
  }

  /**
   * 通用格式
   */
  static formatGeneral(value: unknown): string {
    if (value === null || value === undefined) return '';

    if (typeof value === 'number') {
      // 移除多余的小数位
      if (Number.isInteger(value)) {
        return value.toString();
      }

      // 对于小数，最多显示 10 位有效数字
      const str = value.toPrecision(10);
      return parseFloat(str).toString();
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    return String(value);
  }

  /**
   * 格式化数字
   */
  static formatNumber(value: number, format: string): string {
    // 解析条件格式
    const sections = this.parseFormatSections(format);

    // 选择合适的格式部分
    let section: string;
    if (sections.length === 1) {
      section = sections[0];
    } else if (sections.length === 2) {
      section = value >= 0 ? sections[0] : sections[1];
    } else if (sections.length >= 3) {
      if (value > 0) section = sections[0];
      else if (value < 0) section = sections[1];
      else section = sections[2];
    } else {
      return String(value);
    }

    // 检查是否是日期格式
    if (this.isDateFormat(section)) {
      const date = this.excelSerialToDate(value);
      return this.formatDate(date, section);
    }

    // 检查是否是百分比格式
    if (section.includes('%')) {
      value = value * 100;
      section = section.replace('%', '');
      return this.applyNumberFormat(value, section) + '%';
    }

    // 检查是否是科学计数法
    if (section.toLowerCase().includes('e')) {
      return this.formatScientific(value, section);
    }

    // 检查是否是分数格式
    if (section.includes('/')) {
      return this.formatFraction(value, section);
    }

    return this.applyNumberFormat(Math.abs(value), section);
  }

  /**
   * 解析格式分段
   */
  private static parseFormatSections(format: string): string[] {
    const sections: string[] = [];
    let current = '';
    let inBracket = false;
    let inQuotes = false;

    for (let i = 0; i < format.length; i++) {
      const char = format[i];

      if (char === '"' && !inBracket) {
        inQuotes = !inQuotes;
        current += char;
      } else if (char === '[' && !inQuotes) {
        inBracket = true;
        current += char;
      } else if (char === ']' && !inQuotes) {
        inBracket = false;
        current += char;
      } else if (char === ';' && !inBracket && !inQuotes) {
        sections.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    if (current) {
      sections.push(current);
    }

    return sections;
  }

  /**
   * 应用数字格式
   */
  private static applyNumberFormat(value: number, format: string): string {
    // 提取颜色和条件
    format = this.stripConditions(format);

    // 查找小数点
    const decimalIndex = format.indexOf('.');

    // 计算小数位数
    let decimals = 0;
    if (decimalIndex >= 0) {
      const afterDecimal = format.substring(decimalIndex + 1);
      for (const char of afterDecimal) {
        if (char === '0' || char === '#') {
          decimals++;
        } else {
          break;
        }
      }
    }

    // 检查是否使用千分位
    const useThousands = format.includes(',');

    // 格式化数字
    let result = value.toFixed(decimals);

    // 添加千分位
    if (useThousands) {
      const parts = result.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      result = parts.join('.');
    }

    // 处理前导零
    if (decimalIndex >= 0) {
      const beforeDecimal = format.substring(0, decimalIndex);
      const minIntDigits = (beforeDecimal.match(/0/g) || []).length;
      const parts = result.split('.');
      while (parts[0].replace(/,/g, '').length < minIntDigits) {
        parts[0] = '0' + parts[0];
      }
      result = parts.join('.');
    }

    return result;
  }

  /**
   * 移除条件和颜色
   */
  private static stripConditions(format: string): string {
    // 移除 [条件]、[颜色] 等
    return format.replace(/\[[^\]]*\]/g, '').trim();
  }

  /**
   * 判断是否是日期格式
   */
  static isDateFormat(format: string): boolean {
    if (!format || format === 'General') return false;

    // 移除条件和引号内容
    const cleanFormat = format
      .replace(/\[[^\]]*\]/g, '')
      .replace(/"[^"]*"/g, '');

    // 检测日期格式字符
    return /[ymdhs]/i.test(cleanFormat) && !/[#0?]/.test(cleanFormat);
  }

  /**
   * Excel 序列号转日期
   */
  static excelSerialToDate(serial: number): Date {
    // Excel 日期从 1900-01-01 开始 (序列号 1)
    // 需要考虑 1900 年闰年 bug (Excel 错误地认为 1900 是闰年)
    const utcDays = Math.floor(serial) - 25569;
    const utcValue = utcDays * 86400;
    const date = new Date(utcValue * 1000);

    // 处理小数部分 (时间)
    const fractionalDay = serial - Math.floor(serial);
    const totalSeconds = Math.floor(86400 * fractionalDay);
    date.setUTCHours(
      Math.floor(totalSeconds / 3600),
      Math.floor((totalSeconds % 3600) / 60),
      totalSeconds % 60
    );

    return date;
  }

  /**
   * 日期转 Excel 序列号
   */
  static dateToExcelSerial(date: Date): number {
    const utcValue = Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    );

    const utcDays = Math.floor(utcValue / 86400000);
    const serial = utcDays + 25569;

    // 添加时间部分
    const timeSerial =
      (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) / 86400;

    return serial + timeSerial;
  }

  /**
   * 格式化日期
   */
  static formatDate(date: Date, format: string): string {
    // 移除条件
    format = this.stripConditions(format);

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const hours12 = hours % 12 || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';

    // 替换格式代码
    let result = format
      // 年
      .replace(/yyyy/gi, String(year))
      .replace(/yy/gi, String(year).slice(-2))
      // 月
      .replace(/mmmm/gi, this.getMonthName(month, 'long'))
      .replace(/mmm/gi, this.getMonthName(month, 'short'))
      // 日
      .replace(/dddd/gi, this.getDayName(date, 'long'))
      .replace(/ddd/gi, this.getDayName(date, 'short'))
      .replace(/dd/gi, String(day).padStart(2, '0'))
      .replace(/d/gi, String(day))
      // 时
      .replace(/hh/gi, String(hours).padStart(2, '0'))
      .replace(/h/gi, String(hours))
      // 分
      .replace(/mm/gi, String(minutes).padStart(2, '0'))
      .replace(/m/gi, String(minutes))
      // 秒
      .replace(/ss/gi, String(seconds).padStart(2, '0'))
      .replace(/s/gi, String(seconds))
      // AM/PM
      .replace(/AM\/PM/gi, ampm)
      .replace(/A\/P/gi, ampm[0]);

    // 处理月份 (需要在时分秒之后处理，避免冲突)
    // 这里简化处理，实际需要更复杂的逻辑
    if (/mm/i.test(format) && !/[hs]/i.test(format)) {
      result = result.replace(/mm/gi, String(month).padStart(2, '0'));
    }
    if (/m(?!m)/i.test(format) && !/[hs]/i.test(format)) {
      result = result.replace(/m(?!m)/gi, String(month));
    }

    return result;
  }

  /**
   * 获取月份名称
   */
  private static getMonthName(month: number, format: 'short' | 'long'): string {
    const months = {
      short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    return months[format][month - 1] || '';
  }

  /**
   * 获取星期名称
   */
  private static getDayName(date: Date, format: 'short' | 'long'): string {
    const days = {
      short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };
    return days[format][date.getDay()] || '';
  }

  /**
   * 格式化科学计数法
   */
  private static formatScientific(value: number, format: string): string {
    const match = format.match(/([0#.,]+)[eE]([+-]?)([0#]+)/);
    if (!match) {
      return value.toExponential();
    }

    const mantissaFormat = match[1];
    const signFormat = match[2];
    const exponentFormat = match[3];

    // 计算小数位数
    const decimalIndex = mantissaFormat.indexOf('.');
    const decimals = decimalIndex >= 0
      ? mantissaFormat.length - decimalIndex - 1
      : 0;

    const expStr = value.toExponential(decimals);
    const [mantissa, exp] = expStr.split('e');

    let expNum = parseInt(exp, 10);
    let expSign = expNum >= 0 ? '+' : '-';
    expNum = Math.abs(expNum);

    if (!signFormat && expSign === '+') {
      expSign = '';
    }

    const expPadded = String(expNum).padStart(exponentFormat.length, '0');

    return `${mantissa}E${expSign}${expPadded}`;
  }

  /**
   * 格式化分数
   */
  private static formatFraction(value: number, format: string): string {
    const intPart = Math.floor(Math.abs(value));
    const fracPart = Math.abs(value) - intPart;

    if (fracPart === 0) {
      return String(value >= 0 ? intPart : -intPart);
    }

    // 查找分母精度
    const match = format.match(/\/(\?+|#+|\d+)/);
    if (!match) {
      return String(value);
    }

    const denomSpec = match[1];
    let maxDenom: number;

    if (/^\d+$/.test(denomSpec)) {
      // 固定分母
      maxDenom = parseInt(denomSpec, 10);
      const numerator = Math.round(fracPart * maxDenom);
      if (intPart > 0) {
        return `${value >= 0 ? '' : '-'}${intPart} ${numerator}/${maxDenom}`;
      } else {
        return `${value >= 0 ? '' : '-'}${numerator}/${maxDenom}`;
      }
    } else {
      // 可变分母，使用连分数近似
      maxDenom = Math.pow(10, denomSpec.length);
      const { numerator, denominator } = this.toFraction(fracPart, maxDenom);

      if (intPart > 0) {
        return `${value >= 0 ? '' : '-'}${intPart} ${numerator}/${denominator}`;
      } else {
        return `${value >= 0 ? '' : '-'}${numerator}/${denominator}`;
      }
    }
  }

  /**
   * 将小数转换为分数
   */
  private static toFraction(value: number, maxDenom: number): { numerator: number; denominator: number } {
    let bestNumer = 1;
    let bestDenom = 1;
    let bestError = Math.abs(value - bestNumer / bestDenom);

    for (let denom = 1; denom <= maxDenom; denom++) {
      const numer = Math.round(value * denom);
      const error = Math.abs(value - numer / denom);

      if (error < bestError) {
        bestError = error;
        bestNumer = numer;
        bestDenom = denom;
      }

      if (error === 0) break;
    }

    // 简化分数
    const gcd = this.gcd(bestNumer, bestDenom);
    return {
      numerator: bestNumer / gcd,
      denominator: bestDenom / gcd
    };
  }

  /**
   * 最大公约数
   */
  private static gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  /**
   * 格式化货币
   */
  static formatCurrency(value: number, currency: string = '¥', decimals: number = 2): string {
    const formatted = Math.abs(value).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return value < 0 ? `-${currency}${formatted}` : `${currency}${formatted}`;
  }

  /**
   * 格式化百分比
   */
  static formatPercent(value: number, decimals: number = 0): string {
    return (value * 100).toFixed(decimals) + '%';
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let size = bytes;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
  }
}
