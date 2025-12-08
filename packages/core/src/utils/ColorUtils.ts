/**
 * 颜色工具类
 * @description 提供颜色转换、混合、索引颜色等功能
 */

/**
 * 索引颜色表 (Excel 默认调色板)
 */
const INDEXED_COLORS: string[] = [
  '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
  '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
  '800000', '008000', '000080', '808000', '800080', '008080', 'C0C0C0', '808080',
  '9999FF', '993366', 'FFFFCC', 'CCFFFF', '660066', 'FF8080', '0066CC', 'CCCCFF',
  '000080', 'FF00FF', 'FFFF00', '00FFFF', '800080', '800000', '008080', '0000FF',
  '00CCFF', 'CCFFFF', 'CCFFCC', 'FFFF99', '99CCFF', 'FF99CC', 'CC99FF', 'FFCC99',
  '3366FF', '33CCCC', '99CC00', 'FFCC00', 'FF9900', 'FF6600', '666699', '969696',
  '003366', '339966', '003300', '333300', '993300', '993366', '333399', '333333',
  '000000', 'FFFFFF' // 64, 65 - 系统颜色
];

export class ColorUtils {
  /**
   * 获取索引颜色
   */
  static getIndexedColor(index: number): string {
    if (index >= 0 && index < INDEXED_COLORS.length) {
      return `#${INDEXED_COLORS[index]}`;
    }
    return '#000000';
  }

  /**
   * 应用色调调整 (Tint)
   * @param hex 十六进制颜色 (不带 #)
   * @param tint 色调值 (-1 到 1)
   */
  static applyTint(hex: string, tint: number): string {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    let newR: number, newG: number, newB: number;

    if (tint < 0) {
      // 变暗
      newR = Math.round(r * (1 + tint));
      newG = Math.round(g * (1 + tint));
      newB = Math.round(b * (1 + tint));
    } else {
      // 变亮
      newR = Math.round(r + (255 - r) * tint);
      newG = Math.round(g + (255 - g) * tint);
      newB = Math.round(b + (255 - b) * tint);
    }

    newR = Math.max(0, Math.min(255, newR));
    newG = Math.max(0, Math.min(255, newG));
    newB = Math.max(0, Math.min(255, newB));

    return this.toHex(newR) + this.toHex(newG) + this.toHex(newB);
  }

  /**
   * 数字转两位十六进制
   */
  static toHex(n: number): string {
    const hex = n.toString(16).toUpperCase();
    return hex.length === 1 ? '0' + hex : hex;
  }

  /**
   * 解析十六进制颜色为 RGB
   */
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const cleanHex = hex.replace('#', '');

    if (cleanHex.length === 3) {
      return {
        r: parseInt(cleanHex[0] + cleanHex[0], 16),
        g: parseInt(cleanHex[1] + cleanHex[1], 16),
        b: parseInt(cleanHex[2] + cleanHex[2], 16)
      };
    }

    if (cleanHex.length === 6 || cleanHex.length === 8) {
      const start = cleanHex.length === 8 ? 2 : 0;
      return {
        r: parseInt(cleanHex.substring(start, start + 2), 16),
        g: parseInt(cleanHex.substring(start + 2, start + 4), 16),
        b: parseInt(cleanHex.substring(start + 4, start + 6), 16)
      };
    }

    return null;
  }

  /**
   * RGB 转十六进制颜色
   */
  static rgbToHex(r: number, g: number, b: number): string {
    return '#' + this.toHex(r) + this.toHex(g) + this.toHex(b);
  }

  /**
   * 混合两个颜色
   */
  static blendColors(color1: string, color2: string, ratio: number): string {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return color1;

    const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
    const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
    const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);

    return this.rgbToHex(r, g, b);
  }

  /**
   * 获取对比色 (用于文字)
   */
  static getContrastColor(bgColor: string): string {
    const rgb = this.hexToRgb(bgColor);
    if (!rgb) return '#000000';

    // 计算亮度
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  /**
   * 检查颜色是否有效
   */
  static isValidColor(color: string): boolean {
    const hexRegex = /^#?([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
    return hexRegex.test(color);
  }

  /**
   * 颜色转 RGBA 字符串
   */
  static toRgba(color: string, alpha: number = 1): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  /**
   * HSL 转 RGB
   */
  static hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  /**
   * RGB 转 HSL
   */
  static rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return { h, s, l };
  }
}
